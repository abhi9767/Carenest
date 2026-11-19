import { useEffect, useState, FormEvent } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  CreditCard,
  FlaskConical,
  Grid,
  Home,
  Lock,
  MapPin,
  QrCode,
  Search,
  ShieldAlert,
  Sparkles,
  Star,
  ThumbsUp,
  Wallet,
  Banknote,
  CalendarCheck,
  Tag,
  PackageCheck,
  Plus,
} from 'lucide-react';
import {
  BATCH_PASSPORTS,
  CARENEST_IMAGES,
  CREATOR_DIRECTORY_CODES,
  SKINAID_BUNDLES,
  SKIN_CONCERN_PROTOCOLS,
} from '../data/carenestData';
import {
  AdminAffiliateAccount,
  CartItem,
  Order,
  PaymentMethod,
  Product,
  ProductCategory,
  Review,
  RoutineStep,
  ShopperProfile,
  StoreSubView,
} from '../types';
import { ResilientImage } from './ResilientImage';
import { BatchQrCode } from './BatchQrCode';
import {
  OnlineGatewayMethod,
  PaymentGatewayModal,
  VerifiedPaymentReceipt,
} from './PaymentGatewayModal';

interface StorePortalProps {
  products: Product[];
  cart: CartItem[];
  orders: Order[];
  myOrders: Order[];
  isShopperSignedIn: boolean;
  shopperProfile?: ShopperProfile;
  onOpenShopperAuth: (mode: 'signin' | 'signup') => void;
  activeAffiliates: AdminAffiliateAccount[];
  routineSteps: RoutineStep[];
  reviews: Review[];
  subView: StoreSubView;
  initialBatchCode?: string;
  promoApplied: boolean;
  activeAffiliateCode: string;
  onSetAffiliateCode: (code: string) => void;
  onChangeSubView: (view: StoreSubView) => void;
  onAddToCart: (product: Product) => void;
  onAddBundleToCart: (productIds: string[]) => void;
  onQuickBuy: (product: Product) => void;
  onApplyPromo: () => void;
  onToggleRoutineStep: (stepId: string) => void;
  onAddRoutineStep: (payload: {
    title: string;
    productName: string;
    timeOfDay: 'Morning' | 'Midday' | 'Night';
    scheduledTime: string;
  }) => void;
  onToggleHelpfulReview: (reviewId: string) => void;
  onAddReview: (
    review: Omit<Review, 'id' | 'date' | 'helpfulCount' | 'verified'>
  ) => void;
  onPlaceOrder: (payload: {
    customerName: string;
    phone: string;
    address: string;
    city: string;
    paymentMethod: PaymentMethod;
    paymentTransactionId?: string;
    paymentGatewayMode?: 'Live' | 'Sandbox';
    affiliateCode?: string;
  }) => Order;
}

const CATEGORIES: ProductCategory[] = [
  'All Formulations',
  'Skin Care',
  'Sun Care',
  'Hair Care',
  'Bath & Spa',
];

export function StorePortal({
  products,
  cart,
  orders,
  myOrders,
  isShopperSignedIn,
  shopperProfile,
  onOpenShopperAuth,
  activeAffiliates,
  routineSteps,
  reviews,
  subView,
  initialBatchCode,
  promoApplied,
  activeAffiliateCode,
  onSetAffiliateCode,
  onChangeSubView,
  onAddToCart,
  onAddBundleToCart,
  onQuickBuy,
  onApplyPromo,
  onToggleRoutineStep,
  onAddRoutineStep,
  onToggleHelpfulReview,
  onAddReview,
  onPlaceOrder,
}: StorePortalProps) {
  const [selectedProductId, setSelectedProductId] = useState<string>(
    products[0]?.id || 'skinaid-tinted-sunscreen'
  );
  const [activeCategory, setActiveCategory] =
    useState<ProductCategory>('All Formulations');
  const [searchQuery, setSearchQuery] = useState('');
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  // Checkout Form State (only prefilled when shopper is signed in)
  const [customerName, setCustomerName] = useState(
    isShopperSignedIn && shopperProfile ? shopperProfile.fullName : ''
  );
  const [phone, setPhone] = useState(
    isShopperSignedIn && shopperProfile ? shopperProfile.phone : ''
  );
  const [address, setAddress] = useState(
    isShopperSignedIn && shopperProfile ? shopperProfile.address : ''
  );
  const [city, setCity] = useState(
    isShopperSignedIn && shopperProfile ? shopperProfile.city : 'Lalitpur'
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    isShopperSignedIn && shopperProfile ? shopperProfile.preferredPayment : 'eSewa'
  );
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [gatewayModalOpen, setGatewayModalOpen] = useState(false);
  const [showReferralInput, setShowReferralInput] = useState(false);
  const [referralDraft, setReferralDraft] = useState('');
  const [referralError, setReferralError] = useState<string | null>(null);

  // Review Form State
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewAuthor, setReviewAuthor] = useState('');
  const [reviewLocation, setReviewLocation] = useState('Kathmandu');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  // Routine Comparison & Recommender State
  const [skinDayView, setSkinDayView] = useState<'day1' | 'day21'>('day21');
  const [selectedConcernId, setSelectedConcernId] = useState<string>(
    SKIN_CONCERN_PROTOCOLS[0].id
  );
  const [newStepTitle, setNewStepTitle] = useState('');
  const [newStepProduct, setNewStepProduct] = useState(
    products[0]?.shortName || 'Herbo-Mineral Tinted Sunscreen SPF 50+'
  );
  const [newStepTimeOfDay, setNewStepTimeOfDay] = useState<
    'Morning' | 'Midday' | 'Night'
  >('Night');
  const [addedBundleId, setAddedBundleId] = useState<string | null>(null);

  // Private Order Tracker State (strictly scoped to own orders or verified Order ID + phone)
  const [trackOrderId, setTrackOrderId] = useState<string>(
    myOrders[0]?.id || ''
  );
  const [trackPhoneInput, setTrackPhoneInput] = useState<string>('');
  const [verifiedGuestOrderId, setVerifiedGuestOrderId] = useState<
    string | null
  >(null);
  const [trackError, setTrackError] = useState<string | null>(null);

  useEffect(() => {
    if (isShopperSignedIn && shopperProfile) {
      setCustomerName(shopperProfile.fullName);
      setPhone(shopperProfile.phone);
      setAddress(shopperProfile.address);
      setCity(shopperProfile.city);
      setPaymentMethod(shopperProfile.preferredPayment);
    } else {
      setVerifiedGuestOrderId(null);
    }
  }, [isShopperSignedIn, shopperProfile]);

  useEffect(() => {
    if (myOrders.length > 0 && !trackOrderId) {
      setTrackOrderId(myOrders[0].id);
    }
  }, [myOrders, trackOrderId]);

  // QR Scanner & Dynamic Generator State
  const [scannedBatchCode, setScannedBatchCode] = useState<string>(
    initialBatchCode || 'SA-26-501'
  );
  const [customBatchInput, setCustomBatchInput] = useState<string>('');
  const [qrPayloadFormat, setQrPayloadFormat] = useState<'url' | 'passport'>(
    'url'
  );
  const [isScanning, setIsScanning] = useState(false);
  const [showInlineCoa, setShowInlineCoa] = useState(false);

  const selectedProduct =
    products.find((p) => p.id === selectedProductId) || products[0];

  const filteredProducts = products.filter((p) => {
    const matchesCat =
      activeCategory === 'All Formulations' || p.category === activeCategory;
    const q = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q);
    return matchesCat && matchesQuery;
  });

  const handleOpenProduct = (product: Product) => {
    setSelectedProductId(product.id);
    onChangeSubView('product');
  };

  const handleAddFeedback = (product: Product) => {
    onAddToCart(product);
    setJustAddedId(product.id);
    setTimeout(() => setJustAddedId(null), 1400);
  };

  const completedStepsCount = routineSteps.filter((s) => s.completed).length;
  const barrierHealthPct = Math.min(
    100,
    Math.round(62 + (completedStepsCount / Math.max(1, routineSteps.length)) * 30)
  );
  const ringRadius = 32;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset =
    ringCircumference - (barrierHealthPct / 100) * ringCircumference;

  const cartSubtotal = cart.reduce(
    (sum, item) => sum + item.product.priceNpr * item.quantity,
    0
  );
  const discountNpr = activeAffiliateCode
    ? Math.round(cartSubtotal * 0.1)
    : 0;
  const finalTotalNpr = Math.max(0, cartSubtotal - discountNpr);

  const effectiveBatchCode =
    customBatchInput.trim().toUpperCase() || scannedBatchCode;
  const knownPassport = BATCH_PASSPORTS[effectiveBatchCode];
  const activePassport = knownPassport || {
    batchCode: effectiveBatchCode,
    coaNumber: `COA-PHY-${effectiveBatchCode.slice(-3) || 'LAB'}`,
    title: 'Phytomax Care Custom Lot Passport',
    productName: `SkinAid Lab Lot #${effectiveBatchCode}`,
    origin: 'Bharatpur-16, Chitwan, Nepal',
    formulatedBy: 'Phytomax Care Pvt. Ltd. (Third Eye Group)',
    activeComplex: 'Botanical HPLC Standardized Complex',
    labStatus: 'Pending QC Release Signature',
    validUntil: 'Dec 2028',
    activeAssay: 'Standardized Phytochemical Verification Queued',
    phBalance: 'pH 5.5 – 6.2 (Dermal Target Range)',
    heavyMetals: '< 0.01 ppm (In-Process Check)',
    microbialCount: '< 10 CFU/g (Target)',
    hplcPeaks: BATCH_PASSPORTS['SA-26-501'].hplcPeaks,
  };

  const handleTriggerScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
    }, 900);
  };

  const finalizeOrderPlacement = (receipt?: VerifiedPaymentReceipt) => {
    const created = onPlaceOrder({
      customerName: customerName.trim() || 'Guest Customer',
      phone: phone.trim() || '+977 980-000-0000',
      address: address.trim() || 'Lalitpur Ward 03',
      city,
      paymentMethod,
      paymentTransactionId: receipt?.referenceCode,
      paymentGatewayMode: receipt?.gatewayMode,
      affiliateCode: activeAffiliateCode || undefined,
    });
    setTrackOrderId(created.id);
    setConfirmedOrder(created);
    setGatewayModalOpen(false);
  };

  const handleCheckoutSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (paymentMethod === 'COD') {
      finalizeOrderPlacement();
      return;
    }
    setGatewayModalOpen(true);
  };

  const handleReviewSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!reviewAuthor.trim() || !reviewComment.trim()) return;
    onAddReview({
      author: reviewAuthor.trim(),
      location: reviewLocation.trim() || 'Kathmandu',
      rating: reviewRating,
      productId: selectedProduct.id,
      comment: reviewComment.trim(),
    });
    setReviewAuthor('');
    setReviewComment('');
    setShowReviewForm(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 md:pb-12 space-y-8">
      {/* Store Sub-Navigation Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#12141C]/10 pb-4">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[#12141C]/65">
          <MapPin className="w-3.5 h-3.5 text-[#153B24]" />
          <span>Skin AID by CareNest · Phytomax Care Pvt. Ltd., Chitwan</span>
          {activeAffiliateCode && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-[#153B24]">
                10% Partner Link Benefit Active
              </span>
            </>
          )}
        </div>

        <nav
          aria-label="Store sections"
          className="hidden md:flex items-center gap-1 p-1 rounded-xl bg-[#F2EDE6] border border-[#12141C]/10"
        >
          {(
            [
              { id: 'shop', label: 'Shop' },
              { id: 'catalog', label: 'Catalog' },
              { id: 'routine', label: 'Routine' },
              { id: 'scan', label: 'Batch Scan' },
              { id: 'track', label: 'Track Order' },
              { id: 'reviews', label: 'Reviews' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChangeSubView(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[36px] ${
                subView === tab.id
                  ? 'bg-white text-[#153B24] shadow-xs font-semibold'
                  : 'text-[#12141C]/70 hover:text-[#12141C]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ================= SHOP HOME VIEW ================= */}
      {subView === 'shop' && (
        <div className="space-y-12">
          {/* Storefront Hero Split Banner */}
          <section className="rounded-3xl overflow-hidden bg-[#153B24] text-white border border-[#12141C]/10 grid grid-cols-1 lg:grid-cols-12 items-stretch">
            <div className="lg:col-span-7 p-7 sm:p-10 lg:p-12 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <p className="text-xs font-medium text-amber-300 tracking-wide">
                  Science Backed · Herbal Based · SkinAid Flagship
                </p>
                <h1 className="font-display text-3xl sm:text-5xl font-semibold leading-tight text-balance">
                  SkinAid Herbo-Mineral Sunscreen SPF 50+
                </h1>
                <p className="text-sm sm:text-base text-white/80 max-w-xl leading-relaxed">
                  Ultra-light tinted UVA, UVB, and blue-light protection fortified with Niacinamide, Manjistha, Jethi Madhu, Ashwagandha, Brahmi, and Green Tea. Zero white cast.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <div>
                  <p className="font-mono text-2xl font-semibold tabular-nums">
                    NPR 1,450
                  </p>
                  <p className="font-mono text-xs text-white/60 line-through tabular-nums">
                    NPR 1,690 · 50 gm
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onQuickBuy(products[0])}
                  className="min-h-[48px] px-6 py-3 rounded-xl bg-[#9E1B24] hover:bg-[#82141C] text-white text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
                >
                  Quick Buy
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenProduct(products[0])}
                  className="min-h-[48px] px-5 py-3 rounded-xl bg-white/15 hover:bg-white/25 text-white text-sm font-medium transition-colors cursor-pointer whitespace-nowrap"
                >
                  Inspect Formula
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 bg-[#F3EFE9] flex items-center justify-center p-6 sm:p-8 min-h-[280px]">
              <ResilientImage
                src={CARENEST_IMAGES.sunscreen}
                alt="SkinAid Herbo-Mineral Tinted Ultra Light Face Sunscreen 50 Gm"
                fallbackTitle="SkinAid SPF 50+ Sunscreen"
                className="w-full max-h-[320px] object-contain"
              />
            </div>
          </section>

          {/* Featured SkinAid Formulations */}
          <section className="space-y-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-[#153B24]">
                  Phytomax Care Chitwan Lab · 75+ Herbal Formulations
                </p>
                <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#12141C] mt-0.5">
                  SkinAid Daily Essentials
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onChangeSubView('catalog')}
                className="text-xs sm:text-sm font-semibold text-[#153B24] hover:text-[#9E1B24] hover:underline inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
              >
                <span>View All 10 Formulations</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.slice(0, 3).map((product) => (
                <article
                  key={product.id}
                  className="group rounded-2xl bg-white border border-[#12141C]/10 overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-0.5"
                >
                  <button
                    type="button"
                    onClick={() => handleOpenProduct(product)}
                    className="block w-full text-left cursor-pointer"
                  >
                    <div className="aspect-4/3 w-full overflow-hidden bg-[#F3EFE9] p-4 flex items-center justify-center">
                      <ResilientImage
                        src={product.image}
                        alt={product.name}
                        fallbackTitle={product.shortName}
                        className="w-full h-full object-contain group-hover:scale-[1.03] transition-transform duration-300"
                      />
                    </div>
                  </button>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-[#12141C]/55">
                        <span>{product.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{product.volume}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenProduct(product)}
                        className="text-left mt-1 cursor-pointer"
                      >
                        <h3 className="text-base font-semibold text-[#12141C] group-hover:text-[#153B24] transition-colors">
                          {product.shortName}
                        </h3>
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#12141C]/8">
                      <span className="font-mono text-sm font-semibold text-[#12141C] tabular-nums">
                        NPR {product.priceNpr.toLocaleString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAddFeedback(product)}
                        className={`min-h-[40px] px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                          justAddedId === product.id
                            ? 'bg-emerald-700 text-white'
                            : 'bg-[#FAF8F5] hover:bg-[#153B24] hover:text-white text-[#153B24] border border-[#153B24]/25'
                        }`}
                      >
                        {justAddedId === product.id ? 'Added' : '+ Add'}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* Curated SkinAid Routine Bundles */}
          <section className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-[#153B24]">
                  Creator-Tested Multi-Step Protocols · Up to 12% Bundle Savings
                </p>
                <h2 className="font-display text-2xl font-semibold text-[#12141C] mt-0.5">
                  SkinAid Routine Bundles
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onChangeSubView('routine')}
                className="text-xs font-semibold text-[#153B24] hover:underline cursor-pointer inline-flex items-center gap-1"
              >
                <span>Take Skin Concern Assessment</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {SKINAID_BUNDLES.map((bundle) => {
                const bundleProducts = bundle.productIds
                  .map((id) => products.find((p) => p.id === id))
                  .filter((p): p is Product => Boolean(p));
                const rawTotal = bundleProducts.reduce(
                  (sum, p) => sum + p.priceNpr,
                  0
                );
                const discountedTotal = Math.round(
                  rawTotal * (1 - bundle.bundleDiscountPct / 100)
                );
                const isAdded = addedBundleId === bundle.id;

                return (
                  <div
                    key={bundle.id}
                    className="rounded-2xl bg-white border border-[#12141C]/10 p-5 flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#153B24]">
                          {bundle.concernTag}
                        </span>
                        <span className="font-mono text-[#9E1B24] font-semibold">
                          Save {bundle.bundleDiscountPct}%
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {bundleProducts.map((bp) => (
                          <ResilientImage
                            key={bp.id}
                            src={bp.image}
                            alt={bp.shortName}
                            fallbackTitle={bp.shortName}
                            className="w-14 h-14 rounded-xl object-contain bg-[#F3EFE9] p-1 border border-[#12141C]/10"
                          />
                        ))}
                      </div>

                      <div>
                        <h3 className="font-display text-lg font-semibold text-[#12141C]">
                          {bundle.title}
                        </h3>
                        <p className="text-xs text-[#12141C]/65 mt-1 leading-relaxed">
                          {bundle.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#12141C]/10 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-mono text-sm font-semibold text-[#12141C] tabular-nums">
                          NPR {discountedTotal.toLocaleString()}
                        </p>
                        <p className="font-mono text-[11px] text-[#12141C]/45 line-through tabular-nums">
                          NPR {rawTotal.toLocaleString()}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onAddBundleToCart(bundle.productIds);
                          setAddedBundleId(bundle.id);
                          setTimeout(() => setAddedBundleId(null), 1600);
                        }}
                        className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                          isAdded
                            ? 'bg-emerald-700 text-white'
                            : 'bg-[#153B24] hover:bg-[#9E1B24] text-white'
                        }`}
                      >
                        {isAdded ? 'Bundle Added' : '+ Add Kit'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* CareNest Direct Fulfillment & 3P GMP Quality Guarantee */}
          <section className="rounded-2xl bg-[#12141C] text-white p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-amber-300 tracking-wide">
                CareNest Official Store · Lab-Made by Phytomax Care Pvt. Ltd.
              </p>
              <h2 className="font-display text-2xl font-semibold">
                Verified Botanical Formulations Delivered Across Nepal
              </h2>
              <p className="text-sm text-white/75 max-w-2xl">
                Every Skin AID bottle is batch-tested at Phytomax Care Chitwan Lab and fulfilled directly by CareNest with eSewa, Khalti, and Cash on Delivery.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 shrink-0">
              <button
                type="button"
                onClick={() => onChangeSubView('scan')}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#9E1B24] hover:bg-[#82141C] text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
              >
                <QrCode className="w-4 h-4" />
                <span>Verify Batch COA</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onApplyPromo();
                  onAddToCart(products[8] || products[0]);
                }}
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>{promoApplied ? 'Mist Gift Claimed' : 'Claim Free Mist Gift'}</span>
              </button>
            </div>
          </section>

          {/* Botanical Categories Filterable List */}
          <section className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="font-display text-2xl font-semibold text-[#12141C]">
                SkinAid Product Categories
              </h2>

              <div className="flex flex-wrap items-center gap-2">
                {CATEGORIES.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setActiveCategory(category)}
                    className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      activeCategory === category
                        ? 'bg-[#153B24] text-white'
                        : 'bg-white border border-[#12141C]/12 text-[#12141C]/75 hover:text-[#12141C]'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div className="divide-y divide-[#12141C]/10 rounded-2xl bg-white border border-[#12141C]/10 overflow-hidden">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FAF8F5] transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => handleOpenProduct(product)}
                    className="flex items-center gap-4 text-left flex-1 min-w-0 cursor-pointer"
                  >
                    <ResilientImage
                      src={product.image}
                      alt={product.name}
                      fallbackTitle={product.shortName}
                      className="w-16 h-16 rounded-xl object-contain bg-[#F3EFE9] p-1.5 shrink-0 border border-[#12141C]/10"
                    />
                    <div className="min-w-0">
                      <p className="text-xs text-[#12141C]/55">
                        {product.brandLine} · {product.volume}
                      </p>
                      <h3 className="text-sm sm:text-base font-semibold text-[#12141C] truncate">
                        {product.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#12141C]/65 mt-0.5">
                        <span className="inline-flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span className="font-mono tabular-nums">
                            {product.rating} ({product.reviewCount})
                          </span>
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {product.keyMetricStat} {product.keyMetricLabel}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="text-[#153B24] font-medium font-mono">
                          Batch #{product.batchCode}
                        </span>
                      </div>
                    </div>
                  </button>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                    <span className="font-mono text-sm font-semibold text-[#12141C] tabular-nums">
                      NPR {product.priceNpr.toLocaleString()}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAddFeedback(product)}
                      className="min-h-[40px] px-4 py-2 rounded-lg bg-[#153B24] hover:bg-[#9E1B24] text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                    >
                      {justAddedId === product.id ? 'Added' : 'Add to Bag'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* ================= CATALOG VIEW ================= */}
      {subView === 'catalog' && (
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-[#153B24]">
                Phytomax Care Pvt. Ltd. · SkinAid Range
              </p>
              <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#12141C]">
                Complete SkinAid Catalog
              </h1>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-[#12141C]/45 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search SPF, toner, niacinamide..."
                aria-label="Search SkinAid catalog"
                className="w-full min-h-[44px] pl-10 pr-4 py-2 rounded-xl border border-[#12141C]/15 bg-white text-sm text-[#12141C] focus:outline-none focus:border-[#153B24]"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  activeCategory === category
                    ? 'bg-[#153B24] text-white'
                    : 'bg-white border border-[#12141C]/12 text-[#12141C]/75 hover:text-[#12141C]'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {filteredProducts.length === 0 ? (
            <div className="rounded-2xl bg-white border border-[#12141C]/10 p-12 text-center space-y-2">
              <p className="font-display text-xl text-[#12141C]">
                No formulations matched &ldquo;{searchQuery}&rdquo;
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('All Formulations');
                }}
                className="text-xs font-semibold text-[#153B24] underline cursor-pointer"
              >
                Reset catalog filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <article
                  key={product.id}
                  className="rounded-2xl bg-white border border-[#12141C]/10 overflow-hidden flex flex-col"
                >
                  <button
                    type="button"
                    onClick={() => handleOpenProduct(product)}
                    className="aspect-4/3 w-full overflow-hidden bg-[#F3EFE9] p-4 flex items-center justify-center cursor-pointer"
                  >
                    <ResilientImage
                      src={product.image}
                      alt={product.name}
                      fallbackTitle={product.shortName}
                      className="w-full h-full object-contain hover:scale-[1.03] transition-transform duration-300"
                    />
                  </button>
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <p className="text-xs text-[#12141C]/55">
                        {product.brandLine} · {product.volume}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleOpenProduct(product)}
                        className="text-left mt-1 cursor-pointer"
                      >
                        <h2 className="text-base font-semibold text-[#12141C] hover:text-[#153B24]">
                          {product.name}
                        </h2>
                      </button>
                      <p className="text-xs text-[#12141C]/65 mt-2 line-clamp-2">
                        {product.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-[#12141C]/10">
                      <span className="font-mono text-sm font-semibold text-[#12141C] tabular-nums">
                        NPR {product.priceNpr.toLocaleString()}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleAddFeedback(product)}
                          className="min-h-[40px] px-3.5 py-1.5 rounded-lg border border-[#12141C]/15 hover:border-[#153B24] text-xs font-semibold text-[#12141C] cursor-pointer"
                        >
                          {justAddedId === product.id ? 'Added' : '+ Bag'}
                        </button>
                        <button
                          type="button"
                          onClick={() => onQuickBuy(product)}
                          className="min-h-[40px] px-3.5 py-1.5 rounded-lg bg-[#9E1B24] hover:bg-[#82141C] text-white text-xs font-semibold cursor-pointer"
                        >
                          Buy
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ================= PRODUCT DETAIL PAGE (PDP) ================= */}
      {subView === 'product' && selectedProduct && (
        <section className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => onChangeSubView('shop')}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[#12141C]/75 hover:text-[#153B24] cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Shop</span>
            </button>
            <span className="font-mono text-xs text-[#12141C]/60">
              Batch #{selectedProduct.batchCode} · Chitwan Phyto Lab
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            <div className="lg:col-span-6 rounded-3xl overflow-hidden border border-[#12141C]/10 bg-[#F3EFE9] p-8 flex items-center justify-center min-h-[320px]">
              <ResilientImage
                src={selectedProduct.image}
                alt={selectedProduct.name}
                fallbackTitle={selectedProduct.shortName}
                className="w-full max-h-[420px] object-contain"
              />
            </div>

            <div className="lg:col-span-6 rounded-3xl bg-white border border-[#12141C]/10 p-6 sm:p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-[#12141C]/65">
                  <span className="inline-flex items-center gap-1.5">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="font-mono font-semibold text-[#12141C] tabular-nums">
                      {selectedProduct.rating}/5
                    </span>
                    <span>({selectedProduct.reviewCount} reviews)</span>
                  </span>
                  <span>{selectedProduct.volume}</span>
                </div>

                <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#12141C] text-balance">
                  {selectedProduct.name}
                </h1>

                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-2xl font-semibold text-[#12141C] tabular-nums">
                    NPR {selectedProduct.priceNpr.toLocaleString()}
                  </span>
                  <span className="font-mono text-sm text-[#12141C]/45 line-through tabular-nums">
                    NPR {selectedProduct.compareAtNpr.toLocaleString()}
                  </span>
                </div>

                {/* 3-Column Formulation Metric Strip */}
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="rounded-xl bg-[#FAF8F5] border border-[#12141C]/8 p-3 text-center">
                    <p className="font-mono text-sm sm:text-base font-semibold text-[#153B24] tabular-nums">
                      {selectedProduct.keyMetricStat}
                    </p>
                    <p className="text-[11px] text-[#12141C]/60 mt-0.5">
                      {selectedProduct.keyMetricLabel}
                    </p>
                  </div>
                  <div className="rounded-xl bg-[#FAF8F5] border border-[#12141C]/8 p-3 text-center">
                    <p className="font-mono text-sm sm:text-base font-semibold text-[#12141C]">
                      {selectedProduct.formulationType}
                    </p>
                    <p className="text-[11px] text-[#12141C]/60 mt-0.5">
                      Formulation
                    </p>
                  </div>
                  <div className="rounded-xl bg-[#FAF8F5] border border-[#12141C]/8 p-3 text-center">
                    <p className="font-mono text-sm sm:text-base font-semibold text-[#153B24]">
                      GMP Tested
                    </p>
                    <p className="text-[11px] text-[#12141C]/60 mt-0.5">
                      Phytomax Lab
                    </p>
                  </div>
                </div>

                <p className="text-sm text-[#12141C]/75 leading-relaxed">
                  {selectedProduct.description}
                </p>

                <div className="pt-2">
                  <p className="text-xs font-semibold text-[#12141C]/65 mb-2">
                    Science-Backed Botanical Actives
                  </p>
                  <ul className="space-y-1 text-xs text-[#12141C]/75">
                    {selectedProduct.ingredients.map((ing) => (
                      <li key={ing}>· {ing}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t border-[#12141C]/10 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (BATCH_PASSPORTS[selectedProduct.batchCode]) {
                      setScannedBatchCode(selectedProduct.batchCode);
                    }
                    onChangeSubView('scan');
                  }}
                  className="min-h-[48px] px-4 py-3 rounded-xl border border-[#12141C]/15 hover:border-[#153B24] text-xs sm:text-sm font-semibold text-[#12141C] inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Batch COA</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddFeedback(selectedProduct)}
                  className="min-h-[48px] px-5 py-3 rounded-xl bg-[#153B24] hover:bg-[#102E1C] text-white text-xs sm:text-sm font-semibold cursor-pointer whitespace-nowrap"
                >
                  {justAddedId === selectedProduct.id
                    ? 'Added to Bag'
                    : 'Add to Bag'}
                </button>
                <button
                  type="button"
                  onClick={() => onQuickBuy(selectedProduct)}
                  className="flex-1 min-h-[48px] px-6 py-3 rounded-xl bg-[#9E1B24] hover:bg-[#82141C] text-white text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
                >
                  <span>Quick Buy</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ================= EXPRESS CHECKOUT IN NEPAL ================= */}
      {subView === 'checkout' && (
        <section className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setConfirmedOrder(null);
                onChangeSubView('shop');
              }}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[#12141C]/75 hover:text-[#153B24] cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Continue Shopping</span>
            </button>
            <span className="text-xs font-medium text-[#153B24]">
              CareNest Express Checkout · Nepal
            </span>
          </div>

          {confirmedOrder ? (
            <div className="rounded-2xl bg-white border border-[#12141C]/10 p-6 sm:p-10 space-y-6">
              <div className="flex items-start gap-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-700 shrink-0 mt-1" />
                <div>
                  <p className="text-xs font-mono text-emerald-700 font-semibold">
                    Order #{confirmedOrder.id} Confirmed · {confirmedOrder.status}
                  </p>
                  <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#12141C] mt-1">
                    SkinAid Order Confirmed
                  </h1>
                  <p className="text-sm text-[#12141C]/70 mt-1">
                    Queued via {confirmedOrder.courierChannel} for delivery to{' '}
                    {confirmedOrder.address}, {confirmedOrder.city}.
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-[#FAF8F5] border border-[#12141C]/10 p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#12141C]/65">Items</span>
                  <span className="font-medium text-[#12141C]">
                    {confirmedOrder.itemsSummary}
                  </span>
                </div>
                {confirmedOrder.discountNpr > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Partner Link Savings</span>
                    <span className="font-mono font-semibold">
                      -NPR {confirmedOrder.discountNpr.toLocaleString()} (10% Off)
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[#12141C]/65">Payment Method</span>
                  <span className="font-medium text-[#12141C]">
                    {confirmedOrder.paymentMethod}{' '}
                    {confirmedOrder.paymentCollected ? '· Paid' : '· Cash on Delivery'}
                  </span>
                </div>
                {confirmedOrder.paymentTransactionId && (
                  <div className="flex justify-between">
                    <span className="text-[#12141C]/65">Gateway Receipt ID</span>
                    <span className="font-mono font-semibold text-[#153B24]">
                      {confirmedOrder.paymentTransactionId}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-semibold pt-2 border-t border-[#12141C]/10">
                  <span>Total</span>
                  <span className="font-mono tabular-nums">
                    NPR {confirmedOrder.totalNpr.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setTrackOrderId(confirmedOrder.id);
                    setConfirmedOrder(null);
                    onChangeSubView('track');
                  }}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#153B24] hover:bg-[#9E1B24] text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
                >
                  <PackageCheck className="w-4 h-4" />
                  <span>Track Order #{confirmedOrder.id}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmedOrder(null);
                    onChangeSubView('routine');
                  }}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl border border-[#12141C]/15 text-xs sm:text-sm font-semibold text-[#12141C] cursor-pointer"
                >
                  Open Daily Routine
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmedOrder(null);
                    onChangeSubView('shop');
                  }}
                  className="min-h-[44px] px-4 py-2.5 text-xs sm:text-sm font-medium text-[#12141C]/70 hover:text-[#12141C] cursor-pointer"
                >
                  Return to Store
                </button>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleCheckoutSubmit}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
            >
              <div className="lg:col-span-7 rounded-2xl bg-white border border-[#12141C]/10 p-6 space-y-6">
                <h1 className="font-display text-2xl font-semibold text-[#12141C]">
                  Express Delivery in Nepal
                </h1>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="chk-name"
                      className="block text-xs font-semibold text-[#12141C]/70 mb-1.5"
                    >
                      Recipient Name
                    </label>
                    <input
                      id="chk-name"
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#12141C]/15 bg-[#FAF8F5] text-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="chk-phone"
                      className="block text-xs font-semibold text-[#12141C]/70 mb-1.5"
                    >
                      Nepal Mobile Number
                    </label>
                    <input
                      id="chk-phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#12141C]/15 bg-[#FAF8F5] text-sm font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="chk-address"
                      className="block text-xs font-semibold text-[#12141C]/70 mb-1.5"
                    >
                      Delivery Address (Ward / Tole)
                    </label>
                    <input
                      id="chk-address"
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#12141C]/15 bg-[#FAF8F5] text-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="chk-city"
                      className="block text-xs font-semibold text-[#12141C]/70 mb-1.5"
                    >
                      Valley / City
                    </label>
                    <select
                      id="chk-city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#12141C]/15 bg-[#FAF8F5] text-sm"
                    >
                      <option value="Lalitpur">Lalitpur</option>
                      <option value="Kathmandu">Kathmandu</option>
                      <option value="Bhaktapur">Bhaktapur</option>
                      <option value="Bharatpur">Bharatpur, Chitwan</option>
                      <option value="Pokhara">Pokhara</option>
                    </select>
                  </div>
                </div>

                {activeAffiliateCode ? (
                  <div className="rounded-xl bg-[#153B24]/5 border border-[#153B24]/20 p-4 flex items-center justify-between gap-3 text-xs">
                    <span className="font-semibold text-[#153B24] inline-flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 shrink-0" />
                      <span>10% Partner Benefit Applied at Checkout</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onSetAffiliateCode('');
                        setReferralDraft('');
                        setReferralError(null);
                      }}
                      className="text-xs font-medium text-[#12141C]/60 hover:text-[#9E1B24] underline cursor-pointer shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="rounded-xl border border-[#12141C]/10 bg-[#FAF8F5] p-3.5 space-y-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setShowReferralInput((prev) => !prev);
                        setReferralError(null);
                      }}
                      className="w-full flex items-center justify-between text-xs font-medium text-[#12141C]/75 hover:text-[#153B24] cursor-pointer"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-[#153B24]" />
                        <span>Have a referral code? (Optional)</span>
                      </span>
                      <span className="text-[#153B24] font-semibold">
                        {showReferralInput ? 'Hide' : 'Apply'}
                      </span>
                    </button>
                    {showReferralInput && (
                      <div className="space-y-2 pt-1">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={referralDraft}
                            onChange={(e) => {
                              setReferralDraft(e.target.value.toUpperCase());
                              setReferralError(null);
                            }}
                            placeholder="Enter referral code"
                            aria-label="Optional referral code"
                            className="flex-1 min-h-[40px] px-3 py-1.5 rounded-lg border border-[#12141C]/15 bg-white font-mono text-xs uppercase text-[#12141C] focus:outline-none focus:border-[#153B24]"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const cleaned = referralDraft.trim().toUpperCase();
                              if (!cleaned) return;
                              const isValid =
                                activeAffiliates.some(
                                  (a) =>
                                    a.status === 'Active' &&
                                    a.referralCode.toUpperCase() === cleaned
                                ) || Boolean(CREATOR_DIRECTORY_CODES[cleaned]);
                              if (isValid) {
                                onSetAffiliateCode(cleaned);
                                setReferralError(null);
                                setShowReferralInput(false);
                              } else {
                                setReferralError('Code not recognized or inactive.');
                              }
                            }}
                            className="min-h-[40px] px-4 py-1.5 rounded-lg bg-[#153B24] hover:bg-[#102E1C] text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
                          >
                            Apply
                          </button>
                        </div>
                        {referralError && (
                          <p className="text-[11px] text-[#9E1B24]">
                            {referralError}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Payment Method Selector */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-[#12141C]/70">
                      Select Payment Gateway
                    </p>
                    <span className="text-[11px] font-mono text-[#153B24]">
                      Verified CareNest Merchant
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    {(
                      [
                        {
                          id: 'eSewa',
                          label: 'eSewa',
                          sub: 'ePay v2',
                          accent: 'text-emerald-700',
                          icon: Wallet,
                        },
                        {
                          id: 'Khalti',
                          label: 'Khalti',
                          sub: 'Digital Wallet',
                          accent: 'text-purple-700',
                          icon: Wallet,
                        },
                        {
                          id: 'Fonepay QR',
                          label: 'Fonepay QR',
                          sub: 'Bank Scan',
                          accent: 'text-[#9E1B24]',
                          icon: QrCode,
                        },
                        {
                          id: 'Card',
                          label: 'Card',
                          sub: 'Visa / Master',
                          accent: 'text-[#12141C]',
                          icon: CreditCard,
                        },
                        {
                          id: 'COD',
                          label: 'COD',
                          sub: 'Cash Courier',
                          accent: 'text-[#12141C]',
                          icon: Banknote,
                        },
                      ] as const
                    ).map((method) => {
                      const Icon = method.icon;
                      const isSelected = paymentMethod === method.id;
                      return (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => setPaymentMethod(method.id)}
                          className={`min-h-[68px] p-2.5 rounded-xl border flex flex-col items-center justify-center gap-0.5 text-xs font-semibold transition-colors cursor-pointer ${
                            isSelected
                              ? 'border-[#153B24] bg-[#153B24]/6 text-[#153B24]'
                              : 'border-[#12141C]/15 bg-[#FAF8F5] text-[#12141C]/75 hover:border-[#12141C]'
                          }`}
                        >
                          <Icon
                            className={`w-4 h-4 mb-0.5 ${
                              isSelected ? 'text-[#153B24]' : method.accent
                            }`}
                          />
                          <span>{method.label}</span>
                          <span className="text-[10px] font-normal opacity-70">
                            {method.sub}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 rounded-2xl bg-white border border-[#12141C]/10 p-6 space-y-5">
                <h2 className="font-display text-xl font-semibold text-[#12141C]">
                  Order Summary
                </h2>

                {cart.length === 0 ? (
                  <p className="text-sm text-[#12141C]/65">
                    Your bag is empty. Add a SkinAid formulation first.
                  </p>
                ) : (
                  <ul className="divide-y divide-[#12141C]/10">
                    {cart.map(({ product, quantity }) => (
                      <li
                        key={product.id}
                        className="py-3 flex items-center justify-between gap-3 text-sm"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-[#12141C] truncate">
                            {product.shortName}
                          </p>
                          <p className="text-xs text-[#12141C]/55">
                            Qty {quantity} · {product.volume}
                          </p>
                        </div>
                        <span className="font-mono font-semibold tabular-nums shrink-0">
                          NPR {(product.priceNpr * quantity).toLocaleString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="space-y-2 text-sm border-t border-[#12141C]/10 pt-4">
                  <div className="flex justify-between text-[#12141C]/65">
                    <span>Subtotal</span>
                    <span className="font-mono tabular-nums">
                      NPR {cartSubtotal.toLocaleString()}
                    </span>
                  </div>
                  {discountNpr > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Partner Link Savings (10%)</span>
                      <span className="font-mono tabular-nums">
                        -NPR {discountNpr.toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-[#12141C]/65">
                    <span>Express Valley Delivery</span>
                    <span className="font-semibold text-emerald-700">FREE</span>
                  </div>
                  <div className="flex justify-between text-base font-semibold text-[#12141C] pt-2 border-t border-[#12141C]/10">
                    <span>Total Payable</span>
                    <span className="font-mono tabular-nums">
                      NPR {finalTotalNpr.toLocaleString()}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={cart.length === 0}
                  className="w-full min-h-[48px] px-6 py-3 rounded-xl bg-[#9E1B24] hover:bg-[#82141C] disabled:opacity-40 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <span>
                    {paymentMethod === 'COD'
                      ? `Confirm COD Order (NPR ${finalTotalNpr.toLocaleString()})`
                      : `Pay NPR ${finalTotalNpr.toLocaleString()} via ${paymentMethod}`}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {paymentMethod !== 'COD' && (
            <PaymentGatewayModal
              isOpen={gatewayModalOpen}
              method={paymentMethod as OnlineGatewayMethod}
              amountNpr={finalTotalNpr}
              customerName={customerName}
              customerPhone={phone}
              onClose={() => setGatewayModalOpen(false)}
              onVerified={finalizeOrderPlacement}
            />
          )}
        </section>
      )}

      {/* ================= 30-DAY ROUTINE TRACKER ================= */}
      {subView === 'routine' && (
        <section className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 space-y-6">
              <div className="rounded-2xl bg-white border border-[#12141C]/10 p-6 flex items-center justify-between gap-6">
                <div>
                  <p className="text-xs font-medium text-[#153B24]">
                    30-Day SkinAid Routine Tracker · Day 21
                  </p>
                  <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#12141C] mt-1">
                    Barrier Health {barrierHealthPct}%
                  </h1>
                  <p className="text-sm text-[#12141C]/65 mt-1">
                    TEWL protection active · {completedStepsCount} of{' '}
                    {routineSteps.length} daily steps logged
                  </p>
                </div>

                <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                  <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                    <circle
                      cx="40"
                      cy="40"
                      r={ringRadius}
                      fill="none"
                      stroke="#EFEAE3"
                      strokeWidth="7"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r={ringRadius}
                      fill="none"
                      stroke="#153B24"
                      strokeWidth="7"
                      strokeLinecap="round"
                      strokeDasharray={ringCircumference}
                      strokeDashoffset={ringOffset}
                      className="transition-all duration-300"
                    />
                  </svg>
                  <span className="absolute font-mono text-sm font-semibold text-[#12141C] tabular-nums">
                    {barrierHealthPct}%
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <h2 className="text-xs font-semibold text-[#12141C]/65 tracking-wide">
                  Today&apos;s SkinAid Protocol
                </h2>
                {routineSteps.map((step) => (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => onToggleRoutineStep(step.id)}
                    className={`w-full text-left rounded-2xl p-4 sm:p-5 border transition-colors cursor-pointer flex items-center justify-between gap-4 min-h-[64px] ${
                      step.completed
                        ? 'bg-white border-[#153B24]/40'
                        : 'bg-white/75 border-[#12141C]/10 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center border transition-colors shrink-0 ${
                          step.completed
                            ? 'bg-[#153B24] border-[#153B24] text-white'
                            : 'border-[#12141C]/25 bg-white'
                        }`}
                      >
                        {step.completed && <Check className="w-3.5 h-3.5" />}
                      </span>
                      <div>
                        <p
                          className={`text-sm font-semibold ${
                            step.completed
                              ? 'text-[#12141C]'
                              : 'text-[#12141C]/85'
                          }`}
                        >
                          {step.title}
                        </p>
                        <p className="text-xs text-[#12141C]/55">
                          {step.productName}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-xs text-[#12141C]/60 shrink-0 tabular-nums">
                      {step.scheduledTime}
                    </span>
                  </button>
                ))}

                {/* Add Custom Routine Step */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newStepTitle.trim()) return;
                    onAddRoutineStep({
                      title: newStepTitle.trim(),
                      productName: newStepProduct,
                      timeOfDay: newStepTimeOfDay,
                      scheduledTime:
                        newStepTimeOfDay === 'Morning'
                          ? '07:45 AM'
                          : newStepTimeOfDay === 'Midday'
                          ? '01:00 PM'
                          : '09:45 PM',
                    });
                    setNewStepTitle('');
                  }}
                  className="rounded-2xl bg-[#FAF8F5] border border-[#12141C]/10 p-4 flex flex-wrap items-center gap-2.5"
                >
                  <input
                    type="text"
                    value={newStepTitle}
                    onChange={(e) => setNewStepTitle(e.target.value)}
                    placeholder="Add custom step (e.g., Reapply Tinted SPF)"
                    className="flex-1 min-w-[180px] min-h-[40px] px-3 py-1.5 rounded-lg border border-[#12141C]/15 bg-white text-xs"
                  />
                  <select
                    value={newStepProduct}
                    onChange={(e) => setNewStepProduct(e.target.value)}
                    aria-label="SkinAid product for routine step"
                    className="min-h-[40px] px-2.5 py-1.5 rounded-lg border border-[#12141C]/15 bg-white text-xs max-w-[180px]"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.shortName}>
                        {p.shortName}
                      </option>
                    ))}
                  </select>
                  <select
                    value={newStepTimeOfDay}
                    onChange={(e) =>
                      setNewStepTimeOfDay(
                        e.target.value as 'Morning' | 'Midday' | 'Night'
                      )
                    }
                    aria-label="Time of day"
                    className="min-h-[40px] px-2.5 py-1.5 rounded-lg border border-[#12141C]/15 bg-white text-xs"
                  >
                    <option value="Morning">Morning</option>
                    <option value="Midday">Midday</option>
                    <option value="Night">Night</option>
                  </select>
                  <button
                    type="submit"
                    className="min-h-[40px] px-3.5 py-1.5 rounded-lg bg-[#153B24] hover:bg-[#9E1B24] text-white text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Step</span>
                  </button>
                </form>
              </div>
            </div>

            <div className="lg:col-span-5 rounded-2xl bg-white border border-[#12141C]/10 p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#12141C]/60">Skin Progress Log</p>
                  <h2 className="font-display text-xl font-semibold text-[#12141C]">
                    Baseline vs Day 21 Radiance
                  </h2>
                </div>
                <div className="inline-flex p-1 rounded-lg bg-[#FAF8F5] border border-[#12141C]/10">
                  <button
                    type="button"
                    onClick={() => setSkinDayView('day1')}
                    className={`px-3 py-1 rounded-md text-xs font-medium cursor-pointer ${
                      skinDayView === 'day1'
                        ? 'bg-[#12141C] text-white'
                        : 'text-[#12141C]/65'
                    }`}
                  >
                    Day 1
                  </button>
                  <button
                    type="button"
                    onClick={() => setSkinDayView('day21')}
                    className={`px-3 py-1 rounded-md text-xs font-medium cursor-pointer ${
                      skinDayView === 'day21'
                        ? 'bg-[#153B24] text-white'
                        : 'text-[#12141C]/65'
                    }`}
                  >
                    Day 21
                  </button>
                </div>
              </div>

              <div className="rounded-2xl overflow-hidden border border-[#12141C]/10">
                <ResilientImage
                  src={
                    skinDayView === 'day21'
                      ? CARENEST_IMAGES.skinRadiance
                      : CARENEST_IMAGES.creatorPortrait
                  }
                  alt="SkinAid 21-day barrier repair result"
                  fallbackTitle="Skin Progress"
                  className="w-full h-64 object-cover"
                />
                <div className="p-4 bg-[#FAF8F5] flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#12141C]">
                    {skinDayView === 'day21'
                      ? 'Day 21 · Reduced Redness & Even Tone'
                      : 'Day 1 · Urban Dust & UV Stress'}
                  </span>
                  <span className="font-mono text-[#153B24] tabular-nums">
                    {skinDayView === 'day21' ? '82% Hydration' : '46% Hydration'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Personalized SkinAid Concern Regimen Recommender */}
          <div className="rounded-2xl bg-white border border-[#12141C]/10 p-6 sm:p-8 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-[#153B24]">
                  Chitwan Phyto Lab Regimen Recommender
                </p>
                <h2 className="font-display text-2xl font-semibold text-[#12141C] mt-0.5">
                  Match Your Skin or Hair Goal
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {SKIN_CONCERN_PROTOCOLS.map((protocol) => (
                  <button
                    key={protocol.id}
                    type="button"
                    onClick={() => setSelectedConcernId(protocol.id)}
                    className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                      selectedConcernId === protocol.id
                        ? 'bg-[#153B24] text-white'
                        : 'bg-[#FAF8F5] border border-[#12141C]/10 text-[#12141C]/75 hover:text-[#12141C]'
                    }`}
                  >
                    {protocol.label}
                  </button>
                ))}
              </div>
            </div>

            {(() => {
              const activeProtocol =
                SKIN_CONCERN_PROTOCOLS.find((p) => p.id === selectedConcernId) ||
                SKIN_CONCERN_PROTOCOLS[0];
              const recProducts = activeProtocol.productIds
                .map((id) => products.find((p) => p.id === id))
                .filter((p): p is Product => Boolean(p));

              return (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center pt-2 border-t border-[#12141C]/10">
                  <div className="lg:col-span-5 space-y-3">
                    <p className="text-sm text-[#12141C]/80 leading-relaxed">
                      {activeProtocol.summary}
                    </p>
                    <div className="space-y-1.5 text-xs text-[#12141C]/70">
                      <p>
                        <span className="font-semibold text-[#153B24]">
                          AM:{' '}
                        </span>
                        {activeProtocol.morningNote}
                      </p>
                      <p>
                        <span className="font-semibold text-[#153B24]">
                          PM:{' '}
                        </span>
                        {activeProtocol.nightNote}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onAddBundleToCart(activeProtocol.productIds);
                        setAddedBundleId(activeProtocol.id);
                        setTimeout(() => setAddedBundleId(null), 1600);
                      }}
                      className="min-h-[42px] px-5 py-2 rounded-xl bg-[#9E1B24] hover:bg-[#82141C] text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <span>
                        {addedBundleId === activeProtocol.id
                          ? 'Recommended Regimen Added'
                          : 'Add Recommended Regimen to Bag'}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {recProducts.map((rp) => (
                      <button
                        key={rp.id}
                        type="button"
                        onClick={() => handleOpenProduct(rp)}
                        className="text-left rounded-xl bg-[#FAF8F5] border border-[#12141C]/10 hover:border-[#153B24] p-3 space-y-2 cursor-pointer transition-colors"
                      >
                        <ResilientImage
                          src={rp.image}
                          alt={rp.shortName}
                          fallbackTitle={rp.shortName}
                          className="w-full h-24 object-contain bg-[#F3EFE9] rounded-lg p-1.5"
                        />
                        <p className="text-xs font-semibold text-[#12141C] line-clamp-2">
                          {rp.shortName}
                        </p>
                        <p className="font-mono text-xs text-[#153B24] font-semibold tabular-nums">
                          NPR {rp.priceNpr.toLocaleString()}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </section>
      )}

      {/* ================= QR ORIGIN SCANNER & BATCH PASSPORT ================= */}
      {subView === 'scan' && (
        <section className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 rounded-3xl bg-[#153B24] text-white p-6 sm:p-8 space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-amber-300">
                    Phytomax Care Lab QR Generator
                  </p>
                  <h1 className="font-display text-2xl sm:text-3xl font-semibold mt-1">
                    Batch COA Scanner
                  </h1>
                </div>
                <div className="inline-flex rounded-lg bg-white/10 p-1 shrink-0">
                  {(
                    [
                      { id: 'url', label: 'Verify URL' },
                      { id: 'passport', label: 'COA String' },
                    ] as const
                  ).map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setQrPayloadFormat(mode.id)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium cursor-pointer transition-colors ${
                        qrPayloadFormat === mode.id
                          ? 'bg-white text-[#153B24]'
                          : 'text-white/75 hover:text-white'
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              {(() => {
                const effectiveBatchCode =
                  customBatchInput.trim().toUpperCase() || scannedBatchCode;
                const matchedCoa = BATCH_PASSPORTS[effectiveBatchCode];
                const effectiveCoaNumber =
                  matchedCoa?.coaNumber || `COA-PHY-${effectiveBatchCode.slice(-3) || 'LAB'}`;
                const originBase =
                  typeof window !== 'undefined'
                    ? window.location.origin
                    : 'https://carenest.com.np';
                const qrPayload =
                  qrPayloadFormat === 'url'
                    ? `${originBase}/?batch=${encodeURIComponent(effectiveBatchCode)}&coa=${encodeURIComponent(effectiveCoaNumber)}`
                    : `CARENEST|SKINAID|BATCH:${effectiveBatchCode}|COA:${effectiveCoaNumber}|LAB:PHYTOMAX-CHITWAN`;

                return (
                  <div className="rounded-2xl border border-white/15 bg-[#0D2517] p-5 flex flex-col items-center justify-center space-y-3">
                    <BatchQrCode
                      value={qrPayload}
                      batchCode={effectiveBatchCode}
                      productLabel={
                        matchedCoa?.productName ||
                        'Custom Chitwan Lab Lot Verification'
                      }
                      size={188}
                      darkColor="#153B24"
                      showActions={true}
                    />
                    <p className="font-mono text-[10px] text-white/60 break-all text-center px-2">
                      {qrPayload}
                    </p>
                    {isScanning && (
                      <p className="text-xs text-emerald-300 font-mono">
                        Verifying Chitwan Lab signature for #{effectiveBatchCode}...
                      </p>
                    )}
                  </div>
                );
              })()}

              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="batch-product-select"
                    className="block text-xs text-white/75 mb-1.5"
                  >
                    Select SkinAid Product Batch (10 Lab Lots)
                  </label>
                  <select
                    id="batch-product-select"
                    value={scannedBatchCode}
                    onChange={(e) => {
                      setScannedBatchCode(e.target.value);
                      setCustomBatchInput('');
                    }}
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-xs font-medium text-white focus:outline-none focus:border-amber-300"
                  >
                    {products.map((prod) => (
                      <option
                        key={prod.batchCode}
                        value={prod.batchCode}
                        className="text-[#12141C] bg-white"
                      >
                        #{prod.batchCode} · {prod.shortName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="custom-batch-lot"
                    className="block text-xs text-white/75 mb-1.5"
                  >
                    Or Mint Custom Lab Lot QR Code
                  </label>
                  <input
                    id="custom-batch-lot"
                    type="text"
                    value={customBatchInput}
                    onChange={(e) =>
                      setCustomBatchInput(e.target.value.toUpperCase())
                    }
                    placeholder="e.g. SA-26-508 (optional)"
                    className="w-full min-h-[40px] px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-xs font-mono text-white placeholder:text-white/40 uppercase focus:outline-none focus:border-amber-300"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleTriggerScan}
                  className="w-full min-h-[46px] px-5 py-2.5 rounded-xl bg-[#9E1B24] hover:bg-[#82141C] text-white text-sm font-semibold cursor-pointer transition-colors"
                >
                  {isScanning ? 'Verifying Signature...' : 'Tap to Verify Batch'}
                </button>
              </div>
            </div>

            <div className="lg:col-span-7 rounded-3xl bg-white border border-[#12141C]/10 p-6 sm:p-8 space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#12141C]/10 pb-4">
                <div>
                  <p className="text-xs text-[#12141C]/60">
                    {activePassport.productName}
                  </p>
                  <h2 className="font-display text-2xl font-semibold text-[#12141C] mt-0.5">
                    {activePassport.title}
                  </h2>
                </div>
                <span className="text-xs font-semibold text-emerald-700 inline-flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Batch Verified</span>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl bg-[#FAF8F5] p-4">
                  <p className="text-xs text-[#12141C]/60">Facility</p>
                  <p className="text-sm font-semibold text-[#12141C] mt-1">
                    {activePassport.origin}
                  </p>
                </div>
                <div className="rounded-xl bg-[#FAF8F5] p-4">
                  <p className="text-xs text-[#12141C]/60">Formulated By</p>
                  <p className="text-sm font-semibold text-[#12141C] mt-1">
                    {activePassport.formulatedBy}
                  </p>
                </div>
                <div className="rounded-xl bg-[#FAF8F5] p-4">
                  <p className="text-xs text-[#12141C]/60">Key Actives</p>
                  <p className="text-sm font-semibold text-[#153B24] mt-1">
                    {activePassport.activeComplex}
                  </p>
                </div>
                <div className="rounded-xl bg-[#FAF8F5] p-4">
                  <p className="text-xs text-[#12141C]/60">Lab Status</p>
                  <p className="text-sm font-semibold text-emerald-700 mt-1">
                    {activePassport.labStatus}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowInlineCoa((v) => !v)}
                className="w-full min-h-[48px] px-6 py-3 rounded-xl bg-[#153B24] hover:bg-[#9E1B24] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <FlaskConical className="w-4 h-4" />
                <span>
                  {showInlineCoa
                    ? 'Hide HPLC Lab COA'
                    : 'Inspect HPLC Lab COA & Assays'}
                </span>
              </button>

              {showInlineCoa && (
                <div className="rounded-2xl bg-[#FAF8F5] border border-[#12141C]/10 p-5 space-y-3 text-xs">
                  <div className="flex justify-between font-semibold text-[#12141C]">
                    <span>Certificate #{activePassport.coaNumber}</span>
                    <span>Valid until {activePassport.validUntil}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-[#12141C]/10">
                    <div>
                      <span className="text-[#12141C]/60">Active Assay: </span>
                      <span className="font-mono font-semibold">
                        {activePassport.activeAssay}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#12141C]/60">pH Profile: </span>
                      <span className="font-mono font-semibold">
                        {activePassport.phBalance}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#12141C]/60">Heavy Metals: </span>
                      <span className="font-mono font-semibold text-emerald-700">
                        {activePassport.heavyMetals}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#12141C]/60">Microbial: </span>
                      <span className="font-mono font-semibold">
                        {activePassport.microbialCount}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ================= LIVE ORDER STATUS TRACKER (STRICT SHOPPER PRIVACY) ================= */}
      {subView === 'track' && (
        <section className="max-w-4xl mx-auto space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-[#153B24]">
                CareNest Nepal Fulfillment Tracker · Private Order Lookup
              </p>
              <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#12141C] mt-0.5">
                Track Your SkinAid Order
              </h1>
            </div>

            {myOrders.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {myOrders.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => {
                      setTrackOrderId(o.id);
                      setTrackError(null);
                    }}
                    className={`min-h-[36px] px-3 py-1.5 rounded-lg font-mono text-xs font-semibold cursor-pointer transition-colors ${
                      trackOrderId === o.id
                        ? 'bg-[#153B24] text-white'
                        : 'bg-white border border-[#12141C]/15 text-[#12141C] hover:border-[#153B24]'
                    }`}
                  >
                    My Order #{o.id}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Secure Order ID + Mobile Verification Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setTrackError(null);
              const cleanedId = trackOrderId.trim().replace('#', '').toUpperCase();
              const inputPhoneDigits = trackPhoneInput.replace(/\D/g, '').slice(-10);

              if (!cleanedId) {
                setTrackError('Please enter your Order ID (e.g. CN-410).');
                return;
              }

              // If the user already owns this order in their signed-in/session orders, show directly
              const ownOrder = myOrders.find(
                (o) => o.id.toUpperCase() === cleanedId
              );
              if (ownOrder) {
                setVerifiedGuestOrderId(ownOrder.id);
                return;
              }

              if (inputPhoneDigits.length < 10) {
                setVerifiedGuestOrderId(null);
                setTrackError(
                  'Enter the 10-digit Nepal mobile number used on your order to verify ownership.'
                );
                return;
              }

              const matched = orders.find((o) => {
                const orderPhoneDigits = o.phone.replace(/\D/g, '').slice(-10);
                return (
                  o.id.toUpperCase() === cleanedId &&
                  orderPhoneDigits === inputPhoneDigits
                );
              });

              if (!matched) {
                setVerifiedGuestOrderId(null);
                setTrackError(
                  'Order not found or mobile number does not match. For privacy, shoppers can only track their own orders.'
                );
                return;
              }

              setVerifiedGuestOrderId(matched.id);
            }}
            className="rounded-2xl bg-white border border-[#12141C]/10 p-5 sm:p-6 space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold text-[#12141C]/75 inline-flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#153B24]" />
                <span>Verify Order Ownership</span>
              </p>
              {!isShopperSignedIn && (
                <button
                  type="button"
                  onClick={() => onOpenShopperAuth('signin')}
                  className="text-xs font-semibold text-[#153B24] hover:underline cursor-pointer"
                >
                  Sign In to view all your orders
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-4">
                <label
                  htmlFor="track-order-id"
                  className="block text-[11px] font-medium text-[#12141C]/65 mb-1"
                >
                  Order ID
                </label>
                <input
                  id="track-order-id"
                  type="text"
                  value={trackOrderId}
                  onChange={(e) => {
                    setTrackOrderId(e.target.value.toUpperCase());
                    setTrackError(null);
                  }}
                  placeholder="e.g. CN-410"
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-[#12141C]/15 bg-[#FAF8F5] font-mono text-sm uppercase text-[#12141C] focus:outline-none focus:border-[#153B24]"
                />
              </div>

              <div className="sm:col-span-5">
                <label
                  htmlFor="track-order-phone"
                  className="block text-[11px] font-medium text-[#12141C]/65 mb-1"
                >
                  Registered Nepal Mobile
                </label>
                <input
                  id="track-order-phone"
                  type="tel"
                  value={trackPhoneInput}
                  onChange={(e) => {
                    setTrackPhoneInput(e.target.value);
                    setTrackError(null);
                  }}
                  placeholder="+977 98XXXXXXXX"
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-[#12141C]/15 bg-[#FAF8F5] text-sm text-[#12141C] focus:outline-none focus:border-[#153B24]"
                />
              </div>

              <div className="sm:col-span-3 flex items-end">
                <button
                  type="submit"
                  className="w-full min-h-[42px] px-4 py-2 rounded-xl bg-[#153B24] hover:bg-[#102E1C] text-white text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  <span>Track Order</span>
                </button>
              </div>
            </div>

            {trackError && (
              <div className="rounded-xl bg-[#9E1B24]/8 border border-[#9E1B24]/25 px-3.5 py-2.5 text-xs font-medium text-[#9E1B24] flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{trackError}</span>
              </div>
            )}
          </form>

          {(() => {
            const normalizedTrackId = trackOrderId
              .trim()
              .replace('#', '')
              .toUpperCase();

            // ONLY display an order if it belongs to myOrders OR was verified with exact Order ID + mobile number
            const matchedOwnOrder = myOrders.find(
              (o) => o.id.toUpperCase() === normalizedTrackId
            );
            const matchedVerifiedGuestOrder = verifiedGuestOrderId
              ? orders.find(
                  (o) =>
                    o.id.toUpperCase() === verifiedGuestOrderId.toUpperCase()
                )
              : undefined;
            const matchedOrder = matchedOwnOrder || matchedVerifiedGuestOrder;

            if (!matchedOrder) {
              return (
                <div className="rounded-2xl bg-white border border-[#12141C]/10 p-8 sm:p-10 text-center space-y-3">
                  <PackageCheck className="w-8 h-8 text-[#153B24]/50 mx-auto" />
                  <p className="text-sm font-medium text-[#12141C]">
                    {isShopperSignedIn
                      ? 'You have no orders matching that ID yet.'
                      : 'Sign in or enter your Order ID + Mobile Number above.'}
                  </p>
                  <p className="text-xs text-[#12141C]/60 max-w-md mx-auto">
                    For shopper privacy, CareNest only reveals tracking details to the verified customer who placed the order.
                  </p>
                </div>
              );
            }

            const steps: Array<'Packing in Lab' | 'Dispatched' | 'Delivered'> = [
              'Packing in Lab',
              'Dispatched',
              'Delivered',
            ];
            const currentIdx = steps.indexOf(matchedOrder.status);

            return (
              <div className="rounded-2xl bg-white border border-[#12141C]/10 p-6 sm:p-8 space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#12141C]/10 pb-5">
                  <div>
                    <p className="font-mono text-xs font-semibold text-[#153B24]">
                      Order #{matchedOrder.id} · {matchedOrder.date}
                    </p>
                    <h2 className="font-display text-xl sm:text-2xl font-semibold text-[#12141C] mt-1">
                      {matchedOrder.customerName} — {matchedOrder.city}
                    </h2>
                    <p className="text-xs text-[#12141C]/65 mt-0.5">
                      {matchedOrder.address} · {matchedOrder.courierChannel}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="font-mono text-lg font-semibold text-[#12141C] tabular-nums">
                      NPR {matchedOrder.totalNpr.toLocaleString()}
                    </p>
                    <p className="text-xs text-[#12141C]/60">
                      {matchedOrder.paymentMethod} ·{' '}
                      {matchedOrder.paymentCollected
                        ? 'Paid'
                        : 'Collect on Delivery'}
                    </p>
                  </div>
                </div>

                {/* 3-Stage Fulfillment Timeline */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {steps.map((stage, idx) => {
                    const reached = idx <= currentIdx;
                    return (
                      <div
                        key={stage}
                        className={`rounded-xl p-4 border ${
                          reached
                            ? 'bg-[#153B24]/5 border-[#153B24] text-[#153B24]'
                            : 'bg-[#FAF8F5] border-[#12141C]/10 text-[#12141C]/45'
                        }`}
                      >
                        <p className="font-mono text-[11px] font-semibold">
                          STEP 0{idx + 1}
                        </p>
                        <p className="text-sm font-semibold mt-1">{stage}</p>
                        <p className="text-xs mt-0.5 opacity-80">
                          {stage === 'Packing in Lab'
                            ? 'Bharatpur-16 QC & sealed kit'
                            : stage === 'Dispatched'
                            ? matchedOrder.courierChannel
                            : 'Delivered to customer'}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="rounded-xl bg-[#FAF8F5] border border-[#12141C]/10 p-4 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-[#12141C]/75">
                    <strong>Items:</strong> {matchedOrder.itemsSummary}
                  </span>
                  {matchedOrder.discountNpr > 0 && (
                    <span className="font-mono font-semibold text-[#153B24]">
                      Saved NPR {matchedOrder.discountNpr.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            );
          })()}
        </section>
      )}

      {/* ================= REVIEWS & UGC HUB ================= */}
      {subView === 'reviews' && (
        <section className="space-y-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-[#153B24]">
                Verified SkinAid Reviews · CareNest Community
              </p>
              <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#12141C] mt-0.5">
                Reviews &amp; Creator UGC · 4.9 / 5.0
              </h1>
            </div>

            <button
              type="button"
              onClick={() => setShowReviewForm((v) => !v)}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#9E1B24] hover:bg-[#82141C] text-white text-xs sm:text-sm font-semibold cursor-pointer whitespace-nowrap"
            >
              {showReviewForm ? 'Cancel Review' : '+ Submit Verified Review'}
            </button>
          </div>

          {showReviewForm && (
            <form
              onSubmit={handleReviewSubmit}
              className="rounded-2xl bg-white border border-[#12141C]/15 p-6 space-y-4 max-w-2xl"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  required
                  value={reviewAuthor}
                  onChange={(e) => setReviewAuthor(e.target.value)}
                  placeholder="Your Name (e.g. Kritika R.)"
                  className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#12141C]/15 bg-[#FAF8F5] text-sm"
                />
                <input
                  type="text"
                  value={reviewLocation}
                  onChange={(e) => setReviewLocation(e.target.value)}
                  placeholder="City (e.g. Patan, Lalitpur)"
                  className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#12141C]/15 bg-[#FAF8F5] text-sm"
                />
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-[#12141C]/70">Rating:</span>
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setReviewRating(num)}
                    className="p-1 cursor-pointer"
                    aria-label={`${num} stars`}
                  >
                    <Star
                      className={`w-5 h-5 ${
                        num <= reviewRating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-[#12141C]/20'
                      }`}
                    />
                  </button>
                ))}
              </div>

              <textarea
                rows={3}
                required
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Share your SkinAid routine results..."
                className="w-full p-3.5 rounded-xl border border-[#12141C]/15 bg-[#FAF8F5] text-sm"
              />

              <button
                type="submit"
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#153B24] text-white text-xs sm:text-sm font-semibold cursor-pointer"
              >
                Publish Verified Review
              </button>
            </form>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 grid grid-cols-2 gap-4">
              <div className="rounded-2xl overflow-hidden border border-[#12141C]/10 bg-white">
                <ResilientImage
                  src={CARENEST_IMAGES.creatorPortrait}
                  alt="Creator SkinAid routine clip"
                  fallbackTitle="Creator Routine"
                  className="w-full h-56 object-cover"
                />
                <div className="p-3 text-xs">
                  <p className="font-semibold text-[#12141C]">Aayusha S.</p>
                  <p className="text-[#12141C]/60">SPF 50+ No White Cast</p>
                </div>
              </div>
              <div className="rounded-2xl overflow-hidden border border-[#12141C]/10 bg-white">
                <ResilientImage
                  src={CARENEST_IMAGES.skinRadiance}
                  alt="Day 21 SkinAid glowing barrier"
                  fallbackTitle="21-Day Barrier Check"
                  className="w-full h-56 object-cover"
                />
                <div className="p-3 text-xs">
                  <p className="font-semibold text-[#12141C]">Prativa M.</p>
                  <p className="text-[#12141C]/60">21-Day Repairing Toner</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-4">
              {reviews.map((rev) => (
                <article
                  key={rev.id}
                  className="rounded-2xl bg-white border border-[#12141C]/10 p-5 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-[#12141C]">
                        {rev.author} · {rev.location}
                      </p>
                      <p className="text-xs text-[#12141C]/55">
                        {rev.date} · Verified SkinAid Order
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: rev.rating }).map((_, idx) => (
                        <Star
                          key={idx}
                          className="w-3.5 h-3.5 fill-amber-400 text-amber-400"
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-sm text-[#12141C]/80 leading-relaxed">
                    {rev.comment}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-[#12141C]/8">
                    <button
                      type="button"
                      onClick={() => onToggleHelpfulReview(rev.id)}
                      className={`inline-flex items-center gap-1.5 text-xs font-medium cursor-pointer ${
                        rev.helpfulVoted
                          ? 'text-[#153B24] font-semibold'
                          : 'text-[#12141C]/60 hover:text-[#12141C]'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span className="tabular-nums">
                        Helpful ({rev.helpfulCount})
                      </span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Mobile Fixed Bottom Tab Bar */}
      <nav
        aria-label="Mobile storefront tabs"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-14 bg-white/95 backdrop-blur-md border-t border-[#12141C]/10 grid grid-cols-5 items-center"
      >
        {(
          [
            {
              id: 'shop',
              label: 'Shop',
              icon: Home,
              action: () => onChangeSubView('shop'),
            },
            {
              id: 'catalog',
              label: 'Catalog',
              icon: Grid,
              action: () => onChangeSubView('catalog'),
            },
            {
              id: 'routine',
              label: 'Routine',
              icon: CalendarCheck,
              action: () => onChangeSubView('routine'),
            },
            {
              id: 'scan',
              label: 'Scan',
              icon: QrCode,
              action: () => onChangeSubView('scan'),
            },
            {
              id: 'track',
              label: 'Track',
              icon: PackageCheck,
              action: () => onChangeSubView('track'),
            },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const isActive = subView === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={tab.action}
              className={`h-full flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                isActive ? 'text-[#153B24]' : 'text-[#12141C]/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[10px] font-medium tracking-tight">
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
