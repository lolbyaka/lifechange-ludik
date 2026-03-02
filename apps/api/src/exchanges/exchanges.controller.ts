import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ExchangesService } from './exchanges.service';
import { CcxtService } from '../ccxt/ccxt.service';
import { CreateExchangeDto } from './dto/create-exchange.dto';
import { UpdateExchangeDto } from './dto/update-exchange.dto';

@Controller('exchanges')
export class ExchangesController {
  constructor(
    private readonly exchangesService: ExchangesService,
    private readonly ccxtService: CcxtService,
  ) {}

  @Post()
  create(@Body() createExchangeDto: CreateExchangeDto) {
    return this.exchangesService.create(createExchangeDto);
  }

  @Get()
  findAll() {
    return this.exchangesService.findAll();
  }

  /** Load markets for all exchanges (force refresh from each exchange). */
  @Post('load-markets')
  async loadAllMarkets() {
    const exchanges = await this.exchangesService.findAll();
    const results = await Promise.allSettled(
      exchanges.map((ex) =>
        this.ccxtService.refreshMarkets(ex.id).then((markets) => ({
          exchangeId: ex.id,
          name: ex.name ?? ex.type,
          count: Array.isArray(markets) ? markets.length : 0,
        })),
      ),
    );
    return results.map((r, i) =>
      r.status === 'fulfilled'
        ? { ...r.value, success: true as const }
        : {
            exchangeId: exchanges[i].id,
            name: exchanges[i].name ?? exchanges[i].type,
            success: false as const,
            error: (r as PromiseRejectedResult).reason?.message ?? String((r as PromiseRejectedResult).reason),
          },
    );
  }

  // --- CCXT API (must be declared before :id so path segments like "balance" are not treated as id) ---

  @Get(':id/balance')
  getBalance(@Param('id') id: string) {
    return this.ccxtService.fetchBalance(id);
  }

  @Get(':id/positions')
  getPositions(
    @Param('id') id: string,
    @Query('symbols') symbols?: string,
  ) {
    const symbolList = symbols ? symbols.split(',').map((s) => s.trim()) : undefined;
    return this.ccxtService.fetchPositions(id, symbolList);
  }

  @Get(':id/markets')
  getMarkets(@Param('id') id: string) {
    return this.ccxtService.getMarketsWithMeta(id);
  }

  /** Force-load (refresh) markets from the exchange and cache them. */
  @Post(':id/markets/load')
  loadMarkets(@Param('id') id: string) {
    return this.ccxtService.refreshMarkets(id);
  }

  @Get(':id/tickers')
  getTickers(
    @Param('id') id: string,
    @Query('symbols') symbols?: string,
  ) {
    const symbolList = symbols ? symbols.split(',').map((s) => s.trim()) : undefined;
    return this.ccxtService.fetchTickers(id, symbolList);
  }

  @Get(':id/ticker/:symbol')
  getTicker(@Param('id') id: string, @Param('symbol') symbol: string) {
    return this.ccxtService.fetchTicker(id, decodeURIComponent(symbol));
  }

  @Get(':id/orders')
  getOpenOrders(
    @Param('id') id: string,
    @Query('symbol') symbol?: string,
  ) {
    return this.ccxtService.fetchOpenOrders(id, symbol);
  }

  @Post(':id/orders')
  createOrder(
    @Param('id') id: string,
    @Body()
    body: { symbol: string; type: string; side: string; amount: number; price?: number },
  ) {
    return this.ccxtService.createOrder(
      id,
      body.symbol,
      body.type,
      body.side,
      body.amount,
      body.price,
    );
  }

  @Delete(':id/orders/:orderId')
  cancelOrder(
    @Param('id') id: string,
    @Param('orderId') orderId: string,
    @Query('symbol') symbol?: string,
  ) {
    return this.ccxtService.cancelOrder(id, orderId, symbol);
  }

  // --- CRUD ---

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.exchangesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateExchangeDto: UpdateExchangeDto) {
    return this.exchangesService.update(id, updateExchangeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.exchangesService.remove(id);
  }
}
