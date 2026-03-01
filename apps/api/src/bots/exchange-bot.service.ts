import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CcxtService } from '../ccxt/ccxt.service';
import { Signal, TradeBot } from '@prisma/client';
import { TradeBotDirection } from '@prisma/client';
import { PositionStatus } from '@prisma/client';
import {
  roundQuantity,
  roundPrice,
  directionToSide,
  findExistingPosition,
  getPositionSide,
} from '../utils/trading';

@Injectable()
export class ExchangeBotService {
  private readonly logger = new Logger(ExchangeBotService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ccxt: CcxtService,
  ) {}

  /**
   * Called after a new signal is created. Finds matching bots and tries to open positions.
   * Run asynchronously so webhook response is not blocked.
   */
  async tryOpenPositionsForSignal(signal: Omit<Signal, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    const direction = signal.direction?.trim().toUpperCase();
    if (direction !== 'LONG' && direction !== 'SHORT') {
      return;
    }

    const bots = await this.prisma.tradeBot.findMany({
      where: {
        ticker: signal.symbol,
        strategy: signal.strategy,
        OR: [
          { direction: TradeBotDirection.BOTH },
          { direction: direction as TradeBotDirection },
        ],
      },
      include: { exchange: true },
    });

    await Promise.allSettled(
      bots.map((bot) =>
        this.openPositionForBot(bot, signal).catch((err) => {
          this.logger.error(`Failed to open position for bot ${bot.id}:`, err instanceof Error ? err.message : err);
        }),
      ),
    );
  }

  /**
   * Open a position for one bot from a signal. Checks DB for existing open position,
   * then exchange positions; closes opposite if needed, then places market order and stores Position.
   */
  /**
   * Parse leverage from signal (e.g. "20" or "10"). Returns 0 if missing/invalid (no leverage param sent).
   */
  private parseLeverage(leverage: string | null | undefined): number {
    if (leverage == null || leverage === '') return 0;
    const n = parseInt(String(leverage).trim(), 10);
    return Number.isFinite(n) && n >= 1 && n <= 125 ? n : 0;
  }

  /**
   * Resolve user-facing symbol (e.g. "ETH", "BTC/USDT") to the exchange's market symbol.
   * Prefers futures/swap markets (perp) over spot so we open futures orders only.
   */
  private resolveSymbol(
    markets: Array<{
      symbol?: string;
      id?: string;
      base?: string;
      type?: string;
      swap?: boolean;
      future?: boolean;
    }>,
    symbol: string,
  ): string | null {
    const raw = symbol.trim();
    const upper = raw.toUpperCase();
    const isFutures = (m: (typeof markets)[0]) =>
      m.type === 'swap' || m.type === 'future' || m.swap === true || m.future === true;
    const matches = markets.filter((m) => {
      const s = (m.symbol ?? m.id ?? '').trim();
      const b = (m.base ?? '').trim().toUpperCase();
      return s === raw || s.toUpperCase() === upper || b === upper;
    });
    const preferred = matches.find(isFutures) ?? matches[0];
    return preferred ? (preferred.symbol ?? preferred.id ?? null) : null;
  }

  async openPositionForBot(
    bot: TradeBot & { exchange?: unknown },
    signal: Omit<Signal, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<void> {
    const direction = signal.direction!.trim().toUpperCase() as 'LONG' | 'SHORT';
    const symbol = signal.symbol;
    const exchangeId = bot.exchangeId;

    let markets: Array<{
      symbol?: string;
      id?: string;
      base?: string;
      precision?: { amount?: number; price?: number };
      precisionAmount?: number;
      precisionPrice?: number;
      limits?: { amount?: { min?: number } };
    }> = [];
    try {
      const now = Date.now();
      markets = (await this.ccxt.fetchMarkets(exchangeId)) as typeof markets;

      const end = Date.now();
      this.logger.log(`[ExchangeBot] ${exchangeId} Fetched markets in ${end - now}ms`);
    } catch (e) {
      this.logger.error('[ExchangeBot] Failed to fetch markets:', e);
      return;
    }

    const exchangeSymbol = this.resolveSymbol(markets, symbol);
    if (!exchangeSymbol) {
      this.logger.error(
        `[ExchangeBot] Exchange has no market for symbol "${symbol}". Use exchange symbol (e.g. ETH/USDT:US).`,
      );
      return;
    }

    // Skip if exchange already has an open position for this symbol and side
    let positions: unknown[] = [];
    let existingOnExchange: Record<string, unknown> | null = null;
    try {
      const now = Date.now();
      positions = await this.ccxt.fetchPositions(exchangeId, [exchangeSymbol]);
      const end = Date.now();
      this.logger.log(`[ExchangeBot] ${exchangeId} Fetched positions in ${end - now}ms`);
      existingOnExchange = findExistingPosition(
        positions,
        exchangeSymbol,
      );
      if (existingOnExchange && getPositionSide(existingOnExchange) === direction) {
        return;
      }
    } catch (e) {
      this.logger.warn(
        `[ExchangeBot] Failed to fetch positions for ${exchangeSymbol}, continuing:`,
        e instanceof Error ? e.message : String(e),
      );
    }

    let entryPrice: number;
    let stepSize: string | null = null;
    let tickSize: string | null = null;

    try {
      const now = Date.now();
      const ticker = (await this.ccxt.fetchTicker(exchangeId, exchangeSymbol)) as Record<
        string,
        unknown
      >;
      const end = Date.now();
      this.logger.log(`[ExchangeBot] ${exchangeId} Fetched ticker in ${end - now}ms`);
      const last = ticker.last ?? ticker.lastPrice ?? ticker.close ?? ticker.price;
      entryPrice = parseFloat(String(last));
      if (!Number.isFinite(entryPrice) || entryPrice <= 0) {
        this.logger.error('[ExchangeBot] Invalid ticker price:', ticker);
        return;
      }
    } catch (e) {
      this.logger.error('[ExchangeBot] Failed to fetch ticker:', e);
      return;
    }

    const market = markets.find(
      (m) => (m.symbol ?? m.id) === exchangeSymbol,
    );
    if (market?.precision) {
      if (typeof market.precision.amount === 'number') {
        stepSize = (10 ** -market.precision.amount).toString();
      }
      if (typeof market.precision.price === 'number') {
        tickSize = (10 ** -market.precision.price).toString();
      }
    }
    if (!stepSize && typeof market?.precisionAmount === 'number') {
      stepSize = (10 ** -market.precisionAmount).toString();
    }
    if (!tickSize && typeof market?.precisionPrice === 'number') {
      tickSize = (10 ** -market.precisionPrice).toString();
    }

    const minAmountRaw =
      market?.limits?.amount?.min != null && Number.isFinite(market.limits.amount.min)
        ? market.limits.amount.min
        : null;
    const minAmount = minAmountRaw != null ? minAmountRaw : (stepSize != null ? parseFloat(stepSize) : null);

    if (minAmountRaw != null && minAmountRaw > 0 && (!stepSize || parseFloat(stepSize) >= 1)) {
      stepSize = minAmountRaw.toString();
    }

    const positionSizeNum = parseFloat(signal.positionSize || '0');
    let quantity = positionSizeNum;
    if (!Number.isFinite(quantity) || quantity <= 0) {
      const amountUsd = parseFloat(bot.amount || '0');
      if (Number.isFinite(amountUsd) && amountUsd > 0 && entryPrice > 0) {
        quantity = amountUsd / entryPrice;
      } else {
        this.logger.error('[ExchangeBot] No valid positionSize or bot amount');
        return;
      }
    }
    let roundedQuantity = roundQuantity(String(quantity), stepSize);
    // Only clamp up to minAmount when the user requested at least minAmount (rounding may have brought it below).
    // Never increase size above the requested quantity (e.g. signal.positionSize 0.026 must not become 0.9998).
    if (
      minAmount != null &&
      minAmount > 0 &&
      roundedQuantity < minAmount &&
      quantity >= minAmount
    ) {
      roundedQuantity = roundQuantity(String(minAmount), stepSize) || minAmount;
    }
    if (roundedQuantity <= 0) {
      // Do not substitute stepSize when user requested a smaller size (e.g. positionSize 0.026) — would oversize the order.
      if (quantity > 0) {
        this.logger.error(
          '[ExchangeBot] Position size rounds to zero (below exchange step/min). Use a larger positionSize or check exchange limits. ' +
            `quantity=${quantity} stepSize=${stepSize ?? 'n/a'} minAmount=${minAmount ?? 'n/a'} symbol=${exchangeSymbol}`,
        );
        return;
      }
      this.logger.error(
        '[ExchangeBot] Rounded quantity <= 0. Increase positionSize or bot amount. ' +
          `quantity=${quantity} stepSize=${stepSize ?? 'n/a'} minAmount=${minAmount ?? 'n/a'} entryPrice=${entryPrice} symbol=${exchangeSymbol}`,
      );
      return;
    }

    if (existingOnExchange) {
      const existingSide = getPositionSide(existingOnExchange);
      if (existingSide === direction) {
        return;
      }
      try {
        await this.cancelOpenOrdersForSymbol(exchangeId, exchangeSymbol);
        const closeSize = Math.abs(
          parseFloat(
            String(
              existingOnExchange.netQuantity ??
                existingOnExchange.netExposureQuantity ??
                0,
            ),
          ),
        );
        const closeQuantity = roundQuantity(closeSize, stepSize);
        const closeSide = existingSide === 'LONG' ? 'sell' : 'buy';

        await this.ccxt.createOrder(
          exchangeId,
          exchangeSymbol,
          'market',
          closeSide,
          closeQuantity,
          undefined,
        );
        await new Promise((r) => setTimeout(r, 500));
      } catch (closeErr) {
        console.error('[ExchangeBot] Failed to close opposite position:', closeErr);
        return;
      }
    }

    const leverageNum = this.parseLeverage(signal.leverage);
    const exchangeType = (bot as { exchange?: { type: string } }).exchange?.type;
    const isBackpack = exchangeType === 'backpack';

    const tpROI = parseFloat(signal.tpROI || '0');
    const slROI = parseFloat(signal.slROI || '0');
    const leverageForROI = leverageNum > 0 ? leverageNum : 1;
    let tpTriggerPrice: number | null = null;
    let slTriggerPrice: number | null = null;
    if (Number.isFinite(tpROI) && tpROI > 0 && Number.isFinite(slROI) && slROI > 0) {
      if (direction === 'LONG') {
        tpTriggerPrice = entryPrice * (1 + tpROI / (100 * leverageForROI));
        slTriggerPrice = entryPrice * (1 - slROI / (100 * leverageForROI));
      } else {
        tpTriggerPrice = entryPrice * (1 - tpROI / (100 * leverageForROI));
        slTriggerPrice = entryPrice * (1 + slROI / (100 * leverageForROI));
      }
      if (tickSize != null) {
        tpTriggerPrice = roundPrice(tpTriggerPrice, tickSize);
        slTriggerPrice = roundPrice(slTriggerPrice, tickSize);
      }
    }

    const isHyperliquid = exchangeType === 'hyperliquid';
    const hasTpSl =
      tpTriggerPrice != null &&
      slTriggerPrice != null &&
      tpTriggerPrice > 0 &&
      slTriggerPrice > 0;

    const orderParams: Record<string, unknown> = {};
    if (!isBackpack && leverageNum > 0) {
      orderParams.leverage = leverageNum;
    }
    // Backpack (and others that support it) accept TP/SL in the same createOrder call.
    // Hyperliquid does not apply TP/SL from the batch reliably, so we attach them in separate calls.
    if (hasTpSl && !isHyperliquid) {
      orderParams.takeProfit = { triggerPrice: tpTriggerPrice };
      orderParams.stopLoss = { triggerPrice: slTriggerPrice };
    }

    const side = directionToSide(direction);
    const triggerSide = direction === 'LONG' ? 'sell' : 'buy';
    let orderResult: Record<string, unknown> | undefined;
    try {
      const now = Date.now();
      orderResult = (await this.ccxt.createOrder(
        exchangeId,
        exchangeSymbol,
        'market',
        side,
        roundedQuantity,
        entryPrice,
        Object.keys(orderParams).length > 0 ? orderParams : undefined,
      )) as Record<string, unknown>;
      const end = Date.now();
      this.logger.log(`[ExchangeBot] ${exchangeId} Created order in ${end - now}ms`);
    } catch (orderErr) {
      this.logger.error('[ExchangeBot] Failed to place order:', orderErr);
      return;
    }

    // Hyperliquid: place TP and SL as separate trigger orders (batch TP/SL is not applied).
    if (isHyperliquid && hasTpSl && tpTriggerPrice != null && slTriggerPrice != null) {
      try {
        const now = Date.now();
        await this.ccxt.createOrder(
          exchangeId,
          exchangeSymbol,
          'market',
          triggerSide,
          roundedQuantity,
          tpTriggerPrice,
          { takeProfitPrice: tpTriggerPrice, reduceOnly: true },
        );
        const end = Date.now();
        this.logger.log(`[ExchangeBot] ${exchangeId} Created TP order in ${end - now}ms`);
      } catch (tpErr) {
        this.logger.error('[ExchangeBot] Hyperliquid TP order failed:', tpErr);
      }
      try {
        const now = Date.now();
        await this.ccxt.createOrder(
          exchangeId,
          exchangeSymbol,
          'market',
          triggerSide,
          roundedQuantity,
          slTriggerPrice,
          { stopLossPrice: slTriggerPrice, reduceOnly: true },
        );
        const end = Date.now();
        this.logger.log(`[ExchangeBot] ${exchangeId} Created SL order in ${end - now}ms`);
      } catch (slErr) {
        this.logger.error('[ExchangeBot] Hyperliquid SL order failed:', slErr);
      }
    }

    // const externalOrderId = orderResult?.id != null ? String(orderResult.id) : undefined;
    // // Persist position in DB asynchronously so we don't block on DB before returning
    // this.prisma.position
    //   .create({
    //     data: {
    //       botId: bot.id,
    //       signalId: 'signal.id',
    //       exchangeId,
    //       symbol,
    //       side: direction,
    //       quantity: String(roundedQuantity),
    //       entryPrice: String(entryPrice),
    //       status: PositionStatus.OPEN,
    //       externalOrderId,
    //     },
    //   })
    //   .catch((err) =>
    //     console.error('[ExchangeBot] Failed to persist position to DB:', err),
    //   );
  }

  private async cancelOpenOrdersForSymbol(
    exchangeId: string,
    exchangeSymbol: string,
  ): Promise<void> {
    try {
      const orders = await this.ccxt.fetchOpenOrders(exchangeId, exchangeSymbol);
      for (const o of orders as Array<{ id?: string }>) {
        if (o.id) {
          await this.ccxt.cancelOrder(exchangeId, o.id, exchangeSymbol).catch(() => {});
        }
      }
    } catch {
      // ignore
    }
  }
}
