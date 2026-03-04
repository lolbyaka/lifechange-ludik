import { useState, useEffect } from 'react';
import type {
  RootExchange,
  CreateRootExchangeInput,
} from '../types/root-exchange';
import type { ExchangeType } from '../types/exchange';
import { EXCHANGE_TYPES } from '../types/exchange';
import { Input } from './ui/input';
import { Button } from './ui/button';

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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="admin-name" className="block text-sm font-medium text-foreground">
          Name <span className="text-slate-500">(optional)</span>
        </label>
        <Input
          id="admin-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Global Binance Config"
        />
      </div>

      <div>
        <label htmlFor="admin-type" className="block text-sm font-medium text-foreground">
          Exchange
        </label>
        <select
          id="admin-type"
          value={type}
          onChange={(e) => setType(e.target.value as ExchangeType)}
          className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {EXCHANGE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="admin-apiKey" className="block text-sm font-medium text-foreground">
          API Key
        </label>
        <Input
          id="admin-apiKey"
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          required
          placeholder="Your API key"
        />
      </div>

      <div>
        <label htmlFor="admin-secretKey" className="block text-sm font-medium text-foreground">
          Secret Key
        </label>
        <Input
          id="admin-secretKey"
          type="password"
          value={secretKey}
          onChange={(e) => setSecretKey(e.target.value)}
          required
          placeholder="Your secret key"
        />
      </div>

      <div>
        <label htmlFor="admin-passphrase" className="block text-sm font-medium text-foreground">
          Passphrase <span className="text-slate-500">(optional)</span>
        </label>
        <Input
          id="admin-passphrase"
          type="password"
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
          placeholder="e.g. for OKX"
        />
      </div>

      <div>
        <label htmlFor="admin-walletAddress" className="block text-sm font-medium text-foreground">
          Wallet address <span className="text-slate-500">(for Hyperliquid / DEX)</span>
        </label>
        <Input
          id="admin-walletAddress"
          type="text"
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
          placeholder="0x... (EVM address for Hyperliquid)"
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          type="submit"
          disabled={pending}
        >
          {pending ? 'Saving…' : isEdit ? 'Update' : 'Add'}
        </Button>
        <Button
          variant="outline"
          type="button"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

