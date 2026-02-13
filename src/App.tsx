import { useEffect } from 'react';
import { useBoardStore } from './store/useBoardStore';
import { Curtain } from './components/Curtain';
import { Board } from './components/Board';
import { EyeOff, Moon, Sun, Loader2 } from 'lucide-react';
import { Logo } from './components/Logo';
import { SearchBar } from './components/SearchBar';
import { QuickDock } from './components/QuickDock';

function App() {
  const isRevealed = useBoardStore((state) => state.isRevealed);
  const setRevealed = useBoardStore((state) => state.setRevealed);
  const theme = useBoardStore((state) => state.theme);
  const toggleTheme = useBoardStore((state) => state.toggleTheme);
  const _hasHydrated = useBoardStore((state) => state._hasHydrated);

  // Apply dark mode class to html element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Show loading screen while storage is hydrating
  if (!_hasHydrated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <Logo className="w-24 h-24 drop-shadow-2xl" />
          </div>
          <div className="flex items-center justify-center gap-3 text-blue-400">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-lg font-semibold">Loading Kan-Opener...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-300 flex flex-col font-sans">
      <Curtain />

      {/* Header */}
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-6 z-10 shrink-0 relative">
        <div className="flex items-center space-x-3 text-blue-600 dark:text-blue-400">
          <div className="w-8 h-8">
            <Logo className="w-full h-full" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100 hidden md:block">Kan-Opener</h1>
        </div>

        {/* Center Group: Search + QuickDock */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center gap-6">
          <div className="w-64">
            <SearchBar />
          </div>
          <QuickDock readOnly={false} />
        </div>

        <div className="flex items-center space-x-4">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-full transition-colors"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Re-lock Button */}
          {isRevealed && (
            <button
              onClick={() => setRevealed(false)}
              className="p-2 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-full transition-colors"
              title="Hide Board (Privacy Mode)"
            >
              <EyeOff size={20} />
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/40 via-transparent to-transparent dark:from-blue-900/10 pointer-events-none" />
        <Board />
      </main>
    </div>
  );
}

export default App;
