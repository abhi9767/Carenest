export type PortalView = 'store' | 'shopper' | 'creator' | 'admin';

export type StoreSubView =
  | 'shop'
  | 'catalog'
  | 'product'
  | 'checkout'
  | 'track'
  | 'routine'
  | 'scan'
  | 'reviews';

export interface RoutineBundle {
  id: string;
  title: string;
  subtitle: string;
  concernTag: string;
  productIds: string[];
  bundleDiscountPct: number;
  highlightMetric: string;
}

export interface SkinConcernProtocol {
  id: string;
  label: string;
  summary: string;
  morningNote: string;
  nightNote: string;
  productIds: string[];
}

export type ProductCategory =
  | 'All Formulations'
  | 'Skin Care'
  | 'Sun Care'
  | 'Hair Care'
  | 'Bath & Spa';

export interface Product {
  id: string;
  name: string;
  shortName: string;
  brandLine: string;
  category: Exclude<ProductCategory, 'All Formulations'>;
  priceNpr: number;
  compareAtNpr: number;
  manufacturerCostNpr?: number;
  volume: string;
  rating: number;
  reviewCount: number;
  image: string;
  isPackshot?: boolean;
  batchCode: string;
  originRegion: string;
  keyMetricStat: string;
  keyMetricLabel: string;
  formulationType: string;
  description: string;
  ingredients: string[];
  affiliateCommissionPct: number;
  stockUnits: number;
  featured?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type PaymentMethod =
  | 'eSewa'
  | 'Khalti'
  | 'Fonepay QR'
  | 'Card'
  | 'COD';

export type OrderStatus = 'Packing in Lab' | 'Dispatched' | 'Delivered';

export interface Order {
  id: string;
  date: string;
  customerName: string;
  customerEmail?: string;
  phone: string;
  address: string;
  city: string;
  itemsSummary: string;
  subtotalNpr: number;
  discountNpr: number;
  totalNpr: number;
  affiliateCodeUsed?: string;
  affiliateCommissionNpr?: number;
  paymentMethod: PaymentMethod;
  paymentCollected: boolean;
  paymentTransactionId?: string;
  paymentGatewayMode?: 'Live' | 'Sandbox';
  status: OrderStatus;
  courierChannel: string;
}

export interface RoutineStep {
  id: string;
  timeOfDay: 'Morning' | 'Midday' | 'Night';
  title: string;
  scheduledTime: string;
  productName: string;
  completed: boolean;
}

export interface Review {
  id: string;
  author: string;
  location: string;
  rating: number;
  date: string;
  productId: string;
  comment: string;
  helpfulCount: number;
  helpfulVoted?: boolean;
  verified: boolean;
}

export interface BatchPassport {
  batchCode: string;
  coaNumber: string;
  title: string;
  productName: string;
  origin: string;
  formulatedBy: string;
  activeComplex: string;
  labStatus: string;
  validUntil: string;
  activeAssay: string;
  phBalance: string;
  heavyMetals: string;
  microbialCount: string;
  hplcPeaks: Array<{
    compound: string;
    retentionMin: number;
    intensityPct: number;
    wavelengthNm: number;
  }>;
}

export interface BotanicalSupplier {
  id: string;
  name: string;
  region: string;
  specialty: string;
  verified: boolean;
  harvestedKg: number;
  directPayoutNpr: number;
  wagePremiumPct: number;
  ledgerEntries: Array<{
    date: string;
    lot: string;
    weightKg: number;
    payoutNpr: number;
    channel: string;
  }>;
}

export interface CreatorCommissionEntry {
  id: string;
  orderId: string;
  date: string;
  productSummary: string;
  orderTotalNpr: number;
  commissionNpr: number;
  status: 'Settled' | 'Pending Delivery';
}

export interface CreatorPayoutRecord {
  id: string;
  date: string;
  channel: 'eSewa' | 'Khalti';
  amountNpr: number;
  reference: string;
  status: 'Paid' | 'Queued';
}

export interface CreatorProfile {
  creatorPartnerId: string;
  fullName: string;
  email?: string;
  instagramHandle: string;
  tiktokHandle: string;
  audienceTier: string;
  deliveryAddress: string;
  referralCode: string;
  balanceNpr: number;
  payoutTierPct: number;
  clicks: number;
  orders: number;
  conversionRatePct: number;
  enrolled: boolean;
  commissionHistory: CreatorCommissionEntry[];
  payoutHistory: CreatorPayoutRecord[];
}

export interface AdminAffiliateAccount {
  id: string;
  creatorPartnerId: string;
  name: string;
  email?: string;
  phone?: string;
  handle: string;
  tiktokHandle?: string;
  deliveryAddress?: string;
  referralCode: string;
  passcode?: string;
  tierPct: number;
  clicks: number;
  orders: number;
  grossSalesNpr: number;
  payableCommissionNpr: number;
  payoutChannel: 'eSewa' | 'Khalti';
  status: 'Active' | 'Pending Review' | 'Suspended';
  createdAt?: string;
  createdByAdmin?: string;
}

export interface ShopperProfile {
  fullName: string;
  email?: string;
  phone: string;
  city: string;
  address: string;
  skinFocus: string;
  preferredPayment: PaymentMethod;
  memberSince: string;
}

