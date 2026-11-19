import { Minus, Plus, ShoppingBag, Trash2, X, ArrowRight, Sparkles, Tag } from 'lucide-react';
import { CartItem } from '../types';
import { ResilientImage } from './ResilientImage';

interface CartDrawerProps {
  isOpen: boolean;
  items: CartItem[];
  promoApplied: boolean;
  activeAffiliateCode: string;
  onClose: () => void;
  onUpdateQty: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: () => void;
}

export function CartDrawer({
  isOpen,
  items,
  promoApplied,
  activeAffiliateCode,
  onClose,
  onUpdateQty,
  onRemoveItem,
  onCheckout,
}: CartDrawerProps) {
  if (!isOpen) return null;

  const subtotal = items.reduce(
    (sum, item) => sum + item.product.priceNpr * item.quantity,
    0
  );

  const discount = activeAffiliateCode ? Math.round(subtotal * 0.1) : 0;
  const total = Math.max(0, subtotal - discount);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-[#12141C]/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Shopping Bag"
    >
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <aside className="relative z-10 w-full max-w-md bg-[#FAF8F5] h-full flex flex-col border-l border-[#12141C]/10 shadow-2xl">
        <div className="px-6 py-5 border-b border-[#12141C]/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-[#153B24]" />
            <h2 className="font-display text-xl font-semibold text-[#12141C]">
              CareNest SkinAid Bag
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close bag"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-[#12141C]/70 hover:text-[#12141C] hover:bg-[#12141C]/5 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {items.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <ShoppingBag className="w-10 h-10 mx-auto text-[#12141C]/25" />
              <p className="font-display text-lg text-[#12141C]">
                Your SkinAid bag is empty
              </p>
              <p className="text-sm text-[#12141C]/60 max-w-xs mx-auto">
                Explore science-backed SkinAid sunscreens, herbal cleansers, repairing toners, and night treatments.
              </p>
            </div>
          ) : (
            <>
              <div className="p-3.5 rounded-xl bg-white border border-[#12141C]/10 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-[#12141C]">
                    {subtotal >= 2500
                      ? 'Free Chitwan Lab Travel Rose Mist Unlocked'
                      : `Add NPR ${(2500 - subtotal).toLocaleString()} more for Free Rose Mist`}
                  </span>
                  <span className="font-mono text-[11px] font-semibold text-[#153B24] tabular-nums">
                    {Math.min(100, Math.round((subtotal / 2500) * 100))}%
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-[#EFEAE3] overflow-hidden">
                  <div
                    style={{
                      width: `${Math.min(100, Math.round((subtotal / 2500) * 100))}%`,
                    }}
                    className="h-full rounded-full bg-[#153B24] transition-all duration-300"
                  />
                </div>
              </div>

              {promoApplied && (
                <div className="p-3.5 rounded-xl bg-[#153B24] text-white flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                  <div className="text-xs leading-relaxed">
                    <p className="font-semibold">
                      SkinAid Bundle Gift Unlocked
                    </p>
                    <p className="text-white/80">
                      Complimentary travel-size Rose Water Hydrosol Mist packed with your SkinAid order.
                    </p>
                  </div>
                </div>
              )}

              {activeAffiliateCode && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <Tag className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Partner Link Benefit Active</span>
                  </span>
                  <span className="font-mono font-semibold">10% Off</span>
                </div>
              )}

              <ul className="divide-y divide-[#12141C]/10">
                {items.map(({ product, quantity }) => (
                  <li key={product.id} className="py-4 flex gap-4">
                    <ResilientImage
                      src={product.image}
                      alt={product.name}
                      fallbackTitle={product.shortName}
                      className={`w-20 h-20 rounded-xl shrink-0 border border-[#12141C]/10 ${
                        product.isPackshot
                          ? 'object-contain bg-[#F3EFE9] p-1.5'
                          : 'object-cover'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs text-[#12141C]/55">
                            {product.brandLine} · {product.volume}
                          </p>
                          <h3 className="text-sm font-semibold text-[#12141C] truncate">
                            {product.shortName}
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemoveItem(product.id)}
                          aria-label={`Remove ${product.shortName}`}
                          className="p-1.5 text-[#12141C]/45 hover:text-[#9E1B24] cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="inline-flex items-center border border-[#12141C]/15 rounded-lg bg-white">
                          <button
                            type="button"
                            onClick={() => onUpdateQty(product.id, -1)}
                            aria-label="Decrease quantity"
                            className="w-8 h-8 flex items-center justify-center text-[#12141C] hover:bg-[#FAF8F5] cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-2.5 text-xs font-mono font-medium tabular-nums">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQty(product.id, 1)}
                            aria-label="Increase quantity"
                            className="w-8 h-8 flex items-center justify-center text-[#12141C] hover:bg-[#FAF8F5] cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <p className="text-sm font-mono font-semibold text-[#12141C] tabular-nums">
                          NPR {(product.priceNpr * quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {items.length > 0 && (
          <div className="p-6 border-t border-[#12141C]/10 bg-white space-y-4">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-[#12141C]/65">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums">
                  NPR {subtotal.toLocaleString()}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Member Savings (10%)</span>
                  <span className="font-mono tabular-nums">
                    -NPR {discount.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-[#12141C]/65">
                <span>Nepal Express Delivery</span>
                <span className="font-medium text-emerald-700">Free</span>
              </div>
              <div className="flex justify-between text-base font-semibold text-[#12141C] pt-2 border-t border-[#12141C]/10">
                <span>Total</span>
                <span className="font-mono tabular-nums">
                  NPR {total.toLocaleString()}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onCheckout}
              className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-[#9E1B24] hover:bg-[#82141C] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>Express Checkout in Nepal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
