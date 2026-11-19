import { useEffect, useState, FormEvent } from 'react';
import {
  Check,
  Copy,
  ArrowRight,
  Wallet,
  TrendingUp,
  MousePointerClick,
  ShoppingBag,
  Sparkles,
  Link2,
  ExternalLink,
  LayoutDashboard,
  FileSpreadsheet,
  UserCheck,
  Package,
  Search,
  MessageSquareText,
} from 'lucide-react';
import { CreatorProfile, Product } from '../types';
import { ResilientImage } from './ResilientImage';

interface CreatorPortalProps {
  profile: CreatorProfile;
  products: Product[];
  onUpdateProfile: (next: CreatorProfile) => void;
  onPreviewStoreWithCode: (code: string) => void;
}

type CreatorSection = 'overview' | 'links' | 'ledger' | 'payouts';

const DAILY_PERFORMANCE = [
  { day: 'Nov 05', clicks: 132, orders: 4 },
  { day: 'Nov 06', clicks: 148, orders: 5 },
  { day: 'Nov 07', clicks: 165, orders: 6 },
  { day: 'Nov 08', clicks: 142, orders: 5 },
  { day: 'Nov 09', clicks: 184, orders: 7 },
  { day: 'Nov 10', clicks: 210, orders: 9 },
  { day: 'Nov 11', clicks: 196, orders: 8 },
  { day: 'Nov 12', clicks: 174, orders: 6 },
  { day: 'Nov 13', clicks: 189, orders: 7 },
  { day: 'Nov 14', clicks: 224, orders: 10 },
  { day: 'Nov 15', clicks: 205, orders: 8 },
  { day: 'Nov 16', clicks: 192, orders: 7 },
  { day: 'Nov 17', clicks: 238, orders: 11 },
  { day: 'Nov 18', clicks: 219, orders: 9 },
];

const CREATOR_NAV: Array<{
  id: CreatorSection;
  label: string;
  icon: typeof LayoutDashboard;
}> = [
  { id: 'overview', label: 'Overview & Earnings', icon: LayoutDashboard },
  { id: 'links', label: 'Affiliate Links & Kits', icon: Link2 },
  { id: 'ledger', label: 'Commission Ledger', icon: FileSpreadsheet },
  { id: 'payouts', label: 'Payouts & Profile', icon: UserCheck },
];

export function CreatorPortal({
  profile,
  products,
  onUpdateProfile,
  onPreviewStoreWithCode,
}: CreatorPortalProps) {
  const [section, setSection] = useState<CreatorSection>(
    profile.enrolled ? 'overview' : 'payouts'
  );
  const [activeDayIdx, setActiveDayIdx] = useState<number>(
    DAILY_PERFORMANCE.length - 1
  );

  const [fullName, setFullName] = useState(profile.fullName);
  const [instagramHandle, setInstagramHandle] = useState(
    profile.instagramHandle
  );
  const [tiktokHandle, setTiktokHandle] = useState(profile.tiktokHandle);
  const [deliveryAddress, setDeliveryAddress] = useState(
    profile.deliveryAddress
  );

  useEffect(() => {
    setFullName(profile.fullName);
    setInstagramHandle(profile.instagramHandle);
    setTiktokHandle(profile.tiktokHandle);
    setDeliveryAddress(profile.deliveryAddress);
  }, [profile]);

  const [selectedSkuId, setSelectedSkuId] = useState<string>(
    products[0]?.id || 'skinaid-tinted-sunscreen'
  );
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedSkuLink, setCopiedSkuLink] = useState(false);
  const [copiedCaptionIdx, setCopiedCaptionIdx] = useState<number | null>(null);

  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerStatus, setLedgerStatus] = useState<
    'All' | 'Settled' | 'Pending Delivery'
  >('All');

  const [payoutChannel, setPayoutChannel] = useState<'eSewa' | 'Khalti'>(
    'eSewa'
  );
  const [payoutNotice, setPayoutNotice] = useState<string | null>(null);
  const [profileSavedNotice, setProfileSavedNotice] = useState<string | null>(
    null
  );
  const [prKitRequested, setPrKitRequested] = useState<string>(
    'SkinAid 4-Step Barrier PR Box'
  );
  const [prKitStatus, setPrKitStatus] = useState<'Active Dispatch' | 'Requested'>(
    'Active Dispatch'
  );

  const selectedProduct =
    products.find((p) => p.id === selectedSkuId) || products[0];

  const filteredCommissions = profile.commissionHistory.filter((entry) => {
    const matchesStatus =
      ledgerStatus === 'All' || entry.status === ledgerStatus;
    const q = ledgerSearch.trim().toLowerCase();
    const matchesSearch =
      !q ||
      entry.orderId.toLowerCase().includes(q) ||
      entry.productSummary.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const settledTotalNpr = profile.commissionHistory
    .filter((c) => c.status === 'Settled')
    .reduce((acc, c) => acc + c.commissionNpr, 0);

  const pendingTotalNpr = profile.commissionHistory
    .filter((c) => c.status === 'Pending Delivery')
    .reduce((acc, c) => acc + c.commissionNpr, 0);

  const handleSaveProfile = (e: FormEvent) => {
    e.preventDefault();
    const cleanName = fullName.trim() || profile.fullName;

    onUpdateProfile({
      ...profile,
      fullName: cleanName,
      instagramHandle: instagramHandle.trim() || profile.instagramHandle,
      tiktokHandle: tiktokHandle.trim() || profile.tiktokHandle,
      deliveryAddress: deliveryAddress.trim() || profile.deliveryAddress,
    });
    setProfileSavedNotice(
      `Creator profile saved. Partner ID ${profile.creatorPartnerId} & code ${profile.referralCode} remain Admin-managed.`
    );
    setTimeout(() => setProfileSavedNotice(null), 3200);
  };

  const handleCopyCode = async () => {
    const shareText = `https://carenest.com.np/?ref=${profile.referralCode}`;
    try {
      await navigator.clipboard.writeText(shareText);
    } catch {
      // Clipboard fallback
    }
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyProductLink = async () => {
    if (!selectedProduct) return;
    const shareText = `https://carenest.com.np/skinaid/${selectedProduct.id}?ref=${profile.referralCode}`;
    try {
      await navigator.clipboard.writeText(shareText);
    } catch {
      // Clipboard fallback
    }
    setCopiedSkuLink(true);
    setTimeout(() => setCopiedSkuLink(false), 2000);
  };

  const handleCopyCaption = async (idx: number, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard fallback
    }
    setCopiedCaptionIdx(idx);
    setTimeout(() => setCopiedCaptionIdx(null), 2000);
  };

  const MIN_PAYOUT_NPR = 1000;

  const handleRequestPayout = () => {
    if (profile.balanceNpr < MIN_PAYOUT_NPR) return;
    const paidAmount = profile.balanceNpr;
    const refPrefix = payoutChannel === 'eSewa' ? 'ESW' : 'KHL';
    const refNumber = `${refPrefix}-${Math.floor(1000000 + Math.random() * 8999999)}`;

    onUpdateProfile({
      ...profile,
      balanceNpr: 0,
      payoutHistory: [
        {
          id: `pay-${Date.now()}`,
          date: 'Nov 18, 2026',
          channel: payoutChannel,
          amountNpr: paidAmount,
          reference: refNumber,
          status: 'Queued',
        },
        ...profile.payoutHistory,
      ],
    });
    setPayoutNotice(
      `NPR ${paidAmount.toLocaleString()} payout (${refNumber}) queued to ${payoutChannel} for ${profile.instagramHandle}.`
    );
  };

  const activeDay = DAILY_PERFORMANCE[activeDayIdx];

  const captionTemplates = [
    {
      title: 'Tinted SPF 50+ Reel Hook',
      body: `Zero white cast under Kathmandu sun. Testing SkinAid Herbo-Mineral Tinted Sunscreen SPF 50+ (Niacinamide + Manjistha + Licorice). Use code ${profile.referralCode} on CareNest for 10% off.`,
    },
    {
      title: '3-Step Barrier Routine TikTok',
      body: `My Chitwan-formulated morning routine: SkinAid Herbal Foaming Wash (pH 5.5) -> Skin Repairing Toner -> Tinted SPF 50+. Save 10% with my affiliate code ${profile.referralCode}.`,
    },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#FAF8F5] flex flex-col lg:flex-row">
      {/* Creator Workspace Sidebar */}
      <aside className="lg:w-64 shrink-0 bg-[#F3EFE9] border-b lg:border-b-0 lg:border-r border-[#12141C]/10 flex flex-col justify-between">
        <div className="p-4 sm:p-5 space-y-5">
          <div className="rounded-xl bg-white border border-[#12141C]/10 p-3.5 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-medium text-[#153B24]">
                Creator Partner
              </p>
              <span className="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#153B24]/10 text-[#153B24]">
                {profile.creatorPartnerId}
              </span>
            </div>
            <p className="font-semibold text-sm text-[#12141C] truncate">
              {profile.fullName}
            </p>
            <p className="text-xs text-[#12141C]/60 truncate">
              {profile.instagramHandle} ·{' '}
              <span className="font-mono font-semibold text-[#153B24]">
                {profile.referralCode}
              </span>
            </p>
          </div>

          <nav
            aria-label="Creator dashboard sections"
            className="flex lg:flex-col gap-1.5 overflow-x-auto no-scrollbar pb-1 lg:pb-0"
          >
            {CREATOR_NAV.map((item) => {
              const Icon = item.icon;
              const isActive = section === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSection(item.id)}
                  className={`min-h-[42px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium inline-flex items-center gap-2.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-[#153B24] text-white'
                      : 'text-[#12141C]/75 hover:bg-white/70 hover:text-[#12141C]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="hidden lg:block p-5 border-t border-[#12141C]/10 space-y-3">
          <div className="text-xs text-[#12141C]/70 space-y-1">
            <p className="font-semibold text-[#12141C]">
              Active Tier: {profile.payoutTierPct}% (Admin Managed)
            </p>
            <p>Shoppers save 10% when entering your code at CareNest checkout.</p>
            <p className="text-[11px] text-[#12141C]/50">
              Skin AID by CareNest · 3P Lab: Phytomax Care Pvt. Ltd.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onPreviewStoreWithCode(profile.referralCode)}
            className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-[#153B24]/30 bg-white hover:bg-[#153B24] hover:text-white text-[#153B24] text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Test Code in Store</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>

      {/* Main Creator Canvas */}
      <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 pb-20 lg:pb-10 space-y-6">
        {/* Top Breadcrumb Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#12141C]/10 pb-4">
          <div>
            <p className="text-xs text-[#12141C]/55">
              Creator Studio /{' '}
              <span className="font-medium text-[#153B24]">
                {CREATOR_NAV.find((n) => n.id === section)?.label}
              </span>
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#12141C] mt-0.5">
              {CREATOR_NAV.find((n) => n.id === section)?.label}
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleCopyCode}
              className="min-h-[40px] px-3.5 py-2 rounded-lg bg-white border border-[#12141C]/15 hover:border-[#153B24] text-xs font-mono font-semibold text-[#153B24] inline-flex items-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <span>{profile.referralCode}</span>
              {copiedCode ? (
                <Check className="w-3.5 h-3.5 text-emerald-700" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              type="button"
              onClick={() => onPreviewStoreWithCode(profile.referralCode)}
              className="lg:hidden min-h-[40px] px-3 py-2 rounded-lg bg-[#153B24] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <span>Preview Store</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* SECTION 1: OVERVIEW & EARNINGS */}
        {section === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
              <div className="xl:col-span-7 rounded-2xl bg-[#153B24] text-white p-6 sm:p-7 flex flex-col justify-between space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs text-white/75">
                      Available Affiliate Balance · {profile.payoutTierPct}% Tier
                    </p>
                    <p className="font-mono text-3xl sm:text-4xl font-semibold mt-1.5 tabular-nums">
                      NPR {profile.balanceNpr.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-left sm:text-right text-xs text-white/75 space-y-0.5 font-mono tabular-nums">
                    <p>Settled: NPR {settledTotalNpr.toLocaleString()}</p>
                    <p>Pending Delivery: NPR {pendingTotalNpr.toLocaleString()}</p>
                    <p className="text-emerald-300">Min. Payout: NPR {MIN_PAYOUT_NPR.toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex rounded-lg bg-white/10 p-1">
                    {(['eSewa', 'Khalti'] as const).map((wallet) => (
                      <button
                        key={wallet}
                        type="button"
                        onClick={() => setPayoutChannel(wallet)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                          payoutChannel === wallet
                            ? 'bg-white text-[#153B24]'
                            : 'text-white/75 hover:text-white'
                        }`}
                      >
                        {wallet}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    disabled={profile.balanceNpr < MIN_PAYOUT_NPR}
                    onClick={handleRequestPayout}
                    className="min-h-[42px] px-4 py-2 rounded-xl bg-[#9E1B24] hover:bg-[#82141C] disabled:opacity-45 text-white text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Wallet className="w-4 h-4" />
                    <span>
                      {profile.balanceNpr >= MIN_PAYOUT_NPR
                        ? `Withdraw to ${payoutChannel}`
                        : `Min. NPR ${MIN_PAYOUT_NPR.toLocaleString()} Required`}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSection('links')}
                    className="min-h-[42px] px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <span>Build SKU Link</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {payoutNotice && (
                  <p className="text-xs text-emerald-200 bg-black/25 border border-emerald-400/30 rounded-lg px-3.5 py-2.5">
                    {payoutNotice}
                  </p>
                )}
              </div>

              {/* 3 KPI Strip + Quick Code */}
              <div className="xl:col-span-5 grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-1 gap-4">
                <div className="rounded-xl bg-white border border-[#12141C]/10 p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[#12141C]/60">Link Clicks (30d)</p>
                    <p className="font-mono text-xl font-semibold text-[#12141C] mt-1 tabular-nums">
                      {profile.clicks.toLocaleString()}
                    </p>
                  </div>
                  <MousePointerClick className="w-5 h-5 text-[#153B24]/70" />
                </div>
                <div className="rounded-xl bg-white border border-[#12141C]/10 p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[#12141C]/60">
                      Attributed Orders
                    </p>
                    <p className="font-mono text-xl font-semibold text-[#12141C] mt-1 tabular-nums">
                      {profile.orders}
                    </p>
                  </div>
                  <ShoppingBag className="w-5 h-5 text-[#153B24]/70" />
                </div>
                <div className="rounded-xl bg-white border border-[#12141C]/10 p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[#12141C]/60">Conversion Rate</p>
                    <p className="font-mono text-xl font-semibold text-emerald-700 mt-1 tabular-nums">
                      {profile.conversionRatePct}%
                    </p>
                  </div>
                  <TrendingUp className="w-5 h-5 text-emerald-700" />
                </div>
              </div>
            </div>

            {/* Creator Bonus & Tier Milestone Tracker */}
            <div className="rounded-2xl bg-white border border-[#12141C]/10 p-5 sm:p-6 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-[#153B24]">
                    CareNest Affiliate Milestone · 100 Order Target
                  </p>
                  <p className="text-sm text-[#12141C] mt-0.5">
                    {profile.orders >= 100
                      ? `Goal unlocked! ${profile.payoutTierPct}% Commission Tier + NPR 2,500 CareNest Bonus active.`
                      : `${100 - profile.orders} more attributed orders to unlock the NPR 2,500 CareNest Milestone Bonus.`}
                  </p>
                </div>
                <span className="font-mono text-sm font-semibold text-[#153B24] tabular-nums">
                  {Math.min(100, profile.orders)} / 100 Orders
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-[#EFEAE3] overflow-hidden">
                <div
                  style={{
                    width: `${Math.min(100, Math.round((profile.orders / 100) * 100))}%`,
                  }}
                  className="h-full rounded-full bg-[#153B24] transition-all duration-300"
                />
              </div>
            </div>

            {/* Interactive 14-Day Attribution Chart + Top Commission SKUs */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              <div className="lg:col-span-7 rounded-2xl bg-white border border-[#12141C]/10 p-5 sm:p-6 flex flex-col justify-between space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="font-display text-lg font-semibold text-[#12141C]">
                      14-Day Click &amp; Order Attribution
                    </h2>
                    <p className="text-xs text-[#12141C]/60">
                      Click any bar to inspect daily referral traffic for{' '}
                      {profile.referralCode}.
                    </p>
                  </div>
                  {activeDay && (
                    <div className="text-right font-mono text-xs tabular-nums">
                      <p className="font-semibold text-[#153B24]">
                        {activeDay.day}: {activeDay.orders} orders
                      </p>
                      <p className="text-[#12141C]/60">
                        {activeDay.clicks} clicks
                      </p>
                    </div>
                  )}
                </div>

                <div className="h-44 flex items-end gap-1.5 sm:gap-2 border-b border-[#12141C]/10 pb-2 pt-4">
                  {DAILY_PERFORMANCE.map((d, idx) => {
                    const heightPct = Math.round((d.clicks / 250) * 100);
                    const selected = idx === activeDayIdx;
                    return (
                      <button
                        key={d.day}
                        type="button"
                        onClick={() => setActiveDayIdx(idx)}
                        aria-label={`${d.day}: ${d.clicks} clicks, ${d.orders} orders`}
                        className="flex-1 h-full flex flex-col items-center justify-end group cursor-pointer"
                      >
                        <div
                          style={{ height: `${heightPct}%` }}
                          className={`w-full rounded-t transition-colors ${
                            selected
                              ? 'bg-[#153B24]'
                              : 'bg-[#153B24]/20 group-hover:bg-[#153B24]/55'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <div className="flex justify-between text-[11px] font-mono text-[#12141C]/55">
                  <span>{DAILY_PERFORMANCE[0].day}</span>
                  <span>Nov 11</span>
                  <span>
                    {DAILY_PERFORMANCE[DAILY_PERFORMANCE.length - 1].day}
                  </span>
                </div>
              </div>

              <div className="lg:col-span-5 rounded-2xl bg-white border border-[#12141C]/10 p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-lg font-semibold text-[#12141C]">
                    High-Yield SkinAid SKUs
                  </h2>
                  <button
                    type="button"
                    onClick={() => setSection('links')}
                    className="text-xs font-semibold text-[#153B24] hover:underline cursor-pointer"
                  >
                    Generate links
                  </button>
                </div>

                <div className="divide-y divide-[#12141C]/10">
                  {products.slice(0, 4).map((p) => {
                    const estComm = Math.round(
                      p.priceNpr * 0.9 * (p.affiliateCommissionPct / 100)
                    );
                    return (
                      <div
                        key={p.id}
                        className="py-3 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <ResilientImage
                            src={p.image}
                            alt={p.name}
                            fallbackTitle={p.shortName}
                            className="w-10 h-10 rounded-lg object-contain bg-[#F3EFE9] p-1 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-[#12141C] truncate">
                              {p.shortName}
                            </p>
                            <p className="text-[#12141C]/55">
                              {p.affiliateCommissionPct}% tier · NPR{' '}
                              {p.priceNpr.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <span className="font-mono font-semibold text-[#153B24] tabular-nums shrink-0">
                          +NPR {estComm}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: AFFILIATE LINKS & KITS */}
        {section === 'links' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-6 rounded-2xl bg-white border border-[#12141C]/10 p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-semibold text-[#12141C]">
                  SkinAid Product Link Builder
                </h2>
                <span className="font-mono text-xs font-semibold text-[#153B24]">
                  Code: {profile.referralCode}
                </span>
              </div>

              <div>
                <label
                  htmlFor="sku-picker"
                  className="block text-xs font-medium text-[#12141C]/70 mb-1.5"
                >
                  Choose SkinAid Formulation
                </label>
                <select
                  id="sku-picker"
                  value={selectedSkuId}
                  onChange={(e) => setSelectedSkuId(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#12141C]/15 bg-[#FAF8F5] text-sm text-[#12141C]"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.shortName} (NPR {p.priceNpr.toLocaleString()} ·{' '}
                      {p.affiliateCommissionPct}%)
                    </option>
                  ))}
                </select>
              </div>

              {selectedProduct && (
                <div className="rounded-xl bg-[#FAF8F5] border border-[#12141C]/10 p-4 flex items-center gap-4">
                  <ResilientImage
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                    fallbackTitle={selectedProduct.shortName}
                    className="w-20 h-20 rounded-xl object-contain bg-[#F3EFE9] p-1.5 shrink-0"
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-sm font-semibold text-[#12141C]">
                      {selectedProduct.name}
                    </p>
                    <p className="text-xs text-[#12141C]/60">
                      Follower Price (10% off):{' '}
                      <span className="font-mono font-semibold text-[#12141C]">
                        NPR{' '}
                        {Math.round(selectedProduct.priceNpr * 0.9).toLocaleString()}
                      </span>
                    </p>
                    <p className="text-xs text-[#153B24] font-medium">
                      Your Commission:{' '}
                      <span className="font-mono font-semibold">
                        NPR{' '}
                        {Math.round(
                          selectedProduct.priceNpr *
                            0.9 *
                            (selectedProduct.affiliateCommissionPct / 100)
                        ).toLocaleString()}
                      </span>{' '}
                      ({selectedProduct.affiliateCommissionPct}%)
                    </p>
                  </div>
                </div>
              )}

              <div className="rounded-xl bg-[#FAF8F5] border border-[#12141C]/10 p-3 font-mono text-xs text-[#12141C]/75 break-all">
                https://carenest.com.np/skinaid/{selectedProduct?.id}?ref=
                {profile.referralCode}
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleCopyProductLink}
                  className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-[#153B24] hover:bg-[#9E1B24] text-white text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  {copiedSkuLink ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Product Link Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Tracked Product Link</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => onPreviewStoreWithCode(profile.referralCode)}
                  className="min-h-[44px] px-4 py-2.5 rounded-xl border border-[#12141C]/15 hover:border-[#153B24] text-xs font-semibold text-[#12141C] inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Preview Checkout</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="lg:col-span-6 space-y-6">
              {/* PR Starter Box & Sample Request */}
              <div className="rounded-2xl bg-[#153B24] text-white p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-emerald-300 font-medium inline-flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5" />
                      <span>Creator PR Kit Dispatch · Worth NPR 4,940</span>
                    </p>
                    <h3 className="font-display text-xl font-semibold">
                      {prKitRequested}
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-amber-300 shrink-0">
                    {prKitStatus}
                  </span>
                </div>
                <p className="text-xs text-white/80 leading-relaxed">
                  Shipped directly from Chitwan Phyto Lab to{' '}
                  {profile.deliveryAddress}. Select seasonal sample kit below to request restock for upcoming Reels:
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    'SkinAid 4-Step Barrier PR Box',
                    'Winter Night Cream & Aloe Duo',
                    'Biotin Hair & Bath PR Set',
                  ].map((kitName) => (
                    <button
                      key={kitName}
                      type="button"
                      onClick={() => {
                        setPrKitRequested(kitName);
                        setPrKitStatus('Requested');
                      }}
                      className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                        prKitRequested === kitName
                          ? 'bg-white text-[#153B24]'
                          : 'bg-white/10 text-white/80 hover:bg-white/20'
                      }`}
                    >
                      {kitName}
                    </button>
                  ))}
                </div>
              </div>

              {/* Copyable Caption Templates & Claim Card */}
              <div className="rounded-2xl bg-white border border-[#12141C]/10 p-6 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#153B24]">
                    <MessageSquareText className="w-4 h-4" />
                    <span>Instagram &amp; TikTok Affiliate Captions</span>
                  </div>
                  <span className="font-mono text-[11px] text-[#12141C]/55">
                    Verified Phytomax Claims
                  </span>
                </div>
                <div className="space-y-3">
                  {captionTemplates.map((tpl, idx) => (
                    <div
                      key={tpl.title}
                      className="rounded-xl bg-[#FAF8F5] border border-[#12141C]/10 p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-[#12141C]">
                          {tpl.title}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleCopyCaption(idx, tpl.body)}
                          className="text-xs font-semibold text-[#153B24] hover:text-[#9E1B24] inline-flex items-center gap-1 cursor-pointer"
                        >
                          {copiedCaptionIdx === idx ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Caption</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-[#12141C]/75 leading-relaxed">
                        {tpl.body}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 3: COMMISSION LEDGER */}
        {section === 'ledger' && (
          <div className="rounded-2xl bg-white border border-[#12141C]/10 overflow-hidden">
            <div className="p-5 border-b border-[#12141C]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-[#12141C]/45 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={ledgerSearch}
                  onChange={(e) => setLedgerSearch(e.target.value)}
                  placeholder="Search order #CN or SkinAid item..."
                  className="w-full min-h-[40px] pl-9 pr-3 py-1.5 rounded-lg border border-[#12141C]/15 bg-[#FAF8F5] text-xs text-[#12141C] focus:outline-none focus:border-[#153B24]"
                />
              </div>
              <div className="inline-flex items-center gap-1.5">
                {(['All', 'Settled', 'Pending Delivery'] as const).map(
                  (status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setLedgerStatus(status)}
                      className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                        ledgerStatus === status
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

            {filteredCommissions.length === 0 ? (
              <div className="p-10 text-center text-sm text-[#12141C]/60">
                No attributed SkinAid orders matched your filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#12141C]/10 bg-[#FAF8F5] text-[11px] font-semibold text-[#12141C]/60 uppercase tracking-wider">
                      <th className="py-3 px-4">Order</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">SkinAid Items</th>
                      <th className="py-3 px-4 text-right">Order Net</th>
                      <th className="py-3 px-4 text-right">Commission</th>
                      <th className="py-3 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#12141C]/8 text-xs sm:text-sm">
                    {filteredCommissions.map((entry) => (
                      <tr
                        key={entry.id}
                        className="hover:bg-[#FAF8F5]/70 transition-colors"
                      >
                        <td className="py-3 px-4 font-mono font-semibold text-[#12141C] whitespace-nowrap">
                          #{entry.orderId}
                        </td>
                        <td className="py-3 px-4 text-[#12141C]/65 whitespace-nowrap">
                          {entry.date}
                        </td>
                        <td className="py-3 px-4 text-[#12141C] max-w-xs truncate">
                          {entry.productSummary}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-[#12141C]/75 whitespace-nowrap">
                          NPR {entry.orderTotalNpr.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums text-[#153B24] whitespace-nowrap">
                          +NPR {entry.commissionNpr.toLocaleString()}
                        </td>
                        <td
                          className={`py-3 px-4 text-right text-xs font-semibold whitespace-nowrap ${
                            entry.status === 'Settled'
                              ? 'text-emerald-700'
                              : 'text-amber-700'
                          }`}
                        >
                          {entry.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* SECTION 4: PAYOUTS & PROFILE */}
        {section === 'payouts' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Payout History & Instant Withdrawal */}
            <div className="lg:col-span-5 space-y-6">
              <div className="rounded-2xl bg-[#153B24] text-white p-6 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-white/75">
                    Withdrawable Creator Balance
                  </p>
                  <span className="text-[11px] font-mono text-emerald-300">
                    Min: NPR {MIN_PAYOUT_NPR.toLocaleString()}
                  </span>
                </div>
                <p className="font-mono text-3xl font-semibold tabular-nums">
                  NPR {profile.balanceNpr.toLocaleString()}
                </p>
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-white/70 font-mono">
                    <span>Threshold Progress</span>
                    <span>
                      {Math.min(
                        100,
                        Math.round((profile.balanceNpr / MIN_PAYOUT_NPR) * 100)
                      )}
                      %
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-white/15 overflow-hidden">
                    <div
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round((profile.balanceNpr / MIN_PAYOUT_NPR) * 100)
                        )}%`,
                      }}
                      className="h-full rounded-full bg-emerald-300 transition-all"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {(['eSewa', 'Khalti'] as const).map((wallet) => (
                    <button
                      key={wallet}
                      type="button"
                      onClick={() => setPayoutChannel(wallet)}
                      className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                        payoutChannel === wallet
                          ? 'bg-white text-[#153B24]'
                          : 'bg-white/10 text-white/80 hover:text-white'
                      }`}
                    >
                      {wallet}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={profile.balanceNpr < MIN_PAYOUT_NPR}
                    onClick={handleRequestPayout}
                    className="flex-1 min-h-[40px] px-4 py-2 rounded-lg bg-[#9E1B24] hover:bg-[#82141C] disabled:opacity-45 text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
                  >
                    {profile.balanceNpr >= MIN_PAYOUT_NPR
                      ? 'Withdraw Now'
                      : `Below NPR ${MIN_PAYOUT_NPR.toLocaleString()} Min`}
                  </button>
                </div>
                {payoutNotice && (
                  <p className="text-xs text-emerald-200">{payoutNotice}</p>
                )}
              </div>

              <div className="rounded-2xl bg-white border border-[#12141C]/10 p-5 space-y-3">
                <h2 className="font-display text-lg font-semibold text-[#12141C]">
                  Disbursement History
                </h2>
                <div className="divide-y divide-[#12141C]/10">
                  {profile.payoutHistory.map((pay) => (
                    <div
                      key={pay.id}
                      className="py-3 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <p className="font-semibold text-[#12141C]">
                          {pay.channel} ·{' '}
                          <span className="font-mono text-[#12141C]/70">
                            {pay.reference}
                          </span>
                        </p>
                        <p className="text-[#12141C]/55">{pay.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-semibold text-[#153B24] tabular-nums">
                          NPR {pay.amountNpr.toLocaleString()}
                        </p>
                        <p className="text-[11px] font-medium text-emerald-700">
                          {pay.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Creator Application / Profile Form */}
            <form
              onSubmit={handleSaveProfile}
              className="lg:col-span-7 rounded-2xl bg-white border border-[#12141C]/10 p-6 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-[#12141C]/10 pb-3">
                <div>
                  <h2 className="font-display text-xl font-semibold text-[#12141C]">
                    Creator Profile &amp; Code Settings
                  </h2>
                  <p className="text-xs text-[#12141C]/60">
                    Update your handles, commission tier, and PR kit address.
                  </p>
                </div>
                <Sparkles className="w-5 h-5 text-[#9E1B24]" />
              </div>

              <div>
                <label
                  htmlFor="creator-name"
                  className="block text-xs font-semibold text-[#12141C]/75 mb-1.5"
                >
                  Full Legal Name
                </label>
                <input
                  id="creator-name"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#12141C]/15 bg-[#FAF8F5] text-sm text-[#12141C] focus:outline-none focus:border-[#153B24]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="creator-ig"
                    className="block text-xs font-semibold text-[#12141C]/75 mb-1.5"
                  >
                    Instagram Handle
                  </label>
                  <input
                    id="creator-ig"
                    type="text"
                    required
                    value={instagramHandle}
                    onChange={(e) => setInstagramHandle(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#12141C]/15 bg-[#FAF8F5] text-sm text-[#12141C] focus:outline-none focus:border-[#153B24]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="creator-tiktok"
                    className="block text-xs font-semibold text-[#12141C]/75 mb-1.5"
                  >
                    TikTok Handle
                  </label>
                  <input
                    id="creator-tiktok"
                    type="text"
                    value={tiktokHandle}
                    onChange={(e) => setTiktokHandle(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#12141C]/15 bg-[#FAF8F5] text-sm text-[#12141C] focus:outline-none focus:border-[#153B24]"
                  />
                </div>
              </div>

              <div className="rounded-xl bg-[#FAF8F5] border border-[#12141C]/10 p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <p className="text-[11px] text-[#12141C]/55">
                    Creator Partner ID (Admin Issued)
                  </p>
                  <p className="font-mono font-semibold text-[#12141C] mt-0.5">
                    {profile.creatorPartnerId}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-[#12141C]/55">
                    Assigned Referral Code
                  </p>
                  <p className="font-mono font-semibold text-[#153B24] mt-0.5">
                    {profile.referralCode}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-[#12141C]/55">
                    Approved Commission Tier
                  </p>
                  <p className="font-mono font-semibold text-[#9E1B24] mt-0.5">
                    {profile.payoutTierPct}% (Admin Managed · Up to 99%)
                  </p>
                </div>
              </div>

              <div>
                <label
                  htmlFor="creator-address"
                  className="block text-xs font-semibold text-[#12141C]/75 mb-1.5"
                >
                  PR Gifting Delivery Address (Nepal)
                </label>
                <input
                  id="creator-address"
                  type="text"
                  required
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#12141C]/15 bg-[#FAF8F5] text-sm text-[#12141C] focus:outline-none focus:border-[#153B24]"
                />
              </div>

              {profileSavedNotice && (
                <p className="text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2.5">
                  {profileSavedNotice}
                </p>
              )}

              <button
                type="submit"
                className="w-full min-h-[46px] px-6 py-3 rounded-xl bg-[#9E1B24] hover:bg-[#82141C] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>Save Handle &amp; Delivery Settings</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
