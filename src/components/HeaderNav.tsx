import { AppTab, UserSession } from '../types/chopnow';

interface HeaderNavProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  session: UserSession;
  activeOrderCount: number;
  onOpenAuth: () => void;
}

export function HeaderNav({
  activeTab,
  onSelectTab,
  session,
  activeOrderCount,
  onOpenAuth,
}: HeaderNavProps) {
  const navItems: { id: AppTab; label: string }[] = [
    { id: 'feed', label: 'Browse Plates' },
    {
      id: 'orders',
      label: activeOrderCount > 0 ? `My Orders (${activeOrderCount})` : 'My Orders',
    },
    { id: 'post', label: 'Post Plate' },
    { id: 'kitchen', label: 'Seller Kitchen' },
  ];

  const firstName = session.fullName.split(' ')[0] || 'Account';

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-12 max-w-6xl items-center justify-between gap-8 px-4 md:h-16 md:px-6">
        <button
          type="button"
          onClick={() => onSelectTab('feed')}
          className="font-display shrink-0 whitespace-nowrap text-xl font-extrabold tracking-tight text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
        >
          ChopNow
        </button>

        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-6 md:flex"
        >
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`shrink-0 whitespace-nowrap border-b-2 py-5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
                  isActive
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center">
          <button
            type="button"
            onClick={onOpenAuth}
            className="min-h-[40px] shrink-0 whitespace-nowrap rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 active:scale-[0.98] md:text-sm"
          >
            {firstName} · {session.role === 'seller' ? 'Seller' : 'Buyer'}
          </button>
        </div>
      </div>
    </header>
  );
}
