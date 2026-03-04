import { useState, useEffect } from 'react';
import type {
  RootExchange,
  CreateRootExchangeInput,
} from '../types/root-exchange';
import type { ExchangeType } from '../types/exchange';
import { EXCHANGE_TYPES } from '../types/exchange';

interface RootExchangeFormProps {
  exchange: RootExchange | null;
  onSubmit: (data: CreateRootExchangeInput) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function RootExchangeForm({
  exchange,
  onSubmit,
  onCancel,
  isLoading = false,
}: RootExchangeFormProps) {
  const [name, setName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [type, setType] = useState<ExchangeType>('binance');

  const isEdit = !!exchange;

  useEffect(() => {
    if (exchange) {
      setName(exchange.name ?? '');
      setApiKey(exchange.apiKey);
      setSecretKey(exchange.secretKey);
      setPassphrase(exchange.passphrase ?? '');
      setWalletAddress(exchange.walletAddress ?? '');
      setType(exchange.type);
    }
  }, [exchange]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: name.trim() || undefined,
      apiKey,
      secretKey,
      passphrase: passphrase || undefined,
      walletAddress: walletAddress.trim() || undefined,
      type,
    });
  };

  const pending = isLoading;

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-slate-700/50 bg-slate-900/30 p-4 space-y-4"
    >
      <h3 className="font-medium text-slate-200">
        {isEdit ? 'Edit root exchange' : 'Add root exchange'}
      </h3>

      <div>
        <label htmlFor="admin-name" className="block text-sm font-medium text-slate-400">
          Name <span className="text-slate-500">(optional)</span>
        </label>
        <input
          id="admin-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          placeholder="e.g. Global Binance Config"
        />
      </div>

      <div>
        <label htmlFor="admin-type" className="block text-sm font-medium text-slate-400">
          Exchange
        </label>
        <select
          id="admin-type"
          value={type}
          onChange={(e) => setType(e.target.value as ExchangeType)}
          className="mt-1 block w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          {EXCHANGE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="admin-apiKey" className="block text-sm font-medium text-slate-400">
          API Key
        </label>
        <input
          id="admin-apiKey"
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          placeholder="Your API key"
        />
      </div>

      <div>
        <label htmlFor="admin-secretKey" className="block text-sm font-medium text-slate-400">
          Secret Key
        </label>
        <input
          id="admin-secretKey"
          type="password"
          value={secretKey}
          onChange={(e) => setSecretKey(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          placeholder="Your secret key"
        />
      </div>

      <div>
        <label htmlFor="admin-passphrase" className="block text-sm font-medium text-slate-400">
          Passphrase <span className="text-slate-500">(optional)</span>
        </label>
        <input
          id="admin-passphrase"
          type="password"
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
          className="mt-1 block w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          placeholder="e.g. for OKX"
        />
      </div>

      <div>
        <label htmlFor="admin-walletAddress" className="block text-sm font-medium text-slate-400">
          Wallet address <span className="text-slate-500">(for Hyperliquid / DEX)</span>
        </label>
        <input
          id="admin-walletAddress"
          type="text"
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
          className="mt-1 block w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          placeholder="0x... (EVM address for Hyperliquid)"
        />
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {pending ? 'Saving…' : isEdit ? 'Update' : 'Add'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-slate-600 bg-slate-800 px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-slate-700"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

