import { useState, FormEvent } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Download,
  FlaskConical,
  Sprout,
  Users,
  LayoutGrid,
  PackageCheck,
  Boxes,
  Search,
  ChevronRight,
  Plus,
  UserPlus,
  Copy,
  Check,
  KeyRound,
  RefreshCw,
  Pencil,
  Save,
  X,
  PackagePlus,
} from 'lucide-react';
import {
  BATCH_PASSPORTS,
  BOTANICAL_SUPPLIERS,
  CARENEST_IMAGES,
} from '../data/carenestData';
import {
  AdminAffiliateAccount,
  CreatorProfile,
  Order,
  OrderStatus,
  Product,
  ProductCategory,
} from '../types';
import { ResilientImage } from './ResilientImage';
import { BatchQrCode } from './BatchQrCode';

interface AdminPortalProps {
  orders: Order[];
  products: Product[];
  creatorProfile: CreatorProfile;
  affiliates: AdminAffiliateAccount[];
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onApproveAffiliate: (affiliateId: string) => void;
  onToggleAffiliateStatus: (affiliateId: string) => void;
  onChangeAffiliateTier: (affiliateId: string, tierPct: number) => void;
  onSettleAffiliatePayout: (affiliateId: string) => void;
  onRestockProduct: (productId: string, deltaUnits: number) => void;
  onUpdateProductCommission: (productId: string, pct: number) => void;
  onAddProduct: (
    payload: Omit<Product, 'id' | 'rating' | 'reviewCount'> & { id?: string }
  ) => void;
  onUpdateProductPricing: (
    productId: string,
    pricing: {
      priceNpr: number;
      compareAtNpr: number;
      manufacturerCostNpr: number;
      affiliateCommissionPct?: number;
      stockUnits?: number;
    }
  ) => void;
  onAddAffiliate: (payload: {
    creatorPartnerId: string;
    name: string;
    email: string;
    phone: string;
    handle: string;
    referralCode: string;
    passcode: string;
    tierPct: number;
    payoutChannel: 'eSewa' | 'Khalti';
  }) => void;
}

type AdminSection = 'overview' | 'orders' | 'affiliates' | 'inventory' | 'lab';

const ADMIN_NAV: Array<{
  id: AdminSection;
  label: string;
  icon: typeof LayoutGrid;
}> = [
  { id: 'overview', label: 'Executive Overview', icon: LayoutGrid },
  { id: 'orders', label: 'Orders & Fulfillment', icon: PackageCheck },
  { id: 'affiliates', label: 'Creator Affiliates', icon: Users },
  { id: 'inventory', label: 'Inventory & Pricing', icon: Boxes },
  { id: 'lab', label: 'Lab Quality & HPLC', icon: FlaskConical },
];

const PACKSHOT_PRESETS: Array<{ label: string; url: string }> = [
  { label: 'Herbo-Mineral Sunscreen Tube', url: CARENEST_IMAGES.sunscreen },
  { label: 'Herbal Foaming Face Wash', url: CARENEST_IMAGES.faceWash },
  { label: 'Repairing Facial Toner', url: CARENEST_IMAGES.toner },
  { label: 'Deep Cleansing Milk', url: CARENEST_IMAGES.cleansingMilk },
  { label: 'Pure Aloe Soothing Gel', url: CARENEST_IMAGES.aloeGel },
  { label: 'Goat Milk Saffron Soap', url: CARENEST_IMAGES.goatMilkSoap },
  { label: 'Ayurvedic Hair Shampoo', url: CARENEST_IMAGES.hairShampoo },
  { label: 'Botanical Night Cream', url: CARENEST_IMAGES.nightCream },
  { label: 'Himalayan Rose Water Mist', url: CARENEST_IMAGES.roseWater },
  { label: 'Hydra Facial Kit', url: CARENEST_IMAGES.hydraFacial },
];

export function AdminPortal({
  orders,
  products,
  creatorProfile,
  affiliates,
  onUpdateOrderStatus,
  onApproveAffiliate,
  onToggleAffiliateStatus,
  onChangeAffiliateTier,
  onSettleAffiliatePayout,
  onRestockProduct,
  onUpdateProductCommission,
  onAddProduct,
  onUpdateProductPricing,
  onAddAffiliate,
}: AdminPortalProps) {
  const [section, setSection] = useState<AdminSection>('overview');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<
    'All' | OrderStatus
  >('All');

  const [affiliateSearch, setAffiliateSearch] = useState('');
  const [affiliateActionNote, setAffiliateActionNote] = useState<string | null>(
    null
  );
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [newPartnerId, setNewPartnerId] = useState(
    () => `CN-CR-${Math.floor(1005 + Math.random() * 8900)}`
  );
  const [newCreatorName, setNewCreatorName] = useState('');
  const [newCreatorEmail, setNewCreatorEmail] = useState('');
  const [newCreatorPhone, setNewCreatorPhone] = useState('+977 98');
  const [newCreatorHandle, setNewCreatorHandle] = useState('');
  const [newCreatorCode, setNewCreatorCode] = useState('');
  const [newCreatorPasscode, setNewCreatorPasscode] = useState(
    () => `Care#${Math.floor(1000 + Math.random() * 8999)}`
  );
  const [newCreatorTier, setNewCreatorTier] = useState(5);
  const [newCreatorWallet, setNewCreatorWallet] = useState<'eSewa' | 'Khalti'>(
    'eSewa'
  );
  const [issuedPartnerCard, setIssuedPartnerCard] = useState<{
    creatorPartnerId: string;
    name: string;
    referralCode: string;
    passcode: string;
    tierPct: number;
  } | null>(null);
  const [copiedCredId, setCopiedCredId] = useState<string | null>(null);

  const [selectedBatchCode, setSelectedBatchCode] =
    useState<string>('SA-26-501');
  const [expandedSupplierId, setExpandedSupplierId] = useState<string | null>(
    'sup-chitwan-phyto'
  );
  const [activePeakIdx, setActivePeakIdx] = useState<number>(0);
  const [exportNote, setExportNote] = useState<string | null>(null);

  // Add Product & Inline Pricing state
  const [showAddProductForm, setShowAddProductForm] = useState(false);
  const [productActionNote, setProductActionNote] = useState<string | null>(
    null
  );
  const [newProdName, setNewProdName] = useState('');
  const [newProdShortName, setNewProdShortName] = useState('');
  const [newProdCategory, setNewProdCategory] =
    useState<Exclude<ProductCategory, 'All Formulations'>>('Skin Care');
  const [newProdVolume, setNewProdVolume] = useState('50 gm');
  const [newProdBatchCode, setNewProdBatchCode] = useState('SA-26-511');
  const [newProdFormulation, setNewProdFormulation] = useState(
    'Herbo-Botanical Complex'
  );
  const [newProdMetricStat, setNewProdMetricStat] = useState('10% ACT');
  const [newProdMetricLabel, setNewProdMetricLabel] = useState(
    'Chitwan GMP Standardized'
  );
  const [newProdMfgCost, setNewProdMfgCost] = useState('680');
  const [newProdPrice, setNewProdPrice] = useState('1390');
  const [newProdCompareAt, setNewProdCompareAt] = useState('1590');
  const [newProdCommPct, setNewProdCommPct] = useState<number>(5);
  const [newProdStock, setNewProdStock] = useState('250');
  const [newProdImagePreset, setNewProdImagePreset] = useState<string>(
    CARENEST_IMAGES.nightCream
  );
  const [newProdCustomImage, setNewProdCustomImage] = useState('');
  const [newProdIngredients, setNewProdIngredients] = useState(
    'Himalayan Sea Buckthorn, Niacinamide 5%, Licorice Root, Centella Asiatica'
  );
  const [newProdDescription, setNewProdDescription] = useState('');
  const [newProdFeatured, setNewProdFeatured] = useState(true);

  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editMfgCost, setEditMfgCost] = useState('');
  const [editPriceNpr, setEditPriceNpr] = useState('');
  const [editCompareAtNpr, setEditCompareAtNpr] = useState('');
  const [editCommPct, setEditCommPct] = useState<number>(5);
  const [editStockUnits, setEditStockUnits] = useState('');

  const parsedNewMfg = Math.max(0, Number(newProdMfgCost) || 0);
  const parsedNewPrice = Math.max(1, Number(newProdPrice) || 0);
  const parsedNewCompare = Math.max(parsedNewPrice, Number(newProdCompareAt) || 0);
  const parsedNewComm = Math.round(
    parsedNewPrice * (Math.min(99, Math.max(0, newProdCommPct)) / 100)
  );
  const parsedNewNetProfit = Math.max(0, parsedNewPrice - parsedNewMfg - parsedNewComm);
  const parsedNewMarginPct =
    parsedNewPrice > 0 ? Math.round((parsedNewNetProfit / parsedNewPrice) * 100) : 0;

  const notifyProductAction = (msg: string) => {
    setProductActionNote(msg);
    setTimeout(() => setProductActionNote(null), 5000);
  };

  const handleCreateProductSubmit = (e: FormEvent) => {
    e.preventDefault();
    const cleanName = newProdName.trim();
    if (!cleanName || parsedNewPrice <= 0) return;

    const shortName =
      newProdShortName.trim() ||
      cleanName.replace(/^SkinAid\s+/i, '').trim() ||
      cleanName;
    const resolvedImage =
      newProdImagePreset === 'custom'
        ? newProdCustomImage.trim() || CARENEST_IMAGES.sunscreen
        : newProdImagePreset;
    const ingredientsList = newProdIngredients
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    onAddProduct({
      name: cleanName.toLowerCase().startsWith('skinaid')
        ? cleanName
        : `SkinAid ${cleanName}`,
      shortName,
      brandLine: `SkinAid · ${newProdCategory}`,
      category: newProdCategory,
      priceNpr: parsedNewPrice,
      compareAtNpr: parsedNewCompare,
      manufacturerCostNpr: parsedNewMfg,
      volume: newProdVolume.trim() || '50 gm',
      image: resolvedImage,
      batchCode: newProdBatchCode.trim().toUpperCase() || 'SA-26-511',
      originRegion: 'Phytomax Care · Chitwan',
      keyMetricStat: newProdMetricStat.trim() || 'GMP Batch',
      keyMetricLabel: newProdMetricLabel.trim() || 'Botanical Active Standard',
      formulationType: newProdFormulation.trim() || 'Botanical Formulation',
      description:
        newProdDescription.trim() ||
        `Contract-manufactured for CareNest by Phytomax Care Pvt. Ltd. (Bharatpur-16, Chitwan). Formulated for Nepali climate barrier support.`,
      ingredients:
        ingredientsList.length > 0
          ? ingredientsList
          : ['Phytomax Standardized Botanical Actives', 'Niacinamide & Herbal Base'],
      affiliateCommissionPct: Math.min(
        99,
        Math.max(0, Math.round(newProdCommPct * 10) / 10)
      ),
      stockUnits: Math.max(0, Number(newProdStock) || 0),
      featured: newProdFeatured,
    });

    notifyProductAction(
      `Added "${shortName}" at NPR ${parsedNewPrice.toLocaleString()} (3P Cost NPR ${parsedNewMfg.toLocaleString()}, ${Math.min(99, Math.max(0, newProdCommPct))}% Comm., ${Math.max(0, Number(newProdStock) || 0)} units) — now live on Skin AID Storefront.`
    );
    setNewProdName('');
    setNewProdShortName('');
    setNewProdDescription('');
    setNewProdBatchCode(`SA-26-${Math.floor(512 + Math.random() * 80)}`);
    setShowAddProductForm(false);
  };

  const beginEditPricing = (p: Product) => {
    setEditingProductId(p.id);
    setEditMfgCost(
      String(p.manufacturerCostNpr ?? Math.round(p.priceNpr * 0.44))
    );
    setEditPriceNpr(String(p.priceNpr));
    setEditCompareAtNpr(String(p.compareAtNpr));
    setEditCommPct(Math.min(99, Math.max(0, p.affiliateCommissionPct)));
    setEditStockUnits(String(p.stockUnits));
  };

  const saveEditPricing = (p: Product) => {
    const nextPrice = Math.max(1, Math.round(Number(editPriceNpr) || p.priceNpr));
    const nextCompare = Math.max(
      nextPrice,
      Math.round(Number(editCompareAtNpr) || nextPrice)
    );
    const nextMfg = Math.max(
      0,
      Math.round(
        Number(editMfgCost) ||
          p.manufacturerCostNpr ||
          Math.round(nextPrice * 0.44)
      )
    );
    const nextComm = Math.min(
      99,
      Math.max(0, Math.round(editCommPct * 10) / 10)
    );
    const parsedStock = Number(editStockUnits);
    const nextStock = Number.isFinite(parsedStock)
      ? Math.max(0, Math.round(parsedStock))
      : p.stockUnits;

    onUpdateProductPricing(p.id, {
      priceNpr: nextPrice,
      compareAtNpr: nextCompare,
      manufacturerCostNpr: nextMfg,
      affiliateCommissionPct: nextComm,
      stockUnits: nextStock,
    });
    setEditingProductId(null);
    notifyProductAction(
      `Updated "${p.shortName}": Retail NPR ${nextPrice.toLocaleString()} · 3P Cost NPR ${nextMfg.toLocaleString()} · ${nextComm}% Comm. · ${nextStock} stock units.`
    );
  };

  const activeCoa =
    BATCH_PASSPORTS[selectedBatchCode] || BATCH_PASSPORTS['SA-26-501'];

  const totalRevenueNpr =
    1850000 +
    orders.reduce(
      (acc, o) => acc + (o.id.startsWith('CN-41') ? 0 : o.totalNpr),
      0
    );

  const affiliateAttributedOrders = orders.filter((o) =>
    Boolean(o.affiliateCodeUsed)
  );
  const totalPayableCommissionsNpr = affiliates.reduce(
    (sum, a) => sum + a.payableCommissionNpr,
    0
  );
  const lowStockCount = products.filter((p) => p.stockUnits < 150).length;

  const filteredOrders = orders.filter((o) => {
    const matchesStatus =
      orderStatusFilter === 'All' || o.status === orderStatusFilter;
    const q = orderSearch.trim().toLowerCase();
    const matchesQuery =
      !q ||
      o.id.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.city.toLowerCase().includes(q) ||
      (o.affiliateCodeUsed || '').toLowerCase().includes(q);
    return matchesStatus && matchesQuery;
  });

  const filteredAffiliates = affiliates.filter((a) => {
    const q = affiliateSearch.trim().toLowerCase();
    return (
      !q ||
      a.creatorPartnerId.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q) ||
      a.handle.toLowerCase().includes(q) ||
      a.referralCode.toLowerCase().includes(q)
    );
  });

  const handleSettlePayout = (aff: AdminAffiliateAccount) => {
    if (aff.payableCommissionNpr <= 0) return;
    onSettleAffiliatePayout(aff.id);
    setAffiliateActionNote(
      `Disbursed NPR ${aff.payableCommissionNpr.toLocaleString()} via ${aff.payoutChannel} to ${aff.name} (${aff.creatorPartnerId}).`
    );
    setTimeout(() => setAffiliateActionNote(null), 3200);
  };

  const handleCopyPartnerCredentials = async (payload: {
    creatorPartnerId: string;
    referralCode: string;
    passcode?: string;
  }) => {
    const originBase =
      typeof window !== 'undefined'
        ? window.location.origin
        : 'https://carenest.com.np';
    const text = `Skin AID by CareNest Creator Partner Access\nPartner ID: ${payload.creatorPartnerId}\nPasscode: ${payload.passcode || 'Issued at onboarding'}\nReferral Code: ${payload.referralCode}\nPrivate Login: ${originBase}/?portal=creator`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard fallback
    }
    setCopiedCredId(payload.creatorPartnerId);
    setTimeout(() => setCopiedCredId(null), 2200);
  };

  const handleInviteSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newCreatorName.trim() || !newCreatorCode.trim() || !newPartnerId.trim() || newCreatorPasscode.trim().length < 6) return;
    const cleanPartnerId = newPartnerId.trim().toUpperCase();
    const cleanCode = newCreatorCode
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');
    const cleanPasscode = newCreatorPasscode.trim();
    const cleanHandle = newCreatorHandle.trim() || `@${cleanCode.toLowerCase()}`;

    onAddAffiliate({
      creatorPartnerId: cleanPartnerId,
      name: newCreatorName.trim(),
      email: newCreatorEmail.trim().toLowerCase(),
      phone: newCreatorPhone.trim(),
      handle: cleanHandle,
      referralCode: cleanCode,
      passcode: cleanPasscode,
      tierPct: newCreatorTier,
      payoutChannel: newCreatorWallet,
    });

    // Persist to Express backend auth store so Creator Login Gate accepts immediately
    try {
      await fetch('/api/admin/creators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorPartnerId: cleanPartnerId,
          name: newCreatorName.trim(),
          email: newCreatorEmail.trim().toLowerCase(),
          phone: newCreatorPhone.trim(),
          handle: cleanHandle,
          referralCode: cleanCode,
          passcode: cleanPasscode,
          tierPct: newCreatorTier,
          payoutChannel: newCreatorWallet,
        }),
      });
    } catch {
      // Fallback already synced in client state
    }

    setIssuedPartnerCard({
      creatorPartnerId: cleanPartnerId,
      name: newCreatorName.trim(),
      referralCode: cleanCode,
      passcode: cleanPasscode,
      tierPct: newCreatorTier,
    });
    setAffiliateActionNote(
      `Issued Creator Partner ID ${cleanPartnerId} for ${newCreatorName.trim()} (${newCreatorTier}% max-capped tier).`
    );
    setNewPartnerId(`CN-CR-${Math.floor(1005 + Math.random() * 8900)}`);
    setNewCreatorName('');
    setNewCreatorEmail('');
    setNewCreatorPhone('+977 98');
    setNewCreatorHandle('');
    setNewCreatorCode('');
    setNewCreatorPasscode(`Care#${Math.floor(1000 + Math.random() * 8999)}`);
    setShowInviteForm(false);
    setTimeout(() => setAffiliateActionNote(null), 4000);
  };

  const downloadCsv = (filename: string, csvContent: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportOrdersCsv = () => {
    const rows = [
      ['OrderID', 'Date', 'Customer', 'City', 'Channel', 'Payment', 'AffiliateCode', 'TotalNPR', 'Status'].join(','),
      ...filteredOrders.map((o) =>
        [
          o.id,
          `"${o.date}"`,
          `"${o.customerName}"`,
          `"${o.city}"`,
          `"${o.courierChannel}"`,
          o.paymentMethod,
          o.affiliateCodeUsed || 'Direct',
          o.totalNpr,
          `"${o.status}"`,
        ].join(',')
      ),
    ];
    downloadCsv('carenest-skinaid-orders.csv', rows.join('\n'));
  };

  const handleExportAffiliatesCsv = () => {
    const rows = [
      ['Creator', 'Handle', 'Code', 'TierPct', 'Orders', 'GrossSalesNPR', 'PayableNPR', 'Wallet', 'Status'].join(','),
      ...filteredAffiliates.map((a) =>
        [
          `"${a.name}"`,
          `"${a.handle}"`,
          a.referralCode,
          a.tierPct,
          a.orders,
          a.grossSalesNpr,
          a.payableCommissionNpr,
          a.payoutChannel,
          `"${a.status}"`,
        ].join(',')
      ),
    ];
    downloadCsv('carenest-creator-affiliates.csv', rows.join('\n'));
  };

  const handleExportLabCoa = () => {
    const content = [
      `CARENEST x PHYTOMAX CARE LAB COA — ${activeCoa.coaNumber}`,
      `Batch Code: ${activeCoa.batchCode}`,
      `Product: ${activeCoa.productName}`,
      `Facility: ${activeCoa.origin}`,
      `Active Assay: ${activeCoa.activeAssay}`,
      `pH Profile: ${activeCoa.phBalance}`,
      `Heavy Metals: ${activeCoa.heavyMetals}`,
      `Microbial Count: ${activeCoa.microbialCount}`,
      `Status: ${activeCoa.labStatus} (Valid until ${activeCoa.validUntil})`,
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeCoa.coaNumber}-${activeCoa.batchCode}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setExportNote(`Exported ${activeCoa.coaNumber} SkinAid assay sheet.`);
    setTimeout(() => setExportNote(null), 2600);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F7F6F2] flex flex-col lg:flex-row">
      {/* Dark Enterprise Admin Sidebar */}
      <aside className="lg:w-64 shrink-0 bg-[#12141C] text-white flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/10">
        <div className="p-4 sm:p-5 space-y-5">
          <div className="rounded-xl bg-white/5 border border-white/10 p-3.5 space-y-1">
            <p className="text-[11px] font-medium text-emerald-300">
              CareNest Platform Operations
            </p>
            <p className="font-semibold text-sm text-white">
              Skin AID Admin Console
            </p>
            <p className="text-[11px] text-white/60">
              3P Mfg: Phytomax Care Pvt. Ltd. · Chitwan
            </p>
          </div>

          <nav
            aria-label="Admin operations modules"
            className="flex lg:flex-col gap-1.5 overflow-x-auto no-scrollbar pb-1 lg:pb-0"
          >
            {ADMIN_NAV.map((item) => {
              const Icon = item.icon;
              const isActive = section === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSection(item.id)}
                  className={`min-h-[42px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium inline-flex items-center gap-2.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-[#9E1B24] text-white'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="hidden lg:block p-5 border-t border-white/10 text-xs text-white/65 space-y-1.5">
          <p className="font-semibold text-white">Lead Creator Sync</p>
          <p className="font-mono text-emerald-300">
            {creatorProfile.referralCode} · {creatorProfile.orders} orders
          </p>
          <p>
            Payable Queue: NPR {totalPayableCommissionsNpr.toLocaleString()}
          </p>
        </div>
      </aside>

      {/* Main Enterprise Canvas */}
      <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 pb-20 lg:pb-10 space-y-6">
        {/* Top Breadcrumb Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#12141C]/10 pb-4">
          <div>
            <p className="text-xs text-[#12141C]/55">
              Admin Operations /{' '}
              <span className="font-medium text-[#12141C]">
                {ADMIN_NAV.find((n) => n.id === section)?.label}
              </span>
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#12141C] mt-0.5">
              {ADMIN_NAV.find((n) => n.id === section)?.label}
            </h1>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono tabular-nums text-[#12141C]/70">
            <span>{orders.length} Orders</span>
            <span aria-hidden="true">·</span>
            <span>{affiliates.length} Creators</span>
            <span aria-hidden="true">·</span>
            <span>{products.length} Active SKUs</span>
          </div>
        </div>

        {/* 1. EXECUTIVE OVERVIEW */}
        {section === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="rounded-xl bg-[#153B24] text-white p-5">
                <p className="text-xs text-white/75">Monthly SkinAid Revenue</p>
                <p className="font-mono text-2xl font-semibold tabular-nums mt-2">
                  NPR {(totalRevenueNpr / 1000000).toFixed(2)}M
                </p>
                <p className="text-xs text-emerald-300 mt-1.5">
                  +21.6% vs last month
                </p>
              </div>

              <div className="rounded-xl bg-white border border-[#12141C]/10 p-5">
                <p className="text-xs text-[#12141C]/60">
                  Live Orders in Fulfillment
                </p>
                <p className="font-mono text-2xl font-semibold text-[#12141C] tabular-nums mt-2">
                  {orders.length} Orders
                </p>
                <p className="text-xs text-[#12141C]/65 mt-1.5">
                  {orders.filter((o) => o.status !== 'Delivered').length} in lab
                  or transit
                </p>
              </div>

              <div className="rounded-xl bg-white border border-[#12141C]/10 p-5">
                <p className="text-xs text-[#12141C]/60">
                  Affiliate-Attributed Orders
                </p>
                <p className="font-mono text-2xl font-semibold text-[#12141C] tabular-nums mt-2">
                  {affiliateAttributedOrders.length} / {orders.length}
                </p>
                <p className="text-xs text-[#153B24] mt-1.5 font-medium">
                  NPR {totalPayableCommissionsNpr.toLocaleString()} payable
                </p>
              </div>

              <div className="rounded-xl bg-white border border-[#12141C]/10 p-5">
                <p className="text-xs text-[#12141C]/60">
                  SkinAid Stock Alerts
                </p>
                <p className="font-mono text-2xl font-semibold text-[#12141C] tabular-nums mt-2">
                  {lowStockCount} Low SKU
                </p>
                <p className="text-xs text-[#12141C]/65 mt-1.5">
                  Chitwan Phyto Lab inventory
                </p>
              </div>
            </div>

            {/* Quick Operational Routing */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => setSection('orders')}
                className="text-left rounded-xl bg-white border border-[#12141C]/10 hover:border-[#12141C] p-5 transition-colors cursor-pointer flex items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <PackageCheck className="w-5 h-5 text-[#153B24] mb-1.5" />
                  <p className="font-semibold text-sm text-[#12141C]">
                    Orders &amp; Fulfillment
                  </p>
                  <p className="text-xs text-[#12141C]/60">
                    Advance lab packing, dispatch &amp; settle commissions
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#12141C]/40 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => setSection('affiliates')}
                className="text-left rounded-xl bg-white border border-[#12141C]/10 hover:border-[#12141C] p-5 transition-colors cursor-pointer flex items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <Users className="w-5 h-5 text-[#9E1B24] mb-1.5" />
                  <p className="font-semibold text-sm text-[#12141C]">
                    Creator Affiliates
                  </p>
                  <p className="text-xs text-[#12141C]/60">
                    Approve creators, adjust tiers &amp; disburse payouts
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#12141C]/40 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => setSection('lab')}
                className="text-left rounded-xl bg-white border border-[#12141C]/10 hover:border-[#12141C] p-5 transition-colors cursor-pointer flex items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <FlaskConical className="w-5 h-5 text-[#153B24] mb-1.5" />
                  <p className="font-semibold text-sm text-[#12141C]">
                    Lab Quality &amp; HPLC COA
                  </p>
                  <p className="text-xs text-[#12141C]/60">
                    Inspect SkinAid SPF &amp; Niacinamide batch assays
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#12141C]/40 shrink-0" />
              </button>
            </div>

            {/* Live Affiliate Leaderboard Table */}
            <div className="rounded-xl bg-white border border-[#12141C]/10 overflow-hidden">
              <div className="p-5 border-b border-[#12141C]/10 flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold text-[#12141C]">
                  Top Creator Affiliate Performance
                </h2>
                <button
                  type="button"
                  onClick={() => setSection('affiliates')}
                  className="text-xs font-semibold text-[#153B24] hover:underline cursor-pointer"
                >
                  Manage all creators
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#12141C]/10 bg-[#FAF8F5] text-[11px] font-semibold text-[#12141C]/60 uppercase tracking-wider">
                      <th className="py-3 px-4">Creator</th>
                      <th className="py-3 px-4">Referral Code</th>
                      <th className="py-3 px-4 text-right">Tier</th>
                      <th className="py-3 px-4 text-right">Orders</th>
                      <th className="py-3 px-4 text-right">Gross Sales</th>
                      <th className="py-3 px-4 text-right">Payable</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#12141C]/8 text-xs sm:text-sm">
                    {affiliates.map((aff) => (
                      <tr key={aff.id} className="hover:bg-[#FAF8F5]/70">
                        <td className="py-3 px-4">
                          <p className="font-semibold text-[#12141C]">
                            {aff.name}
                          </p>
                          <p className="text-xs text-[#12141C]/55">
                            {aff.handle}
                          </p>
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-[#153B24]">
                          {aff.referralCode}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums">
                          {aff.tierPct}%
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums">
                          {aff.orders}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums">
                          NPR {aff.grossSalesNpr.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-[#9E1B24] tabular-nums">
                          NPR {aff.payableCommissionNpr.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 2. ORDERS & FULFILLMENT */}
        {section === 'orders' && (
          <div className="rounded-xl bg-white border border-[#12141C]/10 overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-[#12141C]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-[#12141C]/45 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Search #CN, customer, city, or code..."
                  className="w-full min-h-[40px] pl-9 pr-3 py-1.5 rounded-lg border border-[#12141C]/15 bg-[#FAF8F5] text-xs text-[#12141C] focus:outline-none focus:border-[#12141C]"
                />
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  ['All', 'Packing in Lab', 'Dispatched', 'Delivered'] as const
                ).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setOrderStatusFilter(st)}
                    className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                      orderStatusFilter === st
                        ? 'bg-[#12141C] text-white'
                        : 'bg-[#FAF8F5] text-[#12141C]/70 hover:text-[#12141C]'
                    }`}
                  >
                    {st}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleExportOrdersCsv}
                  className="min-h-[36px] px-3 py-1.5 rounded-lg border border-[#12141C]/15 hover:border-[#12141C] text-xs font-semibold text-[#12141C] inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </button>
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="p-10 text-center text-sm text-[#12141C]/60">
                No SkinAid orders match your search or status filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#12141C]/10 bg-[#FAF8F5] text-[11px] font-semibold text-[#12141C]/60 uppercase tracking-wider">
                      <th className="py-3 px-4">Order</th>
                      <th className="py-3 px-4">Customer &amp; Channel</th>
                      <th className="py-3 px-4">Items</th>
                      <th className="py-3 px-4">Affiliate</th>
                      <th className="py-3 px-4 text-right">Total</th>
                      <th className="py-3 px-4 text-right">Fulfillment Stage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#12141C]/8 text-xs sm:text-sm">
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-[#FAF8F5]/70">
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <p className="font-mono font-semibold text-[#12141C]">
                            #{order.id}
                          </p>
                          <p className="text-[11px] text-[#12141C]/55">
                            {order.date}
                          </p>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-[#12141C]">
                            {order.customerName} ({order.city})
                          </p>
                          <p className="text-xs text-[#12141C]/60">
                            {order.courierChannel} · {order.paymentMethod}{' '}
                            {order.paymentCollected ? '· Paid' : '· COD'}
                          </p>
                          {order.paymentTransactionId && (
                            <p className="font-mono text-[11px] text-[#153B24] mt-0.5">
                              TXN {order.paymentTransactionId}
                            </p>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-[#12141C]/80 max-w-xs">
                          {order.itemsSummary}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {order.affiliateCodeUsed ? (
                            <div>
                              <p className="font-mono text-xs font-semibold text-[#153B24]">
                                {order.affiliateCodeUsed}
                              </p>
                              <p className="font-mono text-[11px] text-[#12141C]/60 tabular-nums">
                                +NPR{' '}
                                {(
                                  order.affiliateCommissionNpr || 0
                                ).toLocaleString()}
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs text-[#12141C]/45">
                              Direct
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-semibold text-[#12141C] tabular-nums whitespace-nowrap">
                          NPR {order.totalNpr.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <select
                            aria-label={`Fulfillment stage for order ${order.id}`}
                            value={order.status}
                            onChange={(e) =>
                              onUpdateOrderStatus(
                                order.id,
                                e.target.value as OrderStatus
                              )
                            }
                            className={`min-h-[38px] px-2.5 py-1 rounded-lg border text-xs font-semibold cursor-pointer ${
                              order.status === 'Delivered'
                                ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                                : order.status === 'Dispatched'
                                ? 'border-amber-300 bg-amber-50 text-amber-800'
                                : 'border-[#12141C]/15 bg-[#FAF8F5] text-[#12141C]'
                            }`}
                          >
                            <option value="Packing in Lab">
                              Packing in Lab
                            </option>
                            <option value="Dispatched">Dispatched</option>
                            <option value="Delivered">Delivered</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 3. CREATOR AFFILIATES & ADMIN-ONLY PARTNER ID ISSUANCE */}
        {section === 'affiliates' && (
          <div className="space-y-4">
            {affiliateActionNote && (
              <p className="text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
                {affiliateActionNote}
              </p>
            )}

            {issuedPartnerCard && (
              <div className="rounded-xl bg-[#153B24] text-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-[11px] font-medium text-emerald-300 inline-flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>New CareNest Creator Partner ID Issued</span>
                  </p>
                  <p className="text-sm font-semibold">
                    {issuedPartnerCard.name} ·{' '}
                    <span className="font-mono text-amber-300">
                      {issuedPartnerCard.creatorPartnerId}
                    </span>{' '}
                    · Passcode:{' '}
                    <span className="font-mono text-white">
                      {issuedPartnerCard.passcode}
                    </span>
                  </p>
                  <p className="text-xs text-white/75 font-mono">
                    Referral Code: {issuedPartnerCard.referralCode} · Tier:{' '}
                    {issuedPartnerCard.tierPct}% (Admin Set) · Login: /?portal=creator
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopyPartnerCredentials(issuedPartnerCard)}
                    className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-white text-[#153B24] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedCredId === issuedPartnerCard.creatorPartnerId ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied Credentials</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Login Details</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIssuedPartnerCard(null)}
                    className="min-h-[38px] px-3 py-1.5 rounded-lg bg-white/15 text-white text-xs cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            <div className="rounded-xl bg-white border border-[#12141C]/10 overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-[#12141C]/10 flex flex-wrap items-center justify-between gap-4">
                <div className="relative flex-1 min-w-[220px] max-w-sm">
                  <Search className="w-4 h-4 text-[#12141C]/45 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="search"
                    value={affiliateSearch}
                    onChange={(e) => setAffiliateSearch(e.target.value)}
                    placeholder="Search Partner ID, creator, or code..."
                    className="w-full min-h-[40px] pl-9 pr-3 py-1.5 rounded-lg border border-[#12141C]/15 bg-[#FAF8F5] text-xs text-[#12141C] focus:outline-none focus:border-[#12141C]"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <p className="text-xs font-mono text-[#12141C]/65 tabular-nums">
                    Payable: NPR {totalPayableCommissionsNpr.toLocaleString()}
                  </p>
                  <button
                    type="button"
                    onClick={handleExportAffiliatesCsv}
                    className="min-h-[38px] px-3 py-1.5 rounded-lg border border-[#12141C]/15 hover:border-[#12141C] text-xs font-semibold text-[#12141C] inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowInviteForm((v) => !v)}
                    className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-[#12141C] hover:bg-[#9E1B24] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>
                      {showInviteForm ? 'Close' : 'Issue Creator Partner ID'}
                    </span>
                  </button>
                </div>
              </div>

              {showInviteForm && (
                <form
                  onSubmit={handleInviteSubmit}
                  className="p-4 sm:p-5 bg-[#FAF8F5] border-b border-[#12141C]/10 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-[#153B24]">
                      Admin-Only Provisioning · Create Official Creator Partner ID &amp; Credentials
                    </p>
                    <span className="text-[11px] text-[#12141C]/60">
                      Self-signup is disabled for creators; only CareNest Admin can mint Partner IDs.
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#12141C]/65 mb-1">
                        Creator Partner ID *
                      </label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          required
                          value={newPartnerId}
                          onChange={(e) => setNewPartnerId(e.target.value.toUpperCase())}
                          className="flex-1 min-h-[38px] px-3 py-1.5 rounded-lg border border-[#12141C]/15 bg-white font-mono text-xs uppercase font-semibold text-[#153B24]"
                        />
                        <button
                          type="button"
                          title="Generate new Partner ID"
                          onClick={() =>
                            setNewPartnerId(
                              `CN-CR-${Math.floor(1005 + Math.random() * 8900)}`
                            )
                          }
                          className="min-h-[38px] px-2.5 rounded-lg border border-[#12141C]/15 bg-white hover:border-[#153B24] cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-[#12141C]/70" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#12141C]/65 mb-1">
                        Creator Legal Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={newCreatorName}
                        onChange={(e) => setNewCreatorName(e.target.value)}
                        placeholder="Sajana Gurung"
                        className="w-full min-h-[38px] px-3 py-1.5 rounded-lg border border-[#12141C]/15 bg-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#12141C]/65 mb-1">
                        Creator Email
                      </label>
                      <input
                        type="email"
                        value={newCreatorEmail}
                        onChange={(e) => setNewCreatorEmail(e.target.value)}
                        placeholder="sajana@creator.np"
                        className="w-full min-h-[38px] px-3 py-1.5 rounded-lg border border-[#12141C]/15 bg-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#12141C]/65 mb-1">
                        Nepal Mobile
                      </label>
                      <input
                        type="tel"
                        value={newCreatorPhone}
                        onChange={(e) => setNewCreatorPhone(e.target.value)}
                        placeholder="+977 98..."
                        className="w-full min-h-[38px] px-3 py-1.5 rounded-lg border border-[#12141C]/15 bg-white font-mono text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#12141C]/65 mb-1">
                        Social Handle
                      </label>
                      <input
                        type="text"
                        value={newCreatorHandle}
                        onChange={(e) => setNewCreatorHandle(e.target.value)}
                        placeholder="@sajana.skin"
                        className="w-full min-h-[38px] px-3 py-1.5 rounded-lg border border-[#12141C]/15 bg-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#12141C]/65 mb-1">
                        Assigned Referral Code *
                      </label>
                      <input
                        type="text"
                        required
                        value={newCreatorCode}
                        onChange={(e) => setNewCreatorCode(e.target.value)}
                        placeholder="SAJANA5"
                        className="w-full min-h-[38px] px-3 py-1.5 rounded-lg border border-[#12141C]/15 bg-white font-mono text-xs uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#12141C]/65 mb-1">
                        Issued Passcode (Min 6 chars) *
                      </label>
                      <input
                        type="text"
                        required
                        minLength={6}
                        value={newCreatorPasscode}
                        onChange={(e) => setNewCreatorPasscode(e.target.value)}
                        className="w-full min-h-[38px] px-3 py-1.5 rounded-lg border border-[#12141C]/15 bg-white font-mono text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#12141C]/65 mb-1">
                          Commission % (1–99%)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min={1}
                            max={99}
                            step={0.5}
                            value={newCreatorTier}
                            onChange={(e) => {
                              const raw = Number(e.target.value);
                              setNewCreatorTier(
                                Number.isFinite(raw)
                                  ? Math.min(99, Math.max(1, raw))
                                  : 1
                              );
                            }}
                            className="w-full min-h-[38px] pl-2.5 pr-6 py-1.5 rounded-lg border border-[#12141C]/15 bg-white font-mono text-xs font-semibold text-[#153B24]"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 font-mono text-xs text-[#12141C]/60">
                            %
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-[#12141C]/65 mb-1">
                          Wallet
                        </label>
                        <select
                          value={newCreatorWallet}
                          onChange={(e) =>
                            setNewCreatorWallet(e.target.value as 'eSewa' | 'Khalti')
                          }
                          className="w-full min-h-[38px] px-2 py-1.5 rounded-lg border border-[#12141C]/15 bg-white text-xs"
                        >
                          <option value="eSewa">eSewa</option>
                          <option value="Khalti">Khalti</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="min-h-[40px] px-5 py-2 rounded-lg bg-[#153B24] hover:bg-[#102E1C] text-white text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Issue Creator Partner ID &amp; Activate</span>
                    </button>
                  </div>
                </form>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#12141C]/10 bg-[#FAF8F5] text-[11px] font-semibold text-[#12141C]/60 uppercase tracking-wider">
                      <th className="py-3 px-4">Partner ID</th>
                      <th className="py-3 px-4">Creator</th>
                      <th className="py-3 px-4">Code</th>
                      <th className="py-3 px-4">Tier</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Sales</th>
                      <th className="py-3 px-4 text-right">Payable</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#12141C]/8 text-xs sm:text-sm">
                    {filteredAffiliates.map((aff) => (
                      <tr key={aff.id} className="hover:bg-[#FAF8F5]/70">
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <p className="font-mono font-semibold text-xs text-[#153B24]">
                            {aff.creatorPartnerId}
                          </p>
                          <p className="text-[10px] text-[#12141C]/50">
                            {aff.createdAt || 'CareNest Admin'}
                          </p>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-[#12141C]">
                            {aff.name}
                          </p>
                          <p className="text-xs text-[#12141C]/55">
                            {aff.handle} · {aff.payoutChannel}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-[#153B24]">
                          {aff.referralCode}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <input
                              type="number"
                              min={1}
                              max={99}
                              step={0.5}
                              aria-label={`Commission tier for ${aff.name}`}
                              value={aff.tierPct}
                              onChange={(e) => {
                                const raw = Number(e.target.value);
                                const val = Number.isFinite(raw)
                                  ? Math.min(99, Math.max(1, raw))
                                  : 1;
                                onChangeAffiliateTier(aff.id, val);
                              }}
                              className="w-16 min-h-[34px] px-2 py-1 rounded-lg border border-[#12141C]/15 bg-[#FAF8F5] text-right font-mono text-xs font-semibold text-[#153B24]"
                            />
                            <span className="font-mono text-xs text-[#12141C]/65">
                              %
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`text-xs font-semibold ${
                              aff.status === 'Active'
                                ? 'text-emerald-700'
                                : aff.status === 'Suspended'
                                ? 'text-[#9E1B24]'
                                : 'text-amber-700'
                            }`}
                          >
                            {aff.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums whitespace-nowrap">
                          NPR {aff.grossSalesNpr.toLocaleString()}
                          <span className="block text-[10px] text-[#12141C]/55">
                            {aff.orders} orders
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-semibold text-[#9E1B24] tabular-nums whitespace-nowrap">
                          NPR {aff.payableCommissionNpr.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleCopyPartnerCredentials(aff)}
                              title="Copy Creator Partner ID & Private Login"
                              className="min-h-[34px] px-2.5 py-1 rounded-lg border border-[#12141C]/15 hover:border-[#153B24] text-xs font-medium text-[#12141C] inline-flex items-center gap-1 cursor-pointer"
                            >
                              {copiedCredId === aff.creatorPartnerId ? (
                                <Check className="w-3.5 h-3.5 text-emerald-700" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                              <span>ID</span>
                            </button>
                            {aff.status === 'Pending Review' ? (
                              <button
                                type="button"
                                onClick={() => onApproveAffiliate(aff.id)}
                                className="min-h-[34px] px-2.5 py-1 rounded-lg bg-[#153B24] hover:bg-[#102E1C] text-white text-xs font-semibold cursor-pointer"
                              >
                                Approve
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => onToggleAffiliateStatus(aff.id)}
                                  className="min-h-[34px] px-2.5 py-1 rounded-lg border border-[#12141C]/15 hover:border-[#9E1B24] text-xs font-medium text-[#12141C]/75 hover:text-[#9E1B24] cursor-pointer"
                                >
                                  {aff.status === 'Suspended' ? 'Activate' : 'Suspend'}
                                </button>
                                <button
                                  type="button"
                                  disabled={aff.payableCommissionNpr <= 0}
                                  onClick={() => handleSettlePayout(aff)}
                                  className="min-h-[34px] px-3 py-1 rounded-lg bg-[#9E1B24] hover:bg-[#82141C] disabled:opacity-40 text-white text-xs font-semibold cursor-pointer"
                                >
                                  {aff.payableCommissionNpr > 0
                                    ? `Pay`
                                    : 'Settled'}
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 4. INVENTORY & 3P MANUFACTURER UNIT ECONOMICS */}
        {section === 'inventory' && (
          <div className="space-y-6">
            {/* CareNest x Phytomax Care Pvt. Ltd. Unit Economics Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="rounded-xl bg-[#12141C] text-white p-4 space-y-1">
                <p className="text-[11px] text-emerald-300 font-medium">
                  3rd-Party Contract Manufacturer
                </p>
                <p className="font-display text-lg font-semibold">
                  Phytomax Care Pvt. Ltd.
                </p>
                <p className="text-[11px] text-white/65">
                  GMP Lab · Bharatpur-16, Chitwan
                </p>
              </div>
              <div className="rounded-xl bg-white border border-[#12141C]/10 p-4 space-y-1">
                <p className="text-[11px] text-[#12141C]/60">
                  Total CareNest Warehouse Stock
                </p>
                <p className="font-mono text-xl font-semibold text-[#12141C] tabular-nums">
                  {products
                    .reduce((sum, p) => sum + p.stockUnits, 0)
                    .toLocaleString()}{' '}
                  units
                </p>
                <p className="text-[11px] text-[#153B24] font-medium">
                  Across {products.length} Skin AID SKUs
                </p>
              </div>
              <div className="rounded-xl bg-white border border-[#12141C]/10 p-4 space-y-1">
                <p className="text-[11px] text-[#12141C]/60">
                  Admin Commission Range
                </p>
                <p className="font-mono text-xl font-semibold text-[#9E1B24] tabular-nums">
                  Up to 99% Max
                </p>
                <p className="text-[11px] text-[#12141C]/60">
                  Configurable per SKU &amp; creator
                </p>
              </div>
              <div className="rounded-xl bg-white border border-[#12141C]/10 p-4 space-y-1">
                <p className="text-[11px] text-[#12141C]/60">
                  Avg. Net CareNest Margin (After Aff.)
                </p>
                <p className="font-mono text-xl font-semibold text-emerald-700 tabular-nums">
                  {Math.round(
                    products.reduce((sum, p) => {
                      const mfg = p.manufacturerCostNpr ?? Math.round(p.priceNpr * 0.44);
                      const maxComm = Math.round(p.priceNpr * 0.9 * (p.affiliateCommissionPct / 100));
                      const net = p.priceNpr * 0.9 - mfg - maxComm;
                      return sum + (net / (p.priceNpr * 0.9)) * 100;
                    }, 0) / Math.max(1, products.length)
                  )}
                  %
                </p>
                <p className="text-[11px] text-[#12141C]/60">
                  Net of 10% referral benefit &amp; 3P COGS
                </p>
              </div>
            </div>

            {/* SkinAid Stock & 3P Margin Table + Add Product & Pricing Control */}
            {productActionNote && (
              <div className="rounded-xl bg-[#153B24] text-white px-4 py-3 text-xs font-medium flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                  <span>{productActionNote}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setProductActionNote(null)}
                  className="text-white/75 hover:text-white cursor-pointer"
                  aria-label="Dismiss product notification"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="rounded-xl bg-white border border-[#12141C]/10 overflow-hidden">
              <div className="p-5 border-b border-[#12141C]/10 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-semibold text-[#12141C]">
                    CareNest Stock, Product Catalog &amp; Pricing Control
                  </h2>
                  <p className="text-xs text-[#12141C]/60">
                    Add new Skin AID SKUs, adjust Phytomax Care 3P wholesale cost, edit Retail &amp; Compare-At MRP live, and customize affiliate commission (0%–99%).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddProductForm((v) => !v)}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-[#153B24] hover:bg-[#0F2C1B] text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer"
                >
                  {showAddProductForm ? (
                    <>
                      <X className="w-4 h-4" />
                      <span>Close Product Builder</span>
                    </>
                  ) : (
                    <>
                      <PackagePlus className="w-4 h-4" />
                      <span>+ Add New Skin AID Product</span>
                    </>
                  )}
                </button>
              </div>

              {showAddProductForm && (
                <form
                  onSubmit={handleCreateProductSubmit}
                  className="p-5 bg-[#FAF8F5] border-b border-[#12141C]/10 space-y-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="font-display text-base font-semibold text-[#12141C]">
                        Create New Skin AID SKU (Phytomax Care Mfg.)
                      </h3>
                      <p className="text-xs text-[#12141C]/60">
                        Published immediately to the CareNest Storefront, Cart, Shopper Portal, and Creator Affiliate Catalog.
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 font-mono text-[11px] font-semibold">
                      Affiliate Comm: {Math.min(99, Math.max(0, newProdCommPct))}%
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    <div className="lg:col-span-2 space-y-1">
                      <label className="block text-[11px] font-semibold text-[#12141C]/75">
                        Full Product Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={newProdName}
                        onChange={(e) => setNewProdName(e.target.value)}
                        placeholder="e.g., SkinAid Bakuchiol Radiance Night Serum"
                        className="w-full min-h-[40px] px-3 rounded-lg bg-white border border-[#12141C]/15 text-xs text-[#12141C] focus:outline-none focus:border-[#153B24]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-[#12141C]/75">
                        Short Catalog Title
                      </label>
                      <input
                        type="text"
                        value={newProdShortName}
                        onChange={(e) => setNewProdShortName(e.target.value)}
                        placeholder="Bakuchiol Night Serum"
                        className="w-full min-h-[40px] px-3 rounded-lg bg-white border border-[#12141C]/15 text-xs text-[#12141C] focus:outline-none focus:border-[#153B24]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-[#12141C]/75">
                        Category
                      </label>
                      <select
                        value={newProdCategory}
                        onChange={(e) =>
                          setNewProdCategory(
                            e.target.value as Exclude<
                              ProductCategory,
                              'All Formulations'
                            >
                          )
                        }
                        className="w-full min-h-[40px] px-3 rounded-lg bg-white border border-[#12141C]/15 text-xs text-[#12141C] focus:outline-none focus:border-[#153B24]"
                      >
                        <option value="Skin Care">Skin Care</option>
                        <option value="Sun Care">Sun Care</option>
                        <option value="Hair Care">Hair Care</option>
                        <option value="Bath & Spa">Bath &amp; Spa</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-[#12141C]/75">
                        Net Volume / Weight
                      </label>
                      <input
                        type="text"
                        value={newProdVolume}
                        onChange={(e) => setNewProdVolume(e.target.value)}
                        placeholder="50 gm / 100 ml"
                        className="w-full min-h-[40px] px-3 rounded-lg bg-white border border-[#12141C]/15 text-xs text-[#12141C] focus:outline-none focus:border-[#153B24]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-[#12141C]/75">
                        Phytomax Batch Code
                      </label>
                      <input
                        type="text"
                        value={newProdBatchCode}
                        onChange={(e) => setNewProdBatchCode(e.target.value)}
                        placeholder="SA-26-511"
                        className="w-full min-h-[40px] px-3 rounded-lg bg-white border border-[#12141C]/15 font-mono text-xs text-[#12141C] focus:outline-none focus:border-[#153B24]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-[#12141C]/75">
                        Formulation Type
                      </label>
                      <input
                        type="text"
                        value={newProdFormulation}
                        onChange={(e) => setNewProdFormulation(e.target.value)}
                        placeholder="Herbo-Ceramide Cream"
                        className="w-full min-h-[40px] px-3 rounded-lg bg-white border border-[#12141C]/15 text-xs text-[#12141C] focus:outline-none focus:border-[#153B24]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-[#12141C]/75">
                        Initial Warehouse Stock
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={newProdStock}
                        onChange={(e) => setNewProdStock(e.target.value)}
                        className="w-full min-h-[40px] px-3 rounded-lg bg-white border border-[#12141C]/15 font-mono text-xs text-[#12141C] focus:outline-none focus:border-[#153B24]"
                      />
                    </div>
                  </div>

                  {/* Pricing & Margin Economics Block */}
                  <div className="rounded-xl bg-white border border-[#12141C]/10 p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-[#12141C]">
                        Pricing &amp; CareNest Unit Economics (NPR)
                      </p>
                      <div className="flex flex-wrap items-center gap-4 text-xs">
                        <span className="text-[#12141C]/65">
                          Est. Creator Payout ({Math.min(99, Math.max(0, newProdCommPct))}%):{' '}
                          <strong className="font-mono text-[#9E1B24]">
                            NPR {parsedNewComm.toLocaleString()}
                          </strong>
                        </span>
                        <span className="text-[#12141C]/65">
                          CareNest Net Profit:{' '}
                          <strong className="font-mono text-emerald-700">
                            NPR {parsedNewNetProfit.toLocaleString()} ({parsedNewMarginPct}%)
                          </strong>
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                      <div className="space-y-1">
                        <label className="block text-[11px] font-semibold text-[#12141C]/75">
                          Phytomax 3P Cost (NPR) *
                        </label>
                        <input
                          type="number"
                          min={0}
                          required
                          value={newProdMfgCost}
                          onChange={(e) => setNewProdMfgCost(e.target.value)}
                          className="w-full min-h-[40px] px-3 rounded-lg bg-[#FAF8F5] border border-[#12141C]/15 font-mono text-xs font-semibold text-[#12141C] focus:outline-none focus:border-[#153B24]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[11px] font-semibold text-[#12141C]/75">
                          Retail Selling Price (NPR) *
                        </label>
                        <input
                          type="number"
                          min={1}
                          required
                          value={newProdPrice}
                          onChange={(e) => setNewProdPrice(e.target.value)}
                          className="w-full min-h-[40px] px-3 rounded-lg bg-[#FAF8F5] border border-[#153B24]/40 font-mono text-xs font-semibold text-[#153B24] focus:outline-none focus:border-[#153B24]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[11px] font-semibold text-[#12141C]/75">
                          Compare-At MRP (NPR)
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={newProdCompareAt}
                          onChange={(e) => setNewProdCompareAt(e.target.value)}
                          className="w-full min-h-[40px] px-3 rounded-lg bg-[#FAF8F5] border border-[#12141C]/15 font-mono text-xs text-[#12141C] focus:outline-none focus:border-[#153B24]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[11px] font-semibold text-[#12141C]/75">
                          Affiliate Comm. % (0–99%)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min={0}
                            max={99}
                            step={0.5}
                            value={newProdCommPct}
                            onChange={(e) => {
                              const raw = Number(e.target.value);
                              setNewProdCommPct(
                                Number.isFinite(raw)
                                  ? Math.min(99, Math.max(0, raw))
                                  : 0
                              );
                            }}
                            className="w-full min-h-[40px] pl-3 pr-8 rounded-lg bg-[#FAF8F5] border border-[#12141C]/15 font-mono text-xs font-semibold text-[#9E1B24] focus:outline-none focus:border-[#153B24]"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs font-semibold text-[#12141C]/60">
                            %
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Packshot Image, Botanical Actives & Description */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-[#12141C]/75">
                        Product Packshot Image
                      </label>
                      <div className="flex items-center gap-2.5">
                        <ResilientImage
                          src={
                            newProdImagePreset === 'custom'
                              ? newProdCustomImage || CARENEST_IMAGES.sunscreen
                              : newProdImagePreset
                          }
                          alt="Product preview"
                          fallbackTitle={newProdShortName || 'SkinAid'}
                          className="w-10 h-10 rounded-lg object-contain bg-white border border-[#12141C]/15 p-1 shrink-0"
                        />
                        <select
                          value={newProdImagePreset}
                          onChange={(e) => setNewProdImagePreset(e.target.value)}
                          className="w-full min-h-[40px] px-3 rounded-lg bg-white border border-[#12141C]/15 text-xs text-[#12141C] focus:outline-none focus:border-[#153B24]"
                        >
                          {PACKSHOT_PRESETS.map((preset) => (
                            <option key={preset.url} value={preset.url}>
                              {preset.label}
                            </option>
                          ))}
                          <option value="custom">Custom Image URL...</option>
                        </select>
                      </div>
                      {newProdImagePreset === 'custom' && (
                        <input
                          type="url"
                          value={newProdCustomImage}
                          onChange={(e) => setNewProdCustomImage(e.target.value)}
                          placeholder="https://... or /assets/skinaid/..."
                          className="mt-2 w-full min-h-[38px] px-3 rounded-lg bg-white border border-[#12141C]/15 text-xs text-[#12141C] focus:outline-none focus:border-[#153B24]"
                        />
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-[#12141C]/75">
                        Key Metric Badge &amp; Subtitle
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={newProdMetricStat}
                          onChange={(e) => setNewProdMetricStat(e.target.value)}
                          placeholder="e.g., 10% B3"
                          className="w-full min-h-[40px] px-3 rounded-lg bg-white border border-[#12141C]/15 font-mono text-xs text-[#12141C]"
                        />
                        <input
                          type="text"
                          value={newProdMetricLabel}
                          onChange={(e) => setNewProdMetricLabel(e.target.value)}
                          placeholder="Barrier Repair"
                          className="w-full min-h-[40px] px-3 rounded-lg bg-white border border-[#12141C]/15 text-xs text-[#12141C]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-[#12141C]/75">
                        Botanical Actives (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={newProdIngredients}
                        onChange={(e) => setNewProdIngredients(e.target.value)}
                        className="w-full min-h-[40px] px-3 rounded-lg bg-white border border-[#12141C]/15 text-xs text-[#12141C]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 items-end">
                    <div className="md:col-span-2 space-y-1">
                      <label className="block text-[11px] font-semibold text-[#12141C]/75">
                        Formulation Description
                      </label>
                      <input
                        type="text"
                        value={newProdDescription}
                        onChange={(e) => setNewProdDescription(e.target.value)}
                        placeholder="Describe clinical & herbal benefits for Nepali shoppers..."
                        className="w-full min-h-[40px] px-3 rounded-lg bg-white border border-[#12141C]/15 text-xs text-[#12141C]"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <label className="inline-flex items-center gap-2 text-xs font-medium text-[#12141C] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newProdFeatured}
                          onChange={(e) => setNewProdFeatured(e.target.checked)}
                          className="rounded border-[#12141C]/30 text-[#153B24]"
                        />
                        <span>Feature on Storefront</span>
                      </label>
                      <button
                        type="submit"
                        className="min-h-[40px] px-5 py-2 rounded-xl bg-[#9E1B24] hover:bg-[#82141C] text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Publish Product &amp; Pricing</span>
                      </button>
                    </div>
                  </div>
                </form>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#12141C]/10 bg-[#FAF8F5] text-[11px] font-semibold text-[#12141C]/60 uppercase tracking-wider">
                      <th className="py-3 px-4">Formulation</th>
                      <th className="py-3 px-4">Batch #</th>
                      <th className="py-3 px-4 text-right">3P Cost</th>
                      <th className="py-3 px-4 text-right">Retail / MRP</th>
                      <th className="py-3 px-4 text-right">Comm. Cap</th>
                      <th className="py-3 px-4 text-right">Net Margin</th>
                      <th className="py-3 px-4 text-right">Stock Units</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#12141C]/8 text-xs sm:text-sm">
                    {products.map((p) => {
                      const isEditing = editingProductId === p.id;
                      const mfgCost = isEditing
                        ? Math.max(0, Number(editMfgCost) || 0)
                        : p.manufacturerCostNpr ?? Math.round(p.priceNpr * 0.44);
                      const activePrice = isEditing
                        ? Math.max(1, Number(editPriceNpr) || p.priceNpr)
                        : p.priceNpr;
                      const activeCommPct = isEditing
                        ? Math.min(99, Math.max(0, editCommPct))
                        : Math.min(99, Math.max(0, p.affiliateCommissionPct));
                      const maxComm = Math.round(
                        activePrice * (activeCommPct / 100)
                      );
                      const netProfitNpr = Math.max(
                        0,
                        activePrice - mfgCost - maxComm
                      );

                      return (
                        <tr key={p.id} className="hover:bg-[#FAF8F5]/70">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <ResilientImage
                                src={p.image}
                                alt={p.name}
                                fallbackTitle={p.shortName}
                                className="w-9 h-9 rounded-lg object-contain bg-[#F3EFE9] p-1 shrink-0"
                              />
                              <div>
                                <p className="font-semibold text-[#12141C]">
                                  {p.shortName}
                                </p>
                                <p className="text-[11px] text-[#12141C]/55">
                                  {p.category} · {p.volume}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono text-xs text-[#12141C]/75">
                            {p.batchCode}
                          </td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums text-[#12141C]/70 whitespace-nowrap">
                            {isEditing ? (
                              <input
                                type="number"
                                min={0}
                                aria-label={`3P cost for ${p.shortName}`}
                                value={editMfgCost}
                                onChange={(e) => setEditMfgCost(e.target.value)}
                                className="w-24 min-h-[32px] px-2 rounded-lg border border-[#12141C]/20 bg-white text-right font-mono text-xs text-[#12141C]"
                              />
                            ) : (
                              `NPR ${mfgCost.toLocaleString()}`
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums whitespace-nowrap">
                            {isEditing ? (
                              <div className="inline-flex flex-col items-end gap-1">
                                <input
                                  type="number"
                                  min={1}
                                  aria-label={`Retail selling price for ${p.shortName}`}
                                  value={editPriceNpr}
                                  onChange={(e) => setEditPriceNpr(e.target.value)}
                                  className="w-24 min-h-[32px] px-2 rounded-lg border border-[#153B24] bg-white text-right font-mono text-xs font-semibold text-[#153B24]"
                                />
                                <input
                                  type="number"
                                  min={1}
                                  aria-label={`Compare-at MRP for ${p.shortName}`}
                                  value={editCompareAtNpr}
                                  onChange={(e) =>
                                    setEditCompareAtNpr(e.target.value)
                                  }
                                  placeholder="MRP"
                                  className="w-24 min-h-[28px] px-2 rounded-lg border border-[#12141C]/15 bg-[#FAF8F5] text-right font-mono text-[11px] text-[#12141C]/70"
                                />
                              </div>
                            ) : (
                              <div>
                                <p className="font-semibold text-[#12141C]">
                                  NPR {p.priceNpr.toLocaleString()}
                                </p>
                                {p.compareAtNpr > p.priceNpr && (
                                  <p className="text-[11px] text-[#12141C]/45 line-through">
                                    NPR {p.compareAtNpr.toLocaleString()}
                                  </p>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1">
                              <input
                                type="number"
                                min={0}
                                max={99}
                                step={0.5}
                                aria-label={`Affiliate commission percentage for ${p.shortName}`}
                                value={activeCommPct}
                                onChange={(e) => {
                                  const raw = Number(e.target.value);
                                  const val = Number.isFinite(raw)
                                    ? Math.min(
                                        99,
                                        Math.max(0, Math.round(raw * 10) / 10)
                                      )
                                    : 0;
                                  if (isEditing) {
                                    setEditCommPct(val);
                                  } else {
                                    onUpdateProductCommission(p.id, val);
                                  }
                                }}
                                className="w-16 min-h-[32px] px-2 py-1 rounded-lg border border-[#12141C]/15 bg-[#FAF8F5] text-right font-mono text-xs font-semibold text-[#153B24]"
                              />
                              <span className="font-mono text-xs text-[#12141C]/65">
                                %
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-700 tabular-nums whitespace-nowrap">
                            NPR {netProfitNpr.toLocaleString()}
                          </td>
                          <td
                            className={`py-3 px-4 text-right font-mono font-semibold tabular-nums whitespace-nowrap ${
                              p.stockUnits < 150
                                ? 'text-[#9E1B24]'
                                : 'text-[#12141C]'
                            }`}
                          >
                            {isEditing ? (
                              <input
                                type="number"
                                min={0}
                                aria-label={`Stock units for ${p.shortName}`}
                                value={editStockUnits}
                                onChange={(e) => setEditStockUnits(e.target.value)}
                                className="w-20 min-h-[32px] px-2 rounded-lg border border-[#153B24] bg-white text-right font-mono text-xs font-semibold text-[#12141C]"
                              />
                            ) : (
                              `${p.stockUnits} units`
                            )}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            {isEditing ? (
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => saveEditPricing(p)}
                                  className="min-h-[34px] px-2.5 py-1 rounded-lg bg-[#153B24] hover:bg-[#0F2C1B] text-white text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <Save className="w-3.5 h-3.5" />
                                  <span>Save</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingProductId(null)}
                                  className="min-h-[34px] px-2 py-1 rounded-lg border border-[#12141C]/15 text-xs font-semibold text-[#12141C]/70 hover:text-[#12141C] cursor-pointer"
                                  aria-label={`Cancel editing ${p.shortName}`}
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => beginEditPricing(p)}
                                  className="min-h-[34px] px-2.5 py-1 rounded-lg border border-[#12141C]/15 hover:border-[#153B24] text-xs font-semibold text-[#153B24] inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onRestockProduct(p.id, -10)}
                                  className="min-h-[34px] px-2 py-1 rounded-lg border border-[#12141C]/15 hover:border-[#9E1B24] text-xs font-mono font-semibold text-[#12141C] cursor-pointer"
                                  title="Deduct 10 stock units"
                                >
                                  -10
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onRestockProduct(p.id, 50)}
                                  className="min-h-[34px] px-2 py-1 rounded-lg border border-[#12141C]/15 hover:border-[#153B24] text-xs font-mono font-semibold text-[#12141C] cursor-pointer"
                                  title="Add 50 stock units"
                                >
                                  +50
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Botanical Supplier Cooperatives */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {BOTANICAL_SUPPLIERS.map((sup) => {
                const isExpanded = expandedSupplierId === sup.id;
                return (
                  <div
                    key={sup.id}
                    className="rounded-xl bg-white border border-[#12141C]/10 p-5 space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-[#12141C]/60 inline-flex items-center gap-1.5">
                          <Sprout className="w-3.5 h-3.5 text-emerald-700" />
                          <span>
                            {sup.region} · {sup.specialty}
                          </span>
                        </p>
                        <h3 className="font-display text-lg font-semibold text-[#12141C] mt-0.5">
                          {sup.name}
                        </h3>
                      </div>
                      <span className="text-xs font-semibold text-emerald-700 inline-flex items-center gap-1 shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>+{sup.wagePremiumPct}% Fair Trade</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-[#FAF8F5] p-3">
                        <p className="text-xs text-[#12141C]/60">
                          Botanicals Supplied
                        </p>
                        <p className="font-mono text-lg font-semibold text-[#12141C] tabular-nums mt-0.5">
                          {sup.harvestedKg} kg
                        </p>
                      </div>
                      <div className="rounded-lg bg-[#FAF8F5] p-3">
                        <p className="text-xs text-[#12141C]/60">
                          Direct Payout
                        </p>
                        <p className="font-mono text-lg font-semibold text-[#153B24] tabular-nums mt-0.5">
                          NPR {sup.directPayoutNpr.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setExpandedSupplierId(isExpanded ? null : sup.id)
                      }
                      className="w-full min-h-[40px] px-4 py-2 rounded-lg border border-[#12141C]/15 hover:border-[#153B24] text-xs font-semibold text-[#12141C] flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <span>
                        {isExpanded
                          ? 'Hide Botanical Lot Ledger'
                          : 'View Botanical Lot Ledger'}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    {isExpanded && (
                      <div className="border-t border-[#12141C]/10 pt-3 space-y-2">
                        {sup.ledgerEntries.map((entry) => (
                          <div
                            key={entry.lot}
                            className="flex items-center justify-between text-xs py-1.5 border-b border-[#12141C]/5 last:border-b-0"
                          >
                            <div>
                              <p className="font-mono font-semibold text-[#12141C]">
                                {entry.lot} · {entry.weightKg} kg
                              </p>
                              <p className="text-[#12141C]/55">
                                {entry.date} · {entry.channel}
                              </p>
                            </div>
                            <span className="font-mono font-semibold text-emerald-700 tabular-nums">
                              NPR {entry.payoutNpr.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 5. LAB QUALITY & HPLC COA */}
        {section === 'lab' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="inline-flex flex-wrap gap-2">
                {Object.values(BATCH_PASSPORTS).map((b) => (
                  <button
                    key={b.batchCode}
                    type="button"
                    onClick={() => {
                      setSelectedBatchCode(b.batchCode);
                      setActivePeakIdx(0);
                    }}
                    className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-mono font-medium cursor-pointer transition-colors ${
                      selectedBatchCode === b.batchCode
                        ? 'bg-[#12141C] text-white'
                        : 'bg-white border border-[#12141C]/15 text-[#12141C] hover:border-[#12141C]'
                    }`}
                  >
                    Batch #{b.batchCode}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleExportLabCoa}
                className="min-h-[42px] px-4 py-2 rounded-xl bg-[#9E1B24] hover:bg-[#82141C] text-white text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Download className="w-4 h-4" />
                <span>Export Official Lab COA</span>
              </button>
            </div>

            {exportNote && (
              <p className="text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
                {exportNote}
              </p>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              <div className="lg:col-span-6 rounded-xl bg-white border border-[#12141C]/10 p-6 space-y-5">
                <div className="flex items-start justify-between gap-3 border-b border-[#12141C]/10 pb-4">
                  <div>
                    <p className="text-xs font-mono text-[#12141C]/60">
                      Certificate #{activeCoa.coaNumber} · {activeCoa.origin}
                    </p>
                    <h2 className="font-display text-xl font-semibold text-[#12141C] mt-1">
                      {activeCoa.productName}
                    </h2>
                  </div>
                  <span className="text-xs font-semibold text-emerald-700 inline-flex items-center gap-1 shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Passed</span>
                  </span>
                </div>

                <dl className="divide-y divide-[#12141C]/10 text-sm">
                  <div className="py-3 flex justify-between gap-4">
                    <dt className="text-[#12141C]/65">Bio-Active Assay</dt>
                    <dd className="font-mono font-semibold text-[#12141C] tabular-nums text-right">
                      {activeCoa.activeAssay}
                    </dd>
                  </div>
                  <div className="py-3 flex justify-between gap-4">
                    <dt className="text-[#12141C]/65">pH Profile</dt>
                    <dd className="font-mono font-semibold text-[#12141C] tabular-nums text-right">
                      {activeCoa.phBalance}
                    </dd>
                  </div>
                  <div className="py-3 flex justify-between gap-4">
                    <dt className="text-[#12141C]/65">Heavy Metals (Pb / As)</dt>
                    <dd className="font-mono font-semibold text-emerald-700 tabular-nums text-right">
                      {activeCoa.heavyMetals}
                    </dd>
                  </div>
                  <div className="py-3 flex justify-between gap-4">
                    <dt className="text-[#12141C]/65">Microbial Count</dt>
                    <dd className="font-mono font-semibold text-[#12141C] tabular-nums text-right">
                      {activeCoa.microbialCount}
                    </dd>
                  </div>
                </dl>

                <div className="pt-2 border-t border-[#12141C]/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 text-xs text-[#12141C]/65">
                    <p className="font-semibold text-[#12141C]">
                      Packaging QR Label · #{activeCoa.batchCode}
                    </p>
                    <p>
                      Valid until {activeCoa.validUntil}. Scan links directly to CareNest Batch COA verification.
                    </p>
                  </div>
                  <div className="shrink-0">
                    <BatchQrCode
                      value={`${typeof window !== 'undefined' ? window.location.origin : 'https://carenest.com.np'}/?batch=${encodeURIComponent(activeCoa.batchCode)}&coa=${encodeURIComponent(activeCoa.coaNumber)}`}
                      batchCode={activeCoa.batchCode}
                      size={112}
                      darkColor="#12141C"
                      showActions={false}
                    />
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6 rounded-xl bg-white border border-[#12141C]/10 p-6 flex flex-col justify-between space-y-5">
                <div>
                  <p className="text-xs font-semibold text-[#12141C]/60">
                    HPLC Phyto-Active Spectrum
                  </p>
                  <p className="text-sm text-[#12141C] mt-1">
                    Click any retention peak to inspect SkinAid active compound
                    wavelength.
                  </p>
                </div>

                <div className="rounded-xl bg-[#FAF8F5] border border-[#12141C]/10 p-5">
                  <div className="h-44 flex items-end justify-around gap-3 border-b border-[#12141C]/15 pb-3">
                    {activeCoa.hplcPeaks.map((peak, index) => {
                      const isFocused = index === activePeakIdx;
                      return (
                        <button
                          key={peak.compound}
                          type="button"
                          onClick={() => setActivePeakIdx(index)}
                          className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer"
                        >
                          <span className="font-mono text-[11px] text-[#12141C]/70 mb-1.5 tabular-nums">
                            {peak.intensityPct}%
                          </span>
                          <div
                            style={{ height: `${peak.intensityPct}%` }}
                            className={`w-full max-w-[32px] rounded-t-md transition-colors ${
                              isFocused
                                ? 'bg-[#12141C]'
                                : 'bg-[#12141C]/25 group-hover:bg-[#12141C]/70'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex justify-around pt-2 text-[11px] font-mono text-[#12141C]/60 tabular-nums">
                    {activeCoa.hplcPeaks.map((peak) => (
                      <span key={peak.compound}>{peak.retentionMin}m</span>
                    ))}
                  </div>
                </div>

                {activeCoa.hplcPeaks[activePeakIdx] && (
                  <div className="rounded-xl bg-[#12141C] text-white p-4 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div>
                      <p className="text-white/65">Selected Peak Compound</p>
                      <p className="font-semibold text-sm mt-0.5">
                        {activeCoa.hplcPeaks[activePeakIdx].compound}
                      </p>
                    </div>
                    <div className="font-mono text-right tabular-nums">
                      <p>
                        Retention:{' '}
                        {activeCoa.hplcPeaks[activePeakIdx].retentionMin} min
                      </p>
                      <p className="text-amber-300">
                        UV {activeCoa.hplcPeaks[activePeakIdx].wavelengthNm} nm
                        · {activeCoa.hplcPeaks[activePeakIdx].intensityPct}%
                        peak
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
