import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { Exchanges } from './components/Exchanges';
import { ExchangeDetail } from './components/ExchangeDetail';
import { Webhooks } from './components/Webhooks';
import { WebhookDetail } from './components/WebhookDetail';
import { Signals } from './components/Signals';
import { SignalDetail } from './components/SignalDetail';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
    isActive
      ? 'bg-slate-700 text-slate-100'
      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
  }`;

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <header className="border-b border-slate-800 bg-slate-900/50">
          <div className="mx-auto max-w-4xl px-4 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold tracking-tight text-slate-100">
                Lifechange Ludik
              </h1>
              <nav className="flex gap-1">
                <NavLink to="/" end className={navLinkClass}>
                  Exchanges
                </NavLink>
                <NavLink to="/webhooks" className={navLinkClass}>
                  Webhooks
                </NavLink>
                <NavLink to="/signals" className={navLinkClass}>
                  Signals
                </NavLink>
              </nav>
            </div>
            <p className="mt-0.5 text-sm text-slate-400">
              Exchange connections & webhook receiver
            </p>
          </div>
        </header>
        <main className="mx-auto max-w-4xl px-4 py-8">
          <Routes>
            <Route path="/" element={<Exchanges />} />
            <Route path="/exchanges/:id" element={<ExchangeDetail />} />
            <Route path="/webhooks" element={<Webhooks />} />
            <Route path="/webhooks/:id" element={<WebhookDetail />} />
            <Route path="/signals" element={<Signals />} />
            <Route path="/signals/:id" element={<SignalDetail />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
