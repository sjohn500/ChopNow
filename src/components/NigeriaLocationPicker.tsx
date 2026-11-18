import { Compass, MapPin, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  formatNigeriaLocation,
  NIGERIA_STATES,
  parseNigeriaLocation,
  TOTAL_NIGERIA_LGAS,
} from '../data/nigeriaLocations';

interface NigeriaLocationPickerProps {
  value: string;
  onChange: (nextLocation: string) => void;
  onUseGps?: () => void;
  isLocating?: boolean;
  label?: string;
  compact?: boolean;
}

export function NigeriaLocationPicker({
  value,
  onChange,
  onUseGps,
  isLocating = false,
  label = 'State & Local Government Area (All 36 States + FCT)',
  compact = false,
}: NigeriaLocationPickerProps) {
  const [search, setSearch] = useState('');
  const parsed = useMemo(() => parseNigeriaLocation(value), [value]);

  const currentStateObj = useMemo(
    () =>
      NIGERIA_STATES.find((s) => s.state === parsed.state) ??
      NIGERIA_STATES[24],
    [parsed.state]
  );

  const searchMatches = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    const results: { state: string; lga: string }[] = [];
    for (const s of NIGERIA_STATES) {
      const stateMatch = s.state.toLowerCase().includes(q);
      for (const lga of s.lgas) {
        if (stateMatch || lga.toLowerCase().includes(q)) {
          results.push({ state: s.state, lga });
          if (results.length >= 24) return results;
        }
      }
    }
    return results;
  }, [search]);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-text-primary">{label}</span>
        {onUseGps && (
          <button
            type="button"
            onClick={onUseGps}
            disabled={isLocating}
            className="inline-flex shrink-0 cursor-pointer items-center gap-1 text-xs font-semibold text-primary hover:text-primary-dark hover:underline disabled:opacity-60"
          >
            <Compass className="h-3.5 w-3.5" />
            {isLocating ? 'Locating...' : 'Use GPS'}
          </button>
        )}
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 h-3.5 w-3.5 -translate-y-1/2 text-text-secondary" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search any State or ${TOTAL_NIGERIA_LGAS} LGAs...`}
          aria-label="Search Nigerian state or local government"
          className={`w-full rounded-[14px] border border-border-soft bg-surface pr-3 pl-9 text-xs text-text-primary transition-all duration-150 placeholder:text-text-secondary/75 focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none ${
            compact ? 'min-h-[40px]' : 'min-h-[44px]'
          }`}
        />
      </div>

      {search.trim() ? (
        <div className="max-h-44 space-y-1 overflow-y-auto rounded-[14px] border border-border-soft bg-bg p-1.5">
          {searchMatches.length === 0 ? (
            <p className="px-2 py-3 text-center text-xs text-text-secondary">
              No Nigerian State or LGA matched &ldquo;{search}&rdquo;.
            </p>
          ) : (
            searchMatches.map((m) => {
              const formatted = formatNigeriaLocation(m.lga, m.state);
              const isSelected = formatted === value;
              return (
                <button
                  key={formatted}
                  type="button"
                  onClick={() => {
                    onChange(formatted);
                    setSearch('');
                  }}
                  className={`flex min-h-[38px] w-full cursor-pointer items-center justify-between rounded-[12px] px-2.5 text-left text-xs font-semibold transition-colors ${
                    isSelected
                      ? 'bg-primary text-white'
                      : 'text-text-primary hover:bg-primary-soft'
                  }`}
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <MapPin className="h-3 w-3 shrink-0 opacity-75" />
                    <span className="truncate">{m.lga}</span>
                  </span>
                  <span
                    className={`shrink-0 text-[11px] ${
                      isSelected ? 'text-white' : 'text-text-secondary'
                    }`}
                  >
                    {m.state}
                  </span>
                </button>
              );
            })
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary">
              State ({NIGERIA_STATES.length})
            </label>
            <select
              aria-label="Select Nigerian State"
              value={currentStateObj.state}
              onChange={(e) => {
                const nextState =
                  NIGERIA_STATES.find((s) => s.state === e.target.value) ??
                  NIGERIA_STATES[0];
                onChange(
                  formatNigeriaLocation(nextState.capitalLga, nextState.state)
                );
              }}
              className={`w-full rounded-[14px] border border-border-soft bg-surface px-2.5 text-xs font-semibold text-text-primary transition-all duration-150 focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none ${
                compact ? 'min-h-[42px]' : 'min-h-[46px]'
              }`}
            >
              {NIGERIA_STATES.map((s) => (
                <option key={s.state} value={s.state}>
                  {s.state === 'FCT' ? 'FCT (Abuja)' : `${s.state} State`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary">
              LGA ({currentStateObj.lgas.length})
            </label>
            <select
              aria-label="Select Local Government Area"
              value={parsed.lga}
              onChange={(e) =>
                onChange(
                  formatNigeriaLocation(e.target.value, currentStateObj.state)
                )
              }
              className={`w-full rounded-[14px] border border-border-soft bg-surface px-2.5 text-xs font-semibold text-text-primary transition-all duration-150 focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none ${
                compact ? 'min-h-[42px]' : 'min-h-[46px]'
              }`}
            >
              {currentStateObj.lgas.map((lga) => (
                <option key={lga} value={lga}>
                  {lga}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
