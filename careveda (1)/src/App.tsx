import { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { CartDrawer } from './components/CartDrawer';
import { StorePortal } from './components/StorePortal';
import { ShopperPortal } from './components/ShopperPortal';
import { CreatorPortal } from './components/CreatorPortal';
import { AdminPortal } from './components/AdminPortal';
import { GeminiStudioDrawer } from './components/GeminiStudioDrawer';
import { AuthTabMode, ShopperAuthModal } from './components/ShopperAuthModal';
import { PrivatePortalGate } from './components/PrivatePortalGate';
import {
  INITIAL_ADMIN_AFFILIATES,
  INITIAL_CREATOR_PROFILE,
  INITIAL_ORDERS,
  INITIAL_PRODUCTS,
  INITIAL_REVIEWS,
  INITIAL_ROUTINE_STEPS,
} from './data/carenestData';
import {
  AdminAffiliateAccount,
  CartItem,
  CreatorProfile,
  Order,
  OrderStatus,
  PaymentMethod,
  PortalView,
  Product,
  Review,
  RoutineStep,
  ShopperProfile,
  StoreSubView,
} from './types';

export default function App() {
  const initialBatchParam =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search)
          .get('batch')
          ?.trim()
          .toUpperCase() || undefined
      : undefined;

  const initialPortalParam =
    typeof window !== 'undefined'
      ? (new URLSearchParams(window.location.search)
          .get('portal')
          ?.trim()
          .toLowerCase() as PortalView | undefined)
      : undefined;

  const initialHash =
    typeof window !== 'undefined' ? window.location.hash.toLowerCase() : '';

  const resolvedInitialPortal: PortalView =
    initialPortalParam === 'creator' || initialHash === '#creator-login'
      ? 'creator'
      : initialPortalParam === 'admin' || initialHash === '#admin-login'
      ? 'admin'
      : initialPortalParam === 'shopper'
      ? 'shopper'
      : 'store';

  const [activePortal, setActivePortal] = useState<PortalView>(
    resolvedInitialPortal
  );
  const [storeSubView, setStoreSubView] = useState<StoreSubView>(
    initialBatchParam ? 'scan' : 'shop'
  );
  const [isBagOpen, setIsBagOpen] = useState(false);

  // Auth states
  const [isShopperSignedIn, setIsShopperSignedIn] = useState(false);
  const [shopperAuthModalOpen, setShopperAuthModalOpen] = useState(false);
  const [shopperAuthMode, setShopperAuthMode] = useState<AuthTabMode>('signin');
  const [isCreatorAuthenticated, setIsCreatorAuthenticated] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [stealthLauncherOpen, setStealthLauncherOpen] = useState(false);

  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('carenest_products_v1');
      if (saved) {
        const parsed = JSON.parse(saved) as Product[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore storage errors
    }
    return INITIAL_PRODUCTS;
  });
  const [cart, setCart] = useState<CartItem[]>([
    { product: products[0] ?? INITIAL_PRODUCTS[0], quantity: 1 },
  ]);
  const [promoApplied, setPromoApplied] = useState(false);
  const [activeAffiliateCode, setActiveAffiliateCode] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const refParam = new URLSearchParams(window.location.search).get('ref');
      if (refParam && refParam.trim()) {
        return refParam.trim().toUpperCase();
      }
    }
    return '';
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('carenest_orders_v1');
      if (saved) {
        const parsed = JSON.parse(saved) as Order[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore storage errors
    }
    return INITIAL_ORDERS;
  });
  const [sessionOrderIds, setSessionOrderIds] = useState<string[]>([]);
  const [routineSteps, setRoutineSteps] =
    useState<RoutineStep[]>(INITIAL_ROUTINE_STEPS);
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS);
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile>(
    INITIAL_CREATOR_PROFILE
  );
  const [adminAffiliates, setAdminAffiliates] = useState<
    AdminAffiliateAccount[]
  >(() => {
    try {
      const saved = localStorage.getItem('carenest_affiliates_v1');
      if (saved) {
        const parsed = JSON.parse(saved) as AdminAffiliateAccount[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore storage errors
    }
    return INITIAL_ADMIN_AFFILIATES;
  });
  const [shopperProfile, setShopperProfile] = useState<ShopperProfile>({
    fullName: 'Aarohi Tuladhar',
    email: 'aarohi@carenest.np',
    phone: '+977 984-155-7720',
    city: 'Lalitpur',
    address: 'Sanepa Height, Lalitpur Ward 03',
    skinFocus: 'UV & Melasma Protection',
    preferredPayment: 'eSewa',
    memberSince: 'Oct 2026',
  });
  const [savedProductIds, setSavedProductIds] = useState<string[]>([
    'skinaid-tinted-sunscreen',
    'skinaid-repairing-toner',
    'skinaid-night-cream',
  ]);
  const [scannerBatchOverride, setScannerBatchOverride] = useState<
    string | undefined
  >(initialBatchParam);

  useEffect(() => {
    try {
      localStorage.setItem('carenest_orders_v1', JSON.stringify(orders));
    } catch {
      // ignore quota errors
    }
  }, [orders]);

  useEffect(() => {
    try {
      localStorage.setItem(
        'carenest_affiliates_v1',
        JSON.stringify(adminAffiliates)
      );
    } catch {
      // ignore quota errors
    }
  }, [adminAffiliates]);

  useEffect(() => {
    try {
      localStorage.setItem('carenest_products_v1', JSON.stringify(products));
    } catch {
      // ignore quota errors
    }
  }, [products]);

  // Stealth keyboard shortcuts (using e.code so Mac Option+Shift+C / Option+Shift+A also works) & hash/url listeners
  useEffect(() => {
    const syncPortalFromLocation = () => {
      const params = new URLSearchParams(window.location.search);
      const portalQ = params.get('portal')?.trim().toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (portalQ === 'creator' || hash === '#creator-login') {
        setActivePortal('creator');
      } else if (portalQ === 'admin' || hash === '#admin-login') {
        setActivePortal('admin');
      } else if (portalQ === 'shopper') {
        setActivePortal('shopper');
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.altKey &&
        e.shiftKey &&
        (e.code === 'KeyC' || e.key.toUpperCase() === 'C')
      ) {
        e.preventDefault();
        setActivePortal('creator');
      } else if (
        e.altKey &&
        e.shiftKey &&
        (e.code === 'KeyA' || e.key.toUpperCase() === 'A')
      ) {
        e.preventDefault();
        setActivePortal('admin');
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('hashchange', syncPortalFromLocation);
    window.addEventListener('popstate', syncPortalFromLocation);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('hashchange', syncPortalFromLocation);
      window.removeEventListener('popstate', syncPortalFromLocation);
    };
  }, []);

  const normalizeLast10 = (phoneStr: string) =>
    phoneStr.replace(/\D/g, '').slice(-10);

  const shopperOwnOrders: Order[] = isShopperSignedIn
    ? orders.filter((o) => {
        if (sessionOrderIds.includes(o.id)) return true;
        if (
          o.customerEmail &&
          shopperProfile.email &&
          o.customerEmail.toLowerCase() === shopperProfile.email.toLowerCase()
        ) {
          return true;
        }
        const sp10 = normalizeLast10(shopperProfile.phone);
        const op10 = normalizeLast10(o.phone);
        return sp10.length >= 10 && op10 === sp10;
      })
    : orders.filter((o) => sessionOrderIds.includes(o.id));

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleAddToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleAddBundleToCart = (productIds: string[]) => {
    setCart((prev) => {
      const next = [...prev];
      productIds.forEach((pid) => {
        const prod = products.find((p) => p.id === pid);
        if (!prod) return;
        const idx = next.findIndex((item) => item.product.id === pid);
        if (idx >= 0) {
          next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        } else {
          next.push({ product: prod, quantity: 1 });
        }
      });
      return next;
    });
  };

  const handleToggleSaveProduct = (productId: string) => {
    setSavedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleReorderOrder = (order: Order) => {
    const summaryLower = order.itemsSummary.toLowerCase();
    const matched = products.filter(
      (p) =>
        summaryLower.includes(p.shortName.toLowerCase()) ||
        summaryLower.includes(p.name.toLowerCase()) ||
        (p.id === 'skinaid-tinted-sunscreen' && summaryLower.includes('sunscreen')) ||
        (p.id === 'skinaid-night-cream' && summaryLower.includes('night cream')) ||
        (p.id === 'skinaid-hydra-facial-kit' && summaryLower.includes('hydra facial'))
    );
    const toAdd = matched.length > 0 ? matched.map((p) => p.id) : [products[0].id];
    handleAddBundleToCart(toAdd);
  };

  const handleQuickBuy = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) return prev;
      return [...prev, { product, quantity: 1 }];
    });
    setActivePortal('store');
    setStoreSubView('checkout');
    setIsBagOpen(false);
  };

  const handleUpdateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handlePlaceOrder = (payload: {
    customerName: string;
    phone: string;
    address: string;
    city: string;
    paymentMethod: PaymentMethod;
    paymentTransactionId?: string;
    paymentGatewayMode?: 'Live' | 'Sandbox';
    affiliateCode?: string;
  }): Order => {
    const subtotalNpr = cart.reduce(
      (sum, item) => sum + item.product.priceNpr * item.quantity,
      0
    );
    const discountNpr = payload.affiliateCode
      ? Math.round(subtotalNpr * 0.1)
      : 0;
    const totalNpr = Math.max(0, subtotalNpr - discountNpr);

    const itemsSummary = cart
      .map((i) => `${i.quantity}x ${i.product.shortName}`)
      .join(' · ');

    const matchedAffiliate = payload.affiliateCode
      ? adminAffiliates.find(
          (a) => a.referralCode === payload.affiliateCode?.toUpperCase()
        )
      : undefined;

    const commissionRate =
      Math.min(
        99,
        Math.max(0, matchedAffiliate?.tierPct ?? creatorProfile.payoutTierPct)
      ) / 100;
    const commissionNpr = payload.affiliateCode
      ? Math.round(totalNpr * commissionRate)
      : 0;

    const nextNum = 416 + orders.length;
    const newOrderId = `CN-${nextNum}`;
    const courierChannel =
      payload.city === 'Bharatpur'
        ? 'Chitwan Direct Dispatch'
        : 'Kathmandu Valley Express';

    const newOrder: Order = {
      id: newOrderId,
      date: 'Nov 18, 2026',
      customerName: payload.customerName,
      customerEmail: isShopperSignedIn ? shopperProfile.email : undefined,
      phone: payload.phone,
      address: payload.address,
      city: payload.city,
      itemsSummary,
      subtotalNpr,
      discountNpr,
      totalNpr,
      affiliateCodeUsed: payload.affiliateCode,
      affiliateCommissionNpr: commissionNpr || undefined,
      paymentMethod: payload.paymentMethod,
      paymentCollected: payload.paymentMethod !== 'COD',
      paymentTransactionId: payload.paymentTransactionId,
      paymentGatewayMode: payload.paymentGatewayMode,
      status: 'Packing in Lab',
      courierChannel,
    };

    setOrders((prev) => [newOrder, ...prev]);
    setSessionOrderIds((prev) => [newOrderId, ...prev]);

    if (payload.affiliateCode && commissionNpr > 0) {
      const normalizedCode = payload.affiliateCode.toUpperCase();
      if (normalizedCode === creatorProfile.referralCode) {
        setCreatorProfile((prev) => ({
          ...prev,
          balanceNpr: prev.balanceNpr + commissionNpr,
          orders: prev.orders + 1,
          commissionHistory: [
            {
              id: `comm-${Date.now()}`,
              orderId: newOrderId,
              date: 'Nov 18, 2026',
              productSummary: itemsSummary,
              orderTotalNpr: totalNpr,
              commissionNpr,
              status: 'Pending Delivery',
            },
            ...prev.commissionHistory,
          ],
        }));
      }

      setAdminAffiliates((prev) =>
        prev.map((aff) =>
          aff.referralCode === normalizedCode
            ? {
                ...aff,
                orders: aff.orders + 1,
                grossSalesNpr: aff.grossSalesNpr + totalNpr,
                payableCommissionNpr: aff.payableCommissionNpr + commissionNpr,
              }
            : aff
        )
      );
    }

    setCart([]);
    return newOrder;
  };

  const handleToggleRoutineStep = (stepId: string) => {
    setRoutineSteps((prev) =>
      prev.map((step) =>
        step.id === stepId ? { ...step, completed: !step.completed } : step
      )
    );
  };

  const handleAddRoutineStep = (payload: {
    title: string;
    productName: string;
    timeOfDay: 'Morning' | 'Midday' | 'Night';
    scheduledTime: string;
  }) => {
    setRoutineSteps((prev) => [
      ...prev,
      {
        id: `step-${Date.now()}`,
        title: payload.title,
        productName: payload.productName,
        timeOfDay: payload.timeOfDay,
        scheduledTime: payload.scheduledTime,
        completed: false,
      },
    ]);
  };

  const handleToggleHelpfulReview = (reviewId: string) => {
    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId
          ? {
              ...r,
              helpfulVoted: !r.helpfulVoted,
              helpfulCount: r.helpfulVoted
                ? r.helpfulCount - 1
                : r.helpfulCount + 1,
            }
          : r
      )
    );
  };

  const handleAddReview = (
    payload: Omit<Review, 'id' | 'date' | 'helpfulCount' | 'verified'>
  ) => {
    const newRev: Review = {
      ...payload,
      id: `rev-${Date.now()}`,
      date: 'Nov 18, 2026',
      helpfulCount: 1,
      helpfulVoted: true,
      verified: true,
    };
    setReviews((prev) => [newRev, ...prev]);
  };

  const handleUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status,
              paymentCollected:
                status === 'Delivered' ? true : o.paymentCollected,
            }
          : o
      )
    );
    if (status === 'Delivered') {
      setCreatorProfile((prev) => ({
        ...prev,
        commissionHistory: prev.commissionHistory.map((entry) =>
          entry.orderId === orderId ? { ...entry, status: 'Settled' } : entry
        ),
      }));
    }
  };

  const handleApproveAffiliate = (affiliateId: string) => {
    const target = adminAffiliates.find((a) => a.id === affiliateId);
    setAdminAffiliates((prev) =>
      prev.map((aff) =>
        aff.id === affiliateId ? { ...aff, status: 'Active' } : aff
      )
    );
    if (target) {
      fetch(`/api/admin/creators/${encodeURIComponent(target.creatorPartnerId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Active' }),
      }).catch(() => {});
    }
  };

  const handleToggleAffiliateStatus = (affiliateId: string) => {
    const target = adminAffiliates.find((a) => a.id === affiliateId);
    if (!target) return;
    const nextStatus = target.status === 'Suspended' ? 'Active' : 'Suspended';
    setAdminAffiliates((prev) =>
      prev.map((aff) =>
        aff.id === affiliateId ? { ...aff, status: nextStatus } : aff
      )
    );
    fetch(`/api/admin/creators/${encodeURIComponent(target.creatorPartnerId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    }).catch(() => {});
  };

  const handleChangeAffiliateTier = (affiliateId: string, tierPct: number) => {
    const cappedPct = Math.min(99, Math.max(1, Math.round(tierPct * 10) / 10));
    const target = adminAffiliates.find((a) => a.id === affiliateId);
    setAdminAffiliates((prev) =>
      prev.map((aff) =>
        aff.id === affiliateId ? { ...aff, tierPct: cappedPct } : aff
      )
    );
    if (target && target.creatorPartnerId === creatorProfile.creatorPartnerId) {
      setCreatorProfile((prev) => ({ ...prev, payoutTierPct: cappedPct }));
    }
    if (target) {
      fetch(`/api/admin/creators/${encodeURIComponent(target.creatorPartnerId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tierPct: cappedPct }),
      }).catch(() => {});
    }
  };

  const handleSettleAffiliatePayout = (affiliateId: string) => {
    const target = adminAffiliates.find((a) => a.id === affiliateId);
    if (!target || target.payableCommissionNpr <= 0) return;

    const settledAmount = target.payableCommissionNpr;
    setAdminAffiliates((prev) =>
      prev.map((aff) =>
        aff.id === affiliateId ? { ...aff, payableCommissionNpr: 0 } : aff
      )
    );

    if (target.creatorPartnerId === creatorProfile.creatorPartnerId) {
      const refPrefix = target.payoutChannel === 'eSewa' ? 'ESW' : 'KHL';
      const refCode = `${refPrefix}-${Math.floor(1000000 + Math.random() * 8999999)}`;
      setCreatorProfile((prev) => ({
        ...prev,
        balanceNpr: 0,
        payoutHistory: [
          {
            id: `pay-${Date.now()}`,
            date: 'Nov 18, 2026',
            channel: target.payoutChannel,
            amountNpr: settledAmount,
            reference: refCode,
            status: 'Paid',
          },
          ...prev.payoutHistory,
        ],
      }));
    }
  };

  const handleRestockProduct = (productId: string, deltaUnits: number) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? { ...p, stockUnits: Math.max(0, p.stockUnits + deltaUnits) }
          : p
      )
    );
  };

  const handleUpdateProductCommission = (productId: string, pct: number) => {
    const cappedPct = Math.min(99, Math.max(0, Math.round(pct * 10) / 10));
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId ? { ...p, affiliateCommissionPct: cappedPct } : p
      )
    );
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              product: { ...item.product, affiliateCommissionPct: cappedPct },
            }
          : item
      )
    );
  };

  const handleUpdateProductPricing = (
    productId: string,
    pricing: {
      priceNpr: number;
      compareAtNpr: number;
      manufacturerCostNpr: number;
      affiliateCommissionPct?: number;
      stockUnits?: number;
    }
  ) => {
    const safePrice = Math.max(1, Math.round(pricing.priceNpr));
    const safeCompareAt = Math.max(safePrice, Math.round(pricing.compareAtNpr));
    const safeMfgCost = Math.max(0, Math.round(pricing.manufacturerCostNpr));
    const cappedPct =
      pricing.affiliateCommissionPct !== undefined
        ? Math.min(
            99,
            Math.max(0, Math.round(pricing.affiliateCommissionPct * 10) / 10)
          )
        : undefined;
    const safeStock =
      pricing.stockUnits !== undefined
        ? Math.max(0, Math.round(pricing.stockUnits))
        : undefined;

    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? {
              ...p,
              priceNpr: safePrice,
              compareAtNpr: safeCompareAt,
              manufacturerCostNpr: safeMfgCost,
              affiliateCommissionPct:
                cappedPct !== undefined ? cappedPct : p.affiliateCommissionPct,
              stockUnits: safeStock !== undefined ? safeStock : p.stockUnits,
            }
          : p
      )
    );
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              product: {
                ...item.product,
                priceNpr: safePrice,
                compareAtNpr: safeCompareAt,
                manufacturerCostNpr: safeMfgCost,
                affiliateCommissionPct:
                  cappedPct !== undefined
                    ? cappedPct
                    : item.product.affiliateCommissionPct,
                stockUnits:
                  safeStock !== undefined ? safeStock : item.product.stockUnits,
              },
            }
          : item
      )
    );
  };

  const handleAddProduct = (
    payload: Omit<Product, 'id' | 'rating' | 'reviewCount'> & { id?: string }
  ) => {
    const slug = payload.shortName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const safePrice = Math.max(1, Math.round(payload.priceNpr));
    const safeCompareAt = Math.max(safePrice, Math.round(payload.compareAtNpr));
    const safeMfgCost = Math.max(
      0,
      Math.round(payload.manufacturerCostNpr ?? Math.round(safePrice * 0.48))
    );
    const created: Product = {
      ...payload,
      id: payload.id || `skinaid-${slug || 'sku'}-${Date.now().toString().slice(-4)}`,
      priceNpr: safePrice,
      compareAtNpr: safeCompareAt,
      manufacturerCostNpr: safeMfgCost,
      affiliateCommissionPct: Math.min(
        99,
        Math.max(0, Math.round(payload.affiliateCommissionPct * 10) / 10)
      ),
      stockUnits: Math.max(0, Math.round(payload.stockUnits)),
      rating: 5.0,
      reviewCount: 0,
      isPackshot: true,
    };
    setProducts((prev) => [created, ...prev]);
  };

  const handleAddAffiliate = (payload: {
    creatorPartnerId: string;
    name: string;
    email: string;
    phone: string;
    handle: string;
    referralCode: string;
    passcode: string;
    tierPct: number;
    payoutChannel: 'eSewa' | 'Khalti';
  }) => {
    const cappedPct = Math.min(
      99,
      Math.max(1, Math.round(payload.tierPct * 10) / 10)
    );
    setAdminAffiliates((prev) => [
      {
        id: `aff-${Date.now()}`,
        creatorPartnerId: payload.creatorPartnerId,
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        handle: payload.handle,
        referralCode: payload.referralCode,
        passcode: payload.passcode,
        tierPct: cappedPct,
        clicks: 0,
        orders: 0,
        grossSalesNpr: 0,
        payableCommissionNpr: 0,
        payoutChannel: payload.payoutChannel,
        status: 'Active',
        createdAt: 'Nov 18, 2026',
        createdByAdmin: 'CareNest HQ Admin',
      },
      ...prev,
    ]);
  };

  const hydrateCreatorFromAccount = (aff: AdminAffiliateAccount) => {
    if (aff.creatorPartnerId === INITIAL_CREATOR_PROFILE.creatorPartnerId) {
      setCreatorProfile({
        ...INITIAL_CREATOR_PROFILE,
        payoutTierPct: aff.tierPct,
        balanceNpr: aff.payableCommissionNpr,
        orders: aff.orders,
      });
    } else {
      const matchedEntries = orders
        .filter(
          (o) =>
            o.affiliateCodeUsed?.toUpperCase() === aff.referralCode.toUpperCase()
        )
        .map((o) => ({
          id: `comm-${o.id}`,
          orderId: o.id,
          date: o.date,
          productSummary: o.itemsSummary,
          orderTotalNpr: o.totalNpr,
          commissionNpr:
            o.affiliateCommissionNpr ||
            Math.round(o.totalNpr * (aff.tierPct / 100)),
          status:
            o.status === 'Delivered'
              ? ('Settled' as const)
              : ('Pending Delivery' as const),
        }));

      setCreatorProfile({
        creatorPartnerId: aff.creatorPartnerId,
        fullName: aff.name,
        email: aff.email,
        instagramHandle: aff.handle,
        tiktokHandle: aff.tiktokHandle || aff.handle,
        audienceTier: `${aff.tierPct}% CareNest Approved Tier`,
        deliveryAddress: aff.deliveryAddress || 'Kathmandu, Nepal',
        referralCode: aff.referralCode,
        balanceNpr: aff.payableCommissionNpr,
        payoutTierPct: aff.tierPct,
        clicks: aff.clicks,
        orders: aff.orders,
        conversionRatePct: aff.clicks > 0 ? Number(((aff.orders / aff.clicks) * 100).toFixed(2)) : 0,
        enrolled: true,
        commissionHistory: matchedEntries,
        payoutHistory: [],
      });
    }
    setIsCreatorAuthenticated(true);
    setActivePortal('creator');
  };

  const openShopperAuth = (mode: AuthTabMode) => {
    setShopperAuthMode(mode);
    setShopperAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#12141C]">
      <Header
        activePortal={activePortal}
        onSelectPortal={(portal) => {
          setActivePortal(portal);
          if (portal === 'store') {
            setStoreSubView('shop');
          }
        }}
        cartCount={cartCount}
        onOpenBag={() => setIsBagOpen(true)}
        isShopperSignedIn={isShopperSignedIn}
        shopperName={shopperProfile.fullName}
        creatorPartnerId={
          isCreatorAuthenticated ? creatorProfile.creatorPartnerId : undefined
        }
        onOpenAuth={openShopperAuth}
        onSignOutInternal={() => {
          setIsCreatorAuthenticated(false);
          setIsAdminAuthenticated(false);
          setActivePortal('store');
          setStoreSubView('shop');
        }}
      />

      <main className="flex-1">
        {activePortal === 'store' && (
          <StorePortal
            products={products}
            cart={cart}
            orders={orders}
            myOrders={shopperOwnOrders}
            isShopperSignedIn={isShopperSignedIn}
            shopperProfile={shopperProfile}
            onOpenShopperAuth={openShopperAuth}
            activeAffiliates={adminAffiliates}
            routineSteps={routineSteps}
            reviews={reviews}
            subView={storeSubView}
            initialBatchCode={scannerBatchOverride}
            promoApplied={promoApplied}
            activeAffiliateCode={activeAffiliateCode}
            onSetAffiliateCode={setActiveAffiliateCode}
            onChangeSubView={setStoreSubView}
            onAddToCart={handleAddToCart}
            onAddBundleToCart={handleAddBundleToCart}
            onQuickBuy={handleQuickBuy}
            onApplyPromo={() => setPromoApplied(true)}
            onToggleRoutineStep={handleToggleRoutineStep}
            onAddRoutineStep={handleAddRoutineStep}
            onToggleHelpfulReview={handleToggleHelpfulReview}
            onAddReview={handleAddReview}
            onPlaceOrder={handlePlaceOrder}
          />
        )}

        {activePortal === 'shopper' && (
          <ShopperPortal
            profile={shopperProfile}
            orders={isShopperSignedIn ? shopperOwnOrders : []}
            products={products}
            savedProductIds={savedProductIds}
            routineSteps={routineSteps}
            hasPartnerSavings={Boolean(activeAffiliateCode)}
            onUpdateProfile={setShopperProfile}
            onToggleSaveProduct={handleToggleSaveProduct}
            onAddToCart={handleAddToCart}
            onAddBundleToCart={handleAddBundleToCart}
            onReorderOrder={handleReorderOrder}
            onToggleRoutineStep={handleToggleRoutineStep}
            onAddRoutineStep={handleAddRoutineStep}
            onOpenStoreShop={() => {
              setActivePortal('store');
              setStoreSubView('shop');
            }}
            onOpenBatchScanner={(batchCode) => {
              setScannerBatchOverride(batchCode);
              setActivePortal('store');
              setStoreSubView('scan');
            }}
            onOpenFullTracker={() => {
              setActivePortal('store');
              setStoreSubView('track');
            }}
            isAuthenticated={isShopperSignedIn}
            onOpenAuth={openShopperAuth}
            onSignOut={() => {
              setIsShopperSignedIn(false);
              setActivePortal('store');
              setStoreSubView('shop');
            }}
          />
        )}

        {activePortal === 'creator' &&
          (isCreatorAuthenticated ? (
            <CreatorPortal
              profile={creatorProfile}
              products={products}
              onUpdateProfile={(next) => {
                const cappedTier = Math.min(99, Math.max(1, next.payoutTierPct));
                const updatedProfile = { ...next, payoutTierPct: cappedTier };
                setCreatorProfile(updatedProfile);
                setAdminAffiliates((prev) =>
                  prev.map((aff) =>
                    aff.creatorPartnerId === updatedProfile.creatorPartnerId
                      ? {
                          ...aff,
                          name: updatedProfile.fullName,
                          handle: updatedProfile.instagramHandle,
                          tiktokHandle: updatedProfile.tiktokHandle,
                          deliveryAddress: updatedProfile.deliveryAddress,
                          payableCommissionNpr: updatedProfile.balanceNpr,
                        }
                      : aff
                  )
                );
              }}
              onPreviewStoreWithCode={(code) => {
                setActiveAffiliateCode(code);
                setActivePortal('store');
                setStoreSubView('shop');
              }}
            />
          ) : (
            <PrivatePortalGate
              key="gate-creator"
              mode="creator"
              affiliates={adminAffiliates}
              onAuthenticatedCreator={hydrateCreatorFromAccount}
              onAuthenticatedAdmin={() => {}}
              onReturnToStore={() => {
                setActivePortal('store');
                setStoreSubView('shop');
              }}
            />
          ))}

        {activePortal === 'admin' &&
          (isAdminAuthenticated ? (
            <AdminPortal
              orders={orders}
              products={products}
              creatorProfile={creatorProfile}
              affiliates={adminAffiliates}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onApproveAffiliate={handleApproveAffiliate}
              onToggleAffiliateStatus={handleToggleAffiliateStatus}
              onChangeAffiliateTier={handleChangeAffiliateTier}
              onSettleAffiliatePayout={handleSettleAffiliatePayout}
              onRestockProduct={handleRestockProduct}
              onUpdateProductCommission={handleUpdateProductCommission}
              onAddProduct={handleAddProduct}
              onUpdateProductPricing={handleUpdateProductPricing}
              onAddAffiliate={handleAddAffiliate}
            />
          ) : (
            <PrivatePortalGate
              key="gate-admin"
              mode="admin"
              affiliates={adminAffiliates}
              onAuthenticatedCreator={() => {}}
              onAuthenticatedAdmin={() => {
                setIsAdminAuthenticated(true);
                setActivePortal('admin');
              }}
              onReturnToStore={() => {
                setActivePortal('store');
                setStoreSubView('shop');
              }}
            />
          ))}
      </main>

      {/* Public Storefront Footer — ZERO Creator or Admin login buttons */}
      <footer className="border-t border-[#12141C]/10 bg-white/60 py-6 px-4 sm:px-6 lg:px-8 mb-14 md:mb-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#12141C]/60">
          <p
            onDoubleClick={() => setStealthLauncherOpen(true)}
            className="select-none"
          >
            Skin AID by CareNest · Managed by CareNest · 3P Mfg: Phytomax Care Pvt. Ltd., Chitwan
          </p>
          <div className="flex flex-wrap items-center gap-5">
            <button
              type="button"
              onClick={() => {
                setActivePortal('store');
                setStoreSubView('track');
              }}
              className="hover:text-[#153B24] cursor-pointer"
            >
              Track Order
            </button>
            <button
              type="button"
              onClick={() => {
                setActivePortal('store');
                setStoreSubView('scan');
              }}
              className="hover:text-[#153B24] cursor-pointer"
            >
              Batch COA Scanner
            </button>
            <button
              type="button"
              onClick={() => setActivePortal('shopper')}
              className="hover:text-[#153B24] cursor-pointer"
            >
              My Account
            </button>
            {!isShopperSignedIn && (
              <>
                <button
                  type="button"
                  onClick={() => openShopperAuth('signin')}
                  className="hover:text-[#153B24] cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => openShopperAuth('signup')}
                  className="hover:text-[#153B24] font-medium text-[#153B24] cursor-pointer"
                >
                  Create Account
                </button>
              </>
            )}
          </div>
        </div>
      </footer>

      <ShopperAuthModal
        isOpen={shopperAuthModalOpen}
        initialMode={shopperAuthMode}
        affiliates={adminAffiliates}
        onClose={() => setShopperAuthModalOpen(false)}
        onAuthenticated={(profile) => {
          setShopperProfile(profile);
          setIsShopperSignedIn(true);
        }}
        onAuthenticatedCreator={hydrateCreatorFromAccount}
        onAuthenticatedAdmin={() => {
          setIsAdminAuthenticated(true);
          setActivePortal('admin');
        }}
      />

      {stealthLauncherOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="stealth-portal-title"
          className="fixed inset-0 z-50 bg-[#12141C]/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white border border-[#12141C]/15 p-6 space-y-4 shadow-xl">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-[#153B24]">
                Restricted Internal Access
              </p>
              <h2
                id="stealth-portal-title"
                className="font-display text-xl font-semibold text-[#12141C] mt-0.5"
              >
                Select Private Portal
              </h2>
            </div>
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  setStealthLauncherOpen(false);
                  setActivePortal('creator');
                }}
                className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#153B24] text-white text-xs font-semibold cursor-pointer"
              >
                Creator Partner Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setStealthLauncherOpen(false);
                  setActivePortal('admin');
                }}
                className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#12141C] text-white text-xs font-semibold cursor-pointer"
              >
                CareNest Admin Sign In
              </button>
              <button
                type="button"
                onClick={() => setStealthLauncherOpen(false)}
                className="w-full min-h-[38px] text-xs text-[#12141C]/60 hover:text-[#12141C] cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <CartDrawer
        isOpen={isBagOpen}
        items={cart}
        promoApplied={promoApplied}
        activeAffiliateCode={activeAffiliateCode}
        onClose={() => setIsBagOpen(false)}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveItem}
        onCheckout={() => {
          setIsBagOpen(false);
          setActivePortal('store');
          setStoreSubView('checkout');
        }}
      />

      <GeminiStudioDrawer activePortal={activePortal} />
    </div>
  );
}
