import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import { Button } from './components/ui/button';
import { Exchanges } from './components/Exchanges';
import { ExchangeDetail } from './components/ExchangeDetail';
import { Webhooks } from './components/Webhooks';
import { WebhookDetail } from './components/WebhookDetail';
import { Signals } from './components/Signals';
import { SignalDetail } from './components/SignalDetail';
import { BotDetail } from './components/BotDetail';
import { Admin } from './components/Admin';
import { AdminExchangeDetail } from './components/AdminExchangeDetail';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `inline-flex items-center justify-center rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-primary text-primary-foreground'
      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
  }`;

function App() {
  const [isDark, setIsDark] = useState(false);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = window.document.documentElement;
    const stored = window.localStorage.getItem('theme');
    if (stored === 'dark' || stored === 'light') {
      const dark = stored === 'dark';
      setIsDark(dark);
      root.classList.toggle('dark', dark);
      return;
    }
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
    setIsDark(prefersDark);
    root.classList.toggle('dark', prefersDark);
  }, []);

  // Apply theme when toggled
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = window.document.documentElement;
    root.classList.toggle('dark', isDark);
    window.localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <header className="border-b bg-background/80 backdrop-blur">
          <div className="mx-auto max-w-4xl px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <h1 className="text-xl font-semibold tracking-tight text-foreground">
                Lifechange Ludik
              </h1>
              <div className="flex items-center gap-3">
                <nav className="flex gap-1 rounded-full bg-muted/40 p-1">
                  <NavLink to="/" end className={navLinkClass}>
                    Exchanges
                  </NavLink>
                  <NavLink to="/webhooks" className={navLinkClass}>
                    Webhooks
                  </NavLink>
                  <NavLink to="/signals" className={navLinkClass}>
                    Signals
                  </NavLink>
                  <NavLink to="/admin" className={navLinkClass}>
                    Admin
                  </NavLink>
                </nav>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={toggleTheme}
                  aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {isDark ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </div>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-4xl px-4 py-8">
          <Routes>
            <Route path="/" element={<Exchanges />} />
            <Route path="/exchanges/:id" element={<ExchangeDetail />} />
            <Route path="/exchanges/:exchangeId/bots/:id" element={<BotDetail />} />
            <Route path="/webhooks" element={<Webhooks />} />
            <Route path="/webhooks/:id" element={<WebhookDetail />} />
            <Route path="/signals" element={<Signals />} />
            <Route path="/signals/:id" element={<SignalDetail />} />
            <Route path="/bots/:id" element={<BotDetail />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/exchange/:id" element={<AdminExchangeDetail />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
