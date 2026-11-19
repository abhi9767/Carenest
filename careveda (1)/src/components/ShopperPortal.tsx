import { FormEvent, useEffect, useState } from 'react';
import {
  ArrowRight,
  CalendarCheck,
  Check,
  CheckCircle2,
  Heart,
  LayoutDashboard,
  Lock,
  LogIn,
  LogOut,
  MapPin,
  PackageCheck,
  Plus,
  QrCode,
  RefreshCw,
  Search,
  ShoppingBag,
  Sparkles,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import {
  BATCH_PASSPORTS,
  SKINAID_BUNDLES,
  SKIN_CONCERN_PROTOCOLS,
} from '../data/carenestData';
import {
  Order,
  OrderStatus,
  PaymentMethod,
  Product,
  RoutineStep,
  ShopperProfile,
} from '../types';
import { ResilientImage } from './ResilientImage';
import { BatchQrCode } from './BatchQrCode';

interface ShopperPortalProps {
  profile: ShopperProfile;
  orders: Order[];
  products: Product[];
  savedProductIds: string[];
  routineSteps: RoutineStep[];
  hasPartnerSavings: boolean;
  onUpdateProfile: (next: ShopperProfile) => void;
  onToggleSaveProduct: (productId: string) => void;
  onAddToCart: (product: Product) => void;
  onAddBundleToCart: (productIds: string[]) => void;
  onReorderOrder: (order: Order) => void;
  onToggleRoutineStep: (stepId: string) => void;
  onAddRoutineStep: (payload: {
    title: string;
    productName: string;
    timeOfDay: 'Morning' | 'Midday' | 'Night';
    scheduledTime: string;
  }) => void;
  onOpenStoreShop: () => void;
  onOpenBatchScanner: (batchCode: string) => void;
  onOpenFullTracker: () => void;
  isAuthenticated: boolean;
  onOpenAuth: (mode: 'signin' | 'signup') => void;
  onSignOut: () => void;
}

type ShopperSection =
  | 'overview'
  | 'orders'
  | 'saved'
  | 'routine'
  | 'perks'
  | 'account';

const SHOPPER_NAV: Array<{
  id: ShopperSection;
  label: string;
  icon: typeof LayoutDashboard;
}> = [
  { id: 'overview', label: 'My Overview', icon: LayoutDashboard },
  { id: 'orders', label: 'Orders & Delivery', icon: PackageCheck },
  { id: 'saved', label: 'Saved Skin AID', icon: Heart },
  { id: 'routine', label: 'AM/PM Regimen', icon: CalendarCheck },
  { id: 'perks', label: 'Batch COA Passports', icon: QrCode },
  { id: 'account', label: 'Address & Skin Profile', icon: UserCheck },
];

const ORDER_STAGES: OrderStatus[] = [
  'Packing in Lab',
  'Dispatched',
  'Delivered',
];

export function ShopperPortal({
  profile,
  orders,
  products,
  savedProductIds,
  routineSteps,
  hasPartnerSavings,
  onUpdateProfile,
  onToggleSaveProduct,
  onAddToCart,
  onAddBundleToCart,
  onReorderOrder,
  onToggleRoutineStep,
  onAddRoutineStep,
  onOpenStoreShop,
  onOpenBatchScanner,
  onOpenFullTracker,
  isAuthenticated,
  onOpenAuth,
  onSignOut,
}: ShopperPortalProps) {
  const [section, setSection] = useState<ShopperSection>('overview');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderFilter, setOrderFilter] = useState<'All' | OrderStatus>('All');
  const [reorderedId, setReorderedId] = useState<string | null>(null);
  const [addedSavedId, setAddedSavedId] = useState<string | null>(null);

  // Regimen builder state
  const [selectedConcernId, setSelectedConcernId] = useState<string>(
    SKIN_CONCERN_PROTOCOLS[0].id
  );
  const [newStepTitle, setNewStepTitle] = useState('');
  const [newStepProduct, setNewStepProduct] = useState(
    products[0]?.shortName || 'Herbo-Mineral Tinted Sunscreen SPF 50+'
  );
  const [newStepTime, setNewStepTime] = useState<
    'Morning' | 'Midday' | 'Night'
  >('Night');

  // Account form state
  const [fullName, setFullName] = useState(profile.fullName);
  const [phone, setPhone] = useState(profile.phone);
  const [city, setCity] = useState(profile.city);
  const [address, setAddress] = useState(profile.address);
  const [skinFocus, setSkinFocus] = useState(profile.skinFocus);
  const [preferredPayment, setPreferredPayment] = useState<PaymentMethod>(
    profile.preferredPayment
  );
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  useEffect(() => {
    setFullName(profile.fullName);
    setPhone(profile.phone);
    setCity(profile.city);
    setAddress(profile.address);
    setSkinFocus(profile.skinFocus);
    setPreferredPayment(profile.preferredPayment);
  }, [profile]);

  const savedProducts = products.filter((p) => savedProductIds.includes(p.id));
  const activeOrders = orders.filter((o) => o.status !== 'Delivered');
  const latestOrder = orders[0];
  const completedSteps = routineSteps.filter((s) => s.completed).length;
  const routinePct =
    routineSteps.length > 0
      ? Math.round((completedSteps / routineSteps.length) * 100)
      : 0;
  const totalSavingsNpr = orders.reduce((sum, o) => sum + o.discountNpr, 0);

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = orderFilter === 'All' || o.status === orderFilter;
    const q = orderSearch.trim().toLowerCase();
    const matchesQuery =
      !q ||
      o.id.toLowerCase().includes(q) ||
      o.itemsSummary.toLowerCase().includes(q) ||
      o.city.toLowerCase().includes(q);
    return matchesStatus && matchesQuery;
  });

  const activeProtocol =
    SKIN_CONCERN_PROTOCOLS.find((c) => c.id === selectedConcernId) ||
    SKIN_CONCERN_PROTOCOLS[0];

  const handleReorder = (order: Order) => {
    onReorderOrder(order);
    setReorderedId(order.id);
    setTimeout(() => setReorderedId(null), 2200);
  };

  const handleAddSavedToBag = (product: Product) => {
    onAddToCart(product);
    setAddedSavedId(product.id);
    setTimeout(() => setAddedSavedId(null), 1600);
  };

  const handleAddCustomStep = (e: FormEvent) => {
    e.preventDefault();
    if (!newStepTitle.trim()) return;
    onAddRoutineStep({
      title: newStepTitle.trim(),
      productName: newStepProduct,
      timeOfDay: newStepTime,
      scheduledTime:
        newStepTime === 'Morning'
          ? '07:45 AM'
          : newStepTime === 'Midday'
            ? '01:00 PM'
            : '09:45 PM',
    });
    setNewStepTitle('');
  };

  const handleSaveAccount = (e: FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      ...profile,
      fullName: fullName.trim() || profile.fullName,
      phone: phone.trim() || profile.phone,
      city,
      address: address.trim() || profile.address,
      skinFocus,
      preferredPayment,
    });
    setSavedNotice('Shopper delivery & skin preferences saved for Express Checkout.');
    setTimeout(() => setSavedNotice(null), 3000);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[#FAF8F5] flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-lg rounded-3xl bg-white border border-[#12141C]/12 shadow-lg overflow-hidden">
          <div className="bg-[#153B24] text-white p-6 sm:p-8 space-y-2">
            <p className="text-xs font-medium text-emerald-200 inline-flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>Skin AID by CareNest · Customer Portal</span>
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold">
              Sign In to View Your Account
            </h1>
            <p className="text-xs sm:text-sm text-white/75 leading-relaxed">
              Access your Skin AID order tracking, saved formulations, personalized AM/PM barrier regimen, and saved Nepal delivery addresses.
            </p>
          </div>
          <div className="p-6 sm:p-8 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onOpenAuth('signin')}
                className="min-h-[48px] px-5 py-3 rounded-xl bg-[#9E1B24] hover:bg-[#82141C] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenAuth('signup')}
                className="min-h-[48px] px-5 py-3 rounded-xl border border-[#153B24]/30 bg-[#FAF8F5] hover:bg-[#153B24] hover:text-white text-[#153B24] text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create Account</span>
              </button>
            </div>
            <button
              type="button"
              onClick={onOpenStoreShop}
              className="w-full min-h-[40px] text-xs font-medium text-[#12141C]/65 hover:text-[#153B24] cursor-pointer"
            >
              Continue browsing Skin AID Storefront
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#FAF8F5] text-[#12141C]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Shopper Sidebar Navigation */}
          <aside className="lg:col-span-3 space-y-4">
            <div className="rounded-2xl bg-[#153B24] text-white p-5 space-y-3 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-200">
                  Skin AID by CareNest
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/15 text-emerald-100">
                  {hasPartnerSavings ? '10% PERK' : 'MEMBER'}
                </span>
              </div>
              <div>
                <h1 className="font-display text-2xl font-semibold leading-tight">
                  {profile.fullName}
                </h1>
                {profile.email && (
                  <p className="text-[11px] text-emerald-200/85 mt-0.5 truncate">
                    {profile.email}
                  </p>
                )}
                <p className="text-xs text-white/75 mt-1">
                  {profile.city} · Focus: {profile.skinFocus}
                </p>
              </div>
              <div className="pt-3 border-t border-white/15 flex items-center justify-between text-xs">
                <span className="text-white/70">Routine Completion</span>
                <span className="font-mono font-semibold text-emerald-200 tabular-nums">
                  {routinePct}% ({completedSteps}/{routineSteps.length})
                </span>
              </div>
              <button
                type="button"
                onClick={onOpenStoreShop}
                className="w-full py-2.5 px-3 rounded-lg bg-white text-[#153B24] text-xs font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-emerald-50 transition-colors cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                Browse Skin AID Storefront
              </button>
              <button
                type="button"
                onClick={onSignOut}
                className="w-full py-2 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white/90 text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>

            <nav
              aria-label="Shopper dashboard navigation"
              className="bg-white rounded-2xl border border-[#12141C]/10 p-2 flex lg:flex-col gap-1 overflow-x-auto no-scrollbar"
            >
              {SHOPPER_NAV.map((item) => {
                const Icon = item.icon;
                const active = section === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSection(item.id)}
                    className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#153B24] text-white'
                        : 'text-[#12141C]/70 hover:bg-[#FAF8F5] hover:text-[#12141C]'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Main Shopper Workspace */}
          <div className="lg:col-span-9 space-y-6">
            {section === 'overview' && (
              <>
                {/* Top KPI Strip */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                  <div className="bg-white rounded-2xl border border-[#12141C]/10 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#12141C]/50">
                      Active Shipments
                    </p>
                    <p className="font-mono text-2xl font-semibold text-[#153B24] mt-1 tabular-nums">
                      {activeOrders.length}
                    </p>
                    <p className="text-xs text-[#12141C]/60 mt-0.5">
                      {orders.length} total orders placed
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl border border-[#12141C]/10 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#12141C]/50">
                      Member Savings
                    </p>
                    <p className="font-mono text-2xl font-semibold text-[#153B24] mt-1 tabular-nums">
                      NPR {totalSavingsNpr.toLocaleString()}
                    </p>
                    <p className="text-xs text-[#12141C]/60 mt-0.5">
                      Saved across orders
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl border border-[#12141C]/10 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#12141C]/50">
                      Saved Formulations
                    </p>
                    <p className="font-mono text-2xl font-semibold text-[#12141C] mt-1 tabular-nums">
                      {savedProducts.length}
                    </p>
                    <p className="text-xs text-[#12141C]/60 mt-0.5">
                      Ready for 1-click restock
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl border border-[#12141C]/10 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#12141C]/50">
                      Daily Skin Routine
                    </p>
                    <p className="font-mono text-2xl font-semibold text-[#153B24] mt-1 tabular-nums">
                      {routinePct}%
                    </p>
                    <p className="text-xs text-[#12141C]/60 mt-0.5">
                      {completedSteps} of {routineSteps.length} steps today
                    </p>
                  </div>
                </div>

                {/* Live Shipment Spotlight */}
                {latestOrder && (
                  <div className="bg-white rounded-2xl border border-[#12141C]/10 p-5 sm:p-6 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#153B24]">
                          Latest Order Status
                        </span>
                        <h2 className="font-display text-xl font-semibold mt-0.5">
                          Order {latestOrder.id} · {latestOrder.courierChannel}
                        </h2>
                        <p className="text-xs text-[#12141C]/65 mt-0.5">
                          {latestOrder.itemsSummary}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleReorder(latestOrder)}
                          className="px-3.5 py-2 rounded-lg border border-[#153B24]/25 text-[#153B24] text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#153B24]/5 cursor-pointer"
                        >
                          {reorderedId === latestOrder.id ? (
                            <>
                              <Check className="w-3.5 h-3.5" /> Added to Bag
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-3.5 h-3.5" /> Reorder
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={onOpenFullTracker}
                          className="px-3.5 py-2 rounded-lg bg-[#153B24] text-white text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#102e1c] cursor-pointer"
                        >
                          Track Shipment
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2">
                      {ORDER_STAGES.map((stage, idx) => {
                        const currentIdx = ORDER_STAGES.indexOf(
                          latestOrder.status
                        );
                        const done = idx <= currentIdx;
                        return (
                          <div
                            key={stage}
                            className={`rounded-xl p-3 border text-xs ${
                              done
                                ? 'bg-[#153B24]/6 border-[#153B24]/30 text-[#153B24] font-semibold'
                                : 'bg-[#FAF8F5] border-[#12141C]/10 text-[#12141C]/45'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span>Step {idx + 1}</span>
                              {done && <CheckCircle2 className="w-3.5 h-3.5" />}
                            </div>
                            <div className="mt-1">{stage}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Two-column quick access: Saved Items + Routine Check */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="bg-white rounded-2xl border border-[#12141C]/10 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-lg font-semibold">
                        Saved Formulations
                      </h3>
                      <button
                        type="button"
                        onClick={() => setSection('saved')}
                        className="text-xs font-semibold text-[#153B24] hover:underline cursor-pointer"
                      >
                        View all ({savedProducts.length})
                      </button>
                    </div>
                    <div className="space-y-3">
                      {savedProducts.slice(0, 3).map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 p-2.5 rounded-xl bg-[#FAF8F5] border border-[#12141C]/8"
                        >
                          <ResilientImage
                            src={item.image}
                            alt={item.shortName}
                            className="w-12 h-12 rounded-lg object-cover bg-white shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold truncate">
                              {item.shortName}
                            </p>
                            <p className="text-[11px] text-[#12141C]/60 font-mono">
                              NPR {item.priceNpr.toLocaleString()} · {item.batchCode}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddSavedToBag(item)}
                            className="px-3 py-1.5 rounded-lg bg-[#153B24] text-white text-[11px] font-semibold hover:bg-[#102e1c] shrink-0 cursor-pointer"
                          >
                            {addedSavedId === item.id ? 'Added' : '+ Bag'}
                          </button>
                        </div>
                      ))}
                      {savedProducts.length === 0 && (
                        <p className="text-xs text-[#12141C]/60">
                          No saved formulations yet. Heart any SkinAid SKU in the catalog to keep it here.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-[#12141C]/10 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-lg font-semibold">
                        Today&apos;s Regimen Steps
                      </h3>
                      <button
                        type="button"
                        onClick={() => setSection('routine')}
                        className="text-xs font-semibold text-[#153B24] hover:underline cursor-pointer"
                      >
                        Manage Routine
                      </button>
                    </div>
                    <div className="space-y-2.5">
                      {routineSteps.slice(0, 4).map((step) => (
                        <button
                          key={step.id}
                          type="button"
                          onClick={() => onToggleRoutineStep(step.id)}
                          className={`w-full text-left flex items-start gap-3 p-3 rounded-xl border transition-colors cursor-pointer ${
                            step.completed
                              ? 'bg-[#153B24]/5 border-[#153B24]/25'
                              : 'bg-[#FAF8F5] border-[#12141C]/10'
                          }`}
                        >
                          <span
                            className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                              step.completed
                                ? 'bg-[#153B24] border-[#153B24] text-white'
                                : 'border-[#12141C]/30 bg-white'
                            }`}
                          >
                            {step.completed && <Check className="w-3 h-3" />}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p
                              className={`text-xs font-semibold ${
                                step.completed
                                  ? 'line-through text-[#12141C]/50'
                                  : 'text-[#12141C]'
                              }`}
                            >
                              {step.title}
                            </p>
                            <p className="text-[11px] text-[#12141C]/55">
                              {step.timeOfDay} · {step.scheduledTime}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {section === 'orders' && (
              <div className="bg-white rounded-2xl border border-[#12141C]/10 p-5 sm:p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="font-display text-2xl font-semibold">
                      Orders &amp; Delivery History
                    </h2>
                    <p className="text-xs text-[#12141C]/65 mt-0.5">
                      Track shipments from Chitwan Phyto Lab, inspect eSewa/Khalti/COD receipts, or reorder in one tap.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenFullTracker}
                    className="px-4 py-2 rounded-lg bg-[#153B24] text-white text-xs font-semibold inline-flex items-center gap-1.5 self-start cursor-pointer"
                  >
                    Live Order Tracker
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-[#12141C]/40 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      placeholder="Search order ID (CN-412), product, or city..."
                      className="w-full h-10 pl-9 pr-3 rounded-lg border border-[#12141C]/15 bg-[#FAF8F5] text-xs focus:outline-none focus:border-[#153B24]"
                    />
                  </div>
                  <div className="flex gap-1.5 overflow-x-auto">
                    {(['All', 'Packing in Lab', 'Dispatched', 'Delivered'] as const).map(
                      (status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setOrderFilter(status)}
                          className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap cursor-pointer ${
                            orderFilter === status
                              ? 'bg-[#153B24] text-white'
                              : 'bg-[#FAF8F5] text-[#12141C]/70 hover:text-[#12141C]'
                          }`}
                        >
                          {status}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredOrders.map((order) => (
                    <article
                      key={order.id}
                      className="rounded-xl border border-[#12141C]/10 bg-[#FAF8F5]/70 p-4 space-y-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-semibold text-[#12141C]">
                              {order.id}
                            </span>
                            <span
                              className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                                order.status === 'Delivered'
                                  ? 'bg-emerald-100 text-[#153B24]'
                                  : order.status === 'Dispatched'
                                    ? 'bg-amber-100 text-amber-900'
                                    : 'bg-slate-200 text-slate-800'
                              }`}
                            >
                              {order.status}
                            </span>
                          </div>
                          <p className="text-xs text-[#12141C]/65 mt-1">
                            {order.date} · {order.courierChannel} · {order.address}, {order.city}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="font-mono text-sm font-semibold text-[#12141C]">
                            NPR {order.totalNpr.toLocaleString()}
                          </p>
                          <p className="text-[11px] text-[#12141C]/60">
                            {order.paymentMethod}
                            {order.discountNpr > 0
                              ? ` · Saved NPR ${order.discountNpr.toLocaleString()}`
                              : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#12141C]/8">
                        <p className="text-xs font-medium text-[#12141C]/85">
                          {order.itemsSummary}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleReorder(order)}
                          className="px-3.5 py-1.5 rounded-lg bg-white border border-[#153B24]/25 text-[#153B24] text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#153B24] hover:text-white transition-colors cursor-pointer"
                        >
                          {reorderedId === order.id ? (
                            <>
                              <Check className="w-3.5 h-3.5" /> Added to Bag
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-3.5 h-3.5" /> 1-Click Reorder
                            </>
                          )}
                        </button>
                      </div>
                    </article>
                  ))}
                  {filteredOrders.length === 0 && (
                    <p className="text-xs text-[#12141C]/60 py-6 text-center">
                      No orders match your filter.
                    </p>
                  )}
                </div>
              </div>
            )}

            {section === 'saved' && (
              <div className="space-y-5">
                <div className="bg-white rounded-2xl border border-[#12141C]/10 p-5 sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div>
                      <h2 className="font-display text-2xl font-semibold">
                        Saved Skin AID Formulations
                      </h2>
                      <p className="text-xs text-[#12141C]/65 mt-0.5">
                        {hasPartnerSavings
                          ? 'Partner link 10% savings previewed below and applied automatically at checkout.'
                          : 'Direct Phytomax Care Chitwan Lab formulations ready for 1-click bag restock.'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {products.map((product) => {
                      const isSaved = savedProductIds.includes(product.id);
                      const discountedPrice = hasPartnerSavings
                        ? Math.round(product.priceNpr * 0.9)
                        : product.priceNpr;
                      return (
                        <div
                          key={product.id}
                          className={`rounded-xl border p-4 flex gap-3.5 transition-colors ${
                            isSaved
                              ? 'bg-[#FAF8F5] border-[#153B24]/30'
                              : 'bg-white border-[#12141C]/10 opacity-85'
                          }`}
                        >
                          <ResilientImage
                            src={product.image}
                            alt={product.shortName}
                            className="w-20 h-20 rounded-xl object-cover bg-white shrink-0 border border-[#12141C]/8"
                          />
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="text-sm font-semibold text-[#12141C] leading-snug">
                                  {product.shortName}
                                </h3>
                                <button
                                  type="button"
                                  onClick={() => onToggleSaveProduct(product.id)}
                                  aria-label={
                                    isSaved
                                      ? `Remove ${product.shortName} from saved`
                                      : `Save ${product.shortName}`
                                  }
                                  className="p-1.5 rounded-lg hover:bg-white cursor-pointer shrink-0"
                                >
                                  <Heart
                                    className={`w-4 h-4 ${
                                      isSaved
                                        ? 'fill-[#9E1B24] text-[#9E1B24]'
                                        : 'text-[#12141C]/35'
                                    }`}
                                  />
                                </button>
                              </div>
                              <p className="text-[11px] font-mono text-[#12141C]/55 mt-0.5">
                                {product.volume} · Batch {product.batchCode}
                              </p>
                            </div>

                            <div className="flex items-center justify-between gap-2 pt-3">
                              <div>
                                <span className="font-mono text-sm font-semibold text-[#153B24]">
                                  NPR {discountedPrice.toLocaleString()}
                                </span>
                                {hasPartnerSavings && (
                                  <span className="ml-1.5 font-mono text-[11px] line-through text-[#12141C]/40">
                                    {product.priceNpr.toLocaleString()}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    onOpenBatchScanner(product.batchCode)
                                  }
                                  title="Verify QR Batch COA"
                                  className="p-2 rounded-lg border border-[#12141C]/15 text-[#12141C]/70 hover:text-[#153B24] cursor-pointer"
                                >
                                  <QrCode className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAddSavedToBag(product)}
                                  className="px-3 py-1.5 rounded-lg bg-[#153B24] text-white text-xs font-semibold hover:bg-[#102e1c] cursor-pointer"
                                >
                                  {addedSavedId === product.id
                                    ? 'Added'
                                    : 'Add to Bag'}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bundle Quick Reorder */}
                <div className="bg-white rounded-2xl border border-[#12141C]/10 p-5 sm:p-6 space-y-4">
                  <h3 className="font-display text-xl font-semibold">
                    Curated Routine Bundles
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {SKINAID_BUNDLES.map((bundle) => (
                      <div
                        key={bundle.id}
                        className="rounded-xl bg-[#FAF8F5] border border-[#12141C]/10 p-4 flex flex-col justify-between space-y-3"
                      >
                        <div>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#153B24]">
                            {bundle.concernTag}
                          </span>
                          <h4 className="font-semibold text-sm mt-1">
                            {bundle.title}
                          </h4>
                          <p className="text-xs text-[#12141C]/65 mt-1">
                            {bundle.subtitle}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onAddBundleToCart(bundle.productIds)}
                          className="w-full py-2 rounded-lg bg-[#153B24] text-white text-xs font-semibold hover:bg-[#102e1c] cursor-pointer"
                        >
                          Add Kit to Bag (-{bundle.bundleDiscountPct}%)
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {section === 'routine' && (
              <div className="space-y-5">
                <div className="bg-white rounded-2xl border border-[#12141C]/10 p-5 sm:p-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h2 className="font-display text-2xl font-semibold">
                        Personal AM / PM Skin Regimen
                      </h2>
                      <p className="text-xs text-[#12141C]/65 mt-0.5">
                        Check off daily botanical layering steps or add custom SkinAid steps.
                      </p>
                    </div>
                    <span className="font-mono text-xs font-semibold px-3 py-1 rounded-lg bg-[#153B24]/10 text-[#153B24]">
                      {completedSteps}/{routineSteps.length} Complete
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {routineSteps.map((step) => (
                      <button
                        key={step.id}
                        type="button"
                        onClick={() => onToggleRoutineStep(step.id)}
                        className={`w-full text-left flex items-center justify-between gap-3 p-3.5 rounded-xl border transition-colors cursor-pointer ${
                          step.completed
                            ? 'bg-[#153B24]/6 border-[#153B24]/25'
                            : 'bg-[#FAF8F5] border-[#12141C]/10'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                              step.completed
                                ? 'bg-[#153B24] border-[#153B24] text-white'
                                : 'border-[#12141C]/30 bg-white'
                            }`}
                          >
                            {step.completed && <Check className="w-3 h-3" />}
                          </span>
                          <div>
                            <p
                              className={`text-sm font-medium ${
                                step.completed
                                  ? 'line-through text-[#12141C]/50'
                                  : 'text-[#12141C]'
                              }`}
                            >
                              {step.title}
                            </p>
                            <p className="text-xs text-[#12141C]/60">
                              {step.productName}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-mono text-[#12141C]/55 shrink-0">
                          {step.timeOfDay} · {step.scheduledTime}
                        </span>
                      </button>
                    ))}
                  </div>

                  <form
                    onSubmit={handleAddCustomStep}
                    className="pt-3 border-t border-[#12141C]/10 grid grid-cols-1 sm:grid-cols-12 gap-2.5"
                  >
                    <input
                      type="text"
                      value={newStepTitle}
                      onChange={(e) => setNewStepTitle(e.target.value)}
                      placeholder="Add custom step (e.g. Apply Rose Water mist)"
                      className="sm:col-span-5 h-10 px-3 rounded-lg border border-[#12141C]/15 bg-[#FAF8F5] text-xs"
                    />
                    <select
                      value={newStepProduct}
                      onChange={(e) => setNewStepProduct(e.target.value)}
                      className="sm:col-span-4 h-10 px-3 rounded-lg border border-[#12141C]/15 bg-[#FAF8F5] text-xs"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.shortName}>
                          {p.shortName}
                        </option>
                      ))}
                    </select>
                    <select
                      value={newStepTime}
                      onChange={(e) =>
                        setNewStepTime(
                          e.target.value as 'Morning' | 'Midday' | 'Night'
                        )
                      }
                      className="sm:col-span-2 h-10 px-2.5 rounded-lg border border-[#12141C]/15 bg-[#FAF8F5] text-xs"
                    >
                      <option value="Morning">Morning</option>
                      <option value="Midday">Midday</option>
                      <option value="Night">Night</option>
                    </select>
                    <button
                      type="submit"
                      className="sm:col-span-1 h-10 rounded-lg bg-[#153B24] text-white flex items-center justify-center hover:bg-[#102e1c] cursor-pointer"
                      aria-label="Add routine step"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </form>
                </div>

                {/* Dermatologist Concern Protocol Matcher */}
                <div className="bg-white rounded-2xl border border-[#12141C]/10 p-5 sm:p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#153B24]" />
                    <h3 className="font-display text-lg font-semibold">
                      Concern Protocol Recommender
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {SKIN_CONCERN_PROTOCOLS.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedConcernId(c.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                          selectedConcernId === c.id
                            ? 'bg-[#153B24] text-white'
                            : 'bg-[#FAF8F5] text-[#12141C]/75 hover:text-[#12141C]'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                  <div className="rounded-xl bg-[#FAF8F5] border border-[#12141C]/10 p-4 space-y-2.5">
                    <p className="text-xs text-[#12141C]/80 leading-relaxed">
                      {activeProtocol.summary}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-lg bg-white border border-[#12141C]/8">
                        <span className="font-semibold text-[#153B24]">
                          AM Protocol:
                        </span>{' '}
                        {activeProtocol.morningNote}
                      </div>
                      <div className="p-3 rounded-lg bg-white border border-[#12141C]/8">
                        <span className="font-semibold text-[#153B24]">
                          PM Protocol:
                        </span>{' '}
                        {activeProtocol.nightNote}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        onAddBundleToCart(activeProtocol.productIds)
                      }
                      className="px-4 py-2 rounded-lg bg-[#153B24] text-white text-xs font-semibold hover:bg-[#102e1c] cursor-pointer"
                    >
                      Add Recommended Regimen to Bag
                    </button>
                  </div>
                </div>
              </div>
            )}

            {section === 'perks' && (
              <div className="space-y-5">
                <div className="bg-white rounded-2xl border border-[#12141C]/10 p-5 sm:p-6 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h2 className="font-display text-2xl font-semibold">
                        Skin AID by CareNest Authenticity Guarantee
                      </h2>
                      <p className="text-xs text-[#12141C]/65 mt-0.5">
                        Every bottle ships sealed from Phytomax Care Pvt. Ltd. (Bharatpur-16, Chitwan) with heavy-metal and pH verification.
                      </p>
                    </div>
                    <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-[#153B24]/10 text-[#153B24]">
                      ISO &amp; Lab Certified
                    </span>
                  </div>
                </div>

                {/* My Batch Passports */}
                <div className="bg-white rounded-2xl border border-[#12141C]/10 p-5 sm:p-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="font-display text-xl font-semibold">
                        Lab-Verified Batch Passports (Your Shelf)
                      </h3>
                      <p className="text-xs text-[#12141C]/65 mt-0.5">
                        Scan any bottle QR code to confirm Phytomax Care HPLC potency &amp; zero heavy metals.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {savedProducts.slice(0, 3).map((item) => {
                      const coa = BATCH_PASSPORTS[item.batchCode];
                      return (
                        <div
                          key={item.id}
                          className="rounded-xl border border-[#12141C]/10 bg-[#FAF8F5] p-4 flex flex-col items-center text-center space-y-3"
                        >
                          <BatchQrCode
                            value={
                              typeof window !== 'undefined'
                                ? `${window.location.origin}/?batch=${item.batchCode}`
                                : `https://carenest.com.np/?batch=${item.batchCode}`
                            }
                            batchCode={item.batchCode}
                            productLabel={coa?.coaNumber}
                            size={112}
                            showActions={false}
                          />
                          <div>
                            <p className="text-xs font-semibold">
                              {item.shortName}
                            </p>
                            <p className="text-[11px] font-mono text-[#12141C]/60">
                              {item.batchCode} · {coa?.heavyMetals || '< 0.01 ppm'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => onOpenBatchScanner(item.batchCode)}
                            className="w-full py-2 rounded-lg border border-[#153B24]/25 text-[#153B24] text-xs font-semibold hover:bg-[#153B24] hover:text-white transition-colors cursor-pointer"
                          >
                            Open Full HPLC Report
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {section === 'account' && (
              <form
                onSubmit={handleSaveAccount}
                className="bg-white rounded-2xl border border-[#12141C]/10 p-5 sm:p-6 space-y-5"
              >
                <div>
                  <h2 className="font-display text-2xl font-semibold">
                    Delivery Address &amp; Skin Preferences
                  </h2>
                  <p className="text-xs text-[#12141C]/65 mt-0.5">
                    Saved preferences auto-fill Express Checkout across Kathmandu Valley, Lalitpur, Pokhara, and Chitwan.
                  </p>
                </div>

                {savedNotice && (
                  <div className="rounded-xl bg-[#153B24]/10 border border-[#153B24]/25 px-4 py-3 text-xs font-medium text-[#153B24]">
                    {savedNotice}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="space-y-1.5 text-xs font-medium">
                    <span>Full Name</span>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-[#12141C]/15 bg-[#FAF8F5]"
                    />
                  </label>

                  <label className="space-y-1.5 text-xs font-medium">
                    <span>Nepal Mobile (+977)</span>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-[#12141C]/15 bg-[#FAF8F5]"
                    />
                  </label>

                  <label className="space-y-1.5 text-xs font-medium">
                    <span>City / Valley Zone</span>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-[#12141C]/15 bg-[#FAF8F5]"
                    >
                      <option value="Lalitpur">Lalitpur</option>
                      <option value="Kathmandu">Kathmandu</option>
                      <option value="Bhaktapur">Bhaktapur</option>
                      <option value="Bharatpur">Bharatpur (Chitwan)</option>
                      <option value="Pokhara">Pokhara</option>
                    </select>
                  </label>

                  <label className="space-y-1.5 text-xs font-medium">
                    <span>Preferred Payment Method</span>
                    <select
                      value={preferredPayment}
                      onChange={(e) =>
                        setPreferredPayment(e.target.value as PaymentMethod)
                      }
                      className="w-full h-10 px-3 rounded-lg border border-[#12141C]/15 bg-[#FAF8F5]"
                    >
                      <option value="eSewa">eSewa Wallet</option>
                      <option value="Khalti">Khalti Digital Wallet</option>
                      <option value="Fonepay QR">Fonepay Bank QR</option>
                      <option value="Card">Visa / Mastercard Card</option>
                      <option value="COD">Cash on Delivery (COD)</option>
                    </select>
                  </label>

                  <label className="sm:col-span-2 space-y-1.5 text-xs font-medium">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#153B24]" />
                      Street Address / Landmark
                    </span>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-[#12141C]/15 bg-[#FAF8F5]"
                    />
                  </label>

                  <label className="sm:col-span-2 space-y-1.5 text-xs font-medium">
                    <span>Primary Skin &amp; Scalp Focus</span>
                    <select
                      value={skinFocus}
                      onChange={(e) => setSkinFocus(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-[#12141C]/15 bg-[#FAF8F5]"
                    >
                      <option value="UV & Melasma Protection">
                        UV &amp; Melasma Protection
                      </option>
                      <option value="Barrier Repair & Hydration">
                        Barrier Repair &amp; Hydration
                      </option>
                      <option value="Acne & Sebum Control">
                        Acne &amp; Sebum Control
                      </option>
                      <option value="Follicle & Scalp Resilience">
                        Follicle &amp; Scalp Resilience
                      </option>
                    </select>
                  </label>
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-[#153B24] text-white text-xs font-semibold hover:bg-[#102e1c] cursor-pointer"
                >
                  Save Shopper Profile
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
