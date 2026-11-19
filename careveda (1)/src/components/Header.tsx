import { LogIn, LogOut, ShieldCheck, ShoppingBag, Sparkles, User } from 'lucide-react';
import { PortalView } from '../types';

interface HeaderProps {
  activePortal: PortalView;
  onSelectPortal: (portal: PortalView) => void;
  cartCount: number;
  onOpenBag: () => void;
  isShopperSignedIn: boolean;
  shopperName: string;
  creatorPartnerId?: string;
  onOpenAuth: (mode: 'signin' | 'signup') => void;
  onSignOutInternal: () => void;
}

const SHOPPER_NAV: Array<{ id: PortalView; label: string }> = [
  { id: 'store', label: 'Store' },
  { id: 'shopper', label: 'My Account' },
];

export function Header({
  activePortal,
  onSelectPortal,
  cartCount,
  onOpenBag,
  isShopperSignedIn,
  shopperName,
  creatorPartnerId,
  onOpenAuth,
  onSignOutInternal,
}: HeaderProps) {
  const isInternalWorkspace =
    activePortal === 'creator' || activePortal === 'admin';
  const firstName = shopperName.trim().split(' ')[0] || 'Account';

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#12141C]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-3 sm:gap-6">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => onSelectPortal('store')}
          className="inline-flex items-baseline gap-1.5 text-left whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#153B24] group"
        >
          <span className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-[#153B24] group-hover:text-[#9E1B24] transition-colors">
            Skin AID
          </span>
          <span className="text-[11px] font-medium tracking-wide text-[#12141C]/60">
            by CareNest
          </span>
        </button>

        {/* Zone 2: Customer navigation (Store & My Account) OR Dedicated Workspace Label */}
        {isInternalWorkspace ? (
          <div className="flex items-center gap-3 text-xs sm:text-sm font-medium text-[#12141C] min-w-0">
            {activePortal === 'creator' ? (
              <span className="inline-flex items-center gap-1.5 text-[#153B24] font-semibold truncate">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span className="truncate">
                  Creator Studio{creatorPartnerId ? ` · ${creatorPartnerId}` : ''}
                </span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[#9E1B24] font-semibold truncate">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span className="truncate">CareNest Admin Console</span>
              </span>
            )}
          </div>
        ) : (
          <nav
            aria-label="Storefront navigation"
            className="flex items-center gap-4 sm:gap-7 overflow-x-auto no-scrollbar"
          >
            {SHOPPER_NAV.map((item) => {
              const isActive = activePortal === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectPortal(item.id)}
                  className={`relative py-2 px-1 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[40px] flex items-center focus-visible:outline-2 focus-visible:outline-[#153B24] ${
                    isActive
                      ? 'text-[#153B24] font-semibold'
                      : 'text-[#12141C]/65 hover:text-[#12141C]'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#153B24]"
                    />
                  )}
                </button>
              );
            })}
          </nav>
        )}

        {/* Zone 3: Auth & Bag OR Exit Workspace */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {isInternalWorkspace ? (
            <button
              type="button"
              onClick={onSignOutInternal}
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-lg border border-[#12141C]/15 bg-white hover:border-[#9E1B24] hover:text-[#9E1B24] text-[#12141C] text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[40px]"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out &amp; Exit</span>
            </button>
          ) : (
            <>
              {isShopperSignedIn ? (
                <button
                  type="button"
                  onClick={() => onSelectPortal('shopper')}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#12141C]/15 bg-white hover:border-[#153B24] text-xs font-medium text-[#12141C] transition-colors whitespace-nowrap cursor-pointer min-h-[40px]"
                >
                  <User className="w-3.5 h-3.5 text-[#153B24]" />
                  <span>{firstName}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onOpenAuth('signin')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#12141C]/15 bg-white hover:border-[#153B24] text-xs sm:text-sm font-medium text-[#12141C] transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[40px]"
                >
                  <LogIn className="w-3.5 h-3.5 text-[#153B24]" />
                  <span>Sign In</span>
                </button>
              )}

              <button
                type="button"
                onClick={onOpenBag}
                className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-lg bg-[#153B24] text-white text-xs sm:text-sm font-medium hover:bg-[#9E1B24] transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[40px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#153B24]"
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="tabular-nums">Bag ({cartCount})</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}


