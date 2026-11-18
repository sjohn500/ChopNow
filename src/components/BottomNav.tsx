import { Camera, ClipboardList, Store, Utensils } from 'lucide-react';
import { AppTab } from '../types/chopnow';

interface BottomNavProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  activeOrderCount: number;
  kitchenQueueCount: number;
}

export function BottomNav({
  activeTab,
  onSelectTab,
  activeOrderCount,
  kitchenQueueCount,
}: BottomNavProps) {
  const tabs: {
    id: AppTab;
    label: string;
    icon: typeof Utensils;
    count?: number;
  }[] = [
    { id: 'feed', label: 'Feed', icon: Utensils },
    { id: 'orders', label: 'Orders', icon: ClipboardList, count: activeOrderCount },
    { id: 'post', label: 'Post', icon: Camera },
    { id: 'kitchen', label: 'Kitchen', icon: Store, count: kitchenQueueCount },
  ];

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed right-0 bottom-0 left-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-md md:hidden"
    >
      <div className="grid h-14 grid-cols-4 items-center">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`flex min-h-[44px] flex-col items-center justify-center gap-0.5 px-1 transition-colors ${
                isActive ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.4 : 1.9} />
                {typeof tab.count === 'number' && tab.count > 0 && (
                  <span className="font-mono-num ml-1 text-[10px] font-semibold text-emerald-700">
                    ({tab.count})
                  </span>
                )}
              </div>
              <span className="whitespace-nowrap text-[11px] font-medium tracking-tight">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
