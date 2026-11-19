import 'dotenv/config';
import crypto from 'crypto';
import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import {
  GoogleGenAI,
  LiveServerMessage,
  Modality,
  ThinkingLevel,
} from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type ChatMode = 'fast' | 'general' | 'interactive' | 'deep';
type PortalContext = 'store' | 'shopper' | 'creator' | 'admin';

const MODEL_BY_MODE: Record<ChatMode, string> = {
  fast: 'gemini-3.1-flash-lite',
  general: 'gemini-4-hydrogen',
  interactive: 'gemini-4-hydrogen',
  deep: 'gemini-4-hydrogen',
};

const THINKING_BY_MODE: Record<ChatMode, ThinkingLevel> = {
  fast: ThinkingLevel.MINIMAL,
  general: ThinkingLevel.LOW,
  interactive: ThinkingLevel.HIGH,
  deep: ThinkingLevel.XHIGH,
};

const SKINAID_KNOWLEDGE = `
Brand & Platform: Skin AID by CareNest — Official CareNest e-commerce platform and creator affiliate program selling Skin AID products manufactured under contract by 3rd-party manufacturer Phytomax Care Pvt. Ltd. (Bharatpur-16, Chitwan, Nepal).
Products (NPR):
1. SkinAid Herbo-Mineral Tinted Ultra Light Face Sunscreen (50 gm, NPR 1,450, Batch SA-26-501): SPF 50+, PA+++ UVA/UVB/Blue Light, zero white cast, Niacinamide, Manjistha, Jethi Madhu, Ashwagandha, Brahmi, Turmeric, Green Tea.
2. SkinAid Herbal Foaming Face Wash (100 ml, NPR 890, Batch SA-26-104): pH 5.5, Niacinamide 3%, SAP Vitamin C 1.5%, Ashwagandha, Neem, Moringa, Rhododendron, Calendula.
3. SkinAid Skin Repairing Toner (100 ml, NPR 950, Batch SA-26-209): -38% TEWL barrier repair, 2% Salix alba (willow bark), 1.2% Centella madecassoside, Witch Hazel, Rosemary, Moringa.
4. SkinAid Anti Ageing Skin Repairing Night Cream (50 gm, NPR 1,650, Batch SA-26-312): Vitamin E, skin-repairing peptides, Rice Bran Ferulic Acid, Pomegranate Ellagic Acid, Willow Bark.
5. SkinAid Radiant & Purifying Cleansing Milk (200 ml, NPR 1,150, Batch SA-26-118): Anti-pollution emulsion, Niacinamide, Vitamin C, Manjistha, Ashwagandha, Aloe polysaccharides.
6. SkinAid 95% Aloe Vera Soothing Gel (150 ml, NPR 780, Batch SA-26-402): 95% pure Aloe Barbadensis, Vitamin E, Tea Tree, Rosemary.
7. SkinAid Hair Restorative Shampoo (200 ml, NPR 1,050, Batch SA-26-607): Milk Protein, D-Biotin, Keratin, Argan, Almond, Onion, Ginger, Amla.
8. SkinAid Goat Milk Bath & Beauty Soap (100 gm, NPR 420, Batch SA-26-711): Caprine Milk Lactic AHA, Avocado oil, Cocoa Butter, Sodium Lactate.
9. SkinAid Rose Water Toning Hydrosol (120 ml, NPR 650, Batch SA-26-215): Steam-distilled Rosa damascena, Rose hip oil, Cucumber, Hibiscus, Aloe.
10. SkinAid Hydra Facial Serums 4-Serum Pro Set (4 x 500 ml, NPR 6,800, Batch SA-26-901): Clinical 4-step system (AS1 AHA Exfoliating Cleanser, SA2 Salicylic Calming Solution, A03 Vitamin C Spray Serum, Cleanser-4 Sanitizer).

Commerce, Quality & Affiliate Rules:
- CareNest manages the online storefront, fulfillment, billing (eSewa, Khalti, COD), and creator affiliate payouts.
- Phytomax Care Pvt. Ltd. (Bharatpur-16, Chitwan) is the 3rd-party GMP contract manufacturer providing HPLC batch COAs (heavy metals < 0.01 ppm, sterile microbial count).
- Creator Affiliate Policy (Confidential to Creator/Admin portals): Creators earn 3% (Rising), 4% (Pro), or a strict maximum 5% (Elite Max Cap) commission on referred sales; NPR 1,000 minimum withdrawal threshold via eSewa/Khalti.
`;

function buildSystemInstruction(
  portalContext: PortalContext,
  mode: ChatMode | 'live'
): string {
  const roleMap: Record<PortalContext, string> = {
    store:
      'You are Skin AID by CareNest Botanical Advisor helping shoppers in Nepal choose authentic SkinAid formulations, layer AM/PM routines, and verify batch COA safety. Never mention, disclose, or invent creator affiliate codes to shoppers.',
    shopper:
      'You are Skin AID by CareNest Personal Shopper Concierge assisting returning SkinAid customers in Nepal with tracking deliveries, building daily AM/PM routines, and restocking saved formulations. Never mention, disclose, or invent creator affiliate codes to shoppers.',
    creator:
      'You are Skin AID by CareNest Creator Growth Strategist helping content creators in Nepal craft high-converting TikTok/Instagram scripts, bundle pitches, deep links (?ref=CODE), and maximize earnings under CareNest 3%-5% (max 5% cap) eSewa/Khalti commission policy.',
    admin:
      'You are Skin AID by CareNest Operations & Unit-Economics Analyst supporting CareNest administrators on 3rd-party Phytomax Care Pvt. Ltd. wholesale costs, HPLC batch QA, inventory restocking, fulfillment, and 3%-5% max affiliate payouts.',
  };

  const depthGuidance: Record<ChatMode | 'live', string> = {
    fast: 'Keep answers ultra-concise (2-4 crisp bullet points or sentences) with direct SKU names and NPR prices.',
    general:
      'Provide clear, helpful, grounded answers tailored to the SkinAid catalog and CareNest platform.',
    interactive:
      'Structure step-by-step interactive plans (AM/PM regimens, multi-day creator content calendars, or bundle combinations) with clear rationale and NPR totals.',
    deep:
      'Perform deep phytochemistry, formulation compatibility, pH layering, HPLC compound synergy, or unit-economics analysis with scientific precision.',
    live:
      'Speak naturally, warmly, and concisely as a real-time voice advisor for CareNest SkinAid. Keep spoken replies conversational (2-4 sentences unless asked for detail) and avoid markdown symbols or tables.',
  };

  return `${roleMap[portalContext]}\n${depthGuidance[mode]}\n\nKnowledge Base:\n${SKINAID_KNOWLEDGE}\nOnly cite SkinAid products, prices, batches, and policies grounded in this knowledge base. If asked medical diagnosis questions, advise consulting a dermatologist.`;
}

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const err = new Error(
      'GEMINI_API_KEY is not configured. Open Settings > Secrets to set or select an API key.'
    ) as Error & { statusCode?: number };
    err.statusCode = 400;
    throw err;
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function parseGeminiError(error: unknown): {
  status: number;
  message: string;
} {
  const rawMessage =
    error instanceof Error ? error.message : String(error ?? 'Unknown error');
  const statusMatch = rawMessage.match(/\b(400|401|403|404|429|500|503)\b/);
  const explicitStatus =
    typeof (error as { status?: number })?.status === 'number'
      ? (error as { status: number }).status
      : typeof (error as { statusCode?: number })?.statusCode === 'number'
        ? (error as { statusCode: number }).statusCode
        : statusMatch
          ? Number(statusMatch[1])
          : 500;

  if (
    explicitStatus === 403 ||
    rawMessage.includes('PERMISSION_DENIED') ||
    rawMessage.includes('API_KEY_INVALID')
  ) {
    return {
      status: explicitStatus === 403 ? 403 : 400,
      message: `${rawMessage}. Please check or select your Gemini API key in Settings > Secrets.`,
    };
  }

  if (explicitStatus === 429 || rawMessage.includes('RESOURCE_EXHAUSTED')) {
    return {
      status: 429,
      message: `Quota or paid-model access limit reached (${rawMessage}). Check your billing-enabled API key in Settings > Secrets, or switch to General (gemini-4-hydrogen) or Fast (gemini-3.1-flash-lite).`,
    };
  }

  if (explicitStatus === 404 || rawMessage.includes('NOT_FOUND')) {
    return {
      status: 404,
      message: `Requested Gemini model unavailable (${rawMessage}).`,
    };
  }

  return {
    status: explicitStatus >= 400 && explicitStatus < 600 ? explicitStatus : 500,
    message: rawMessage,
  };
}

async function withTransientRetry<T>(fn: () => Promise<T>, maxAttempts = 2): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      const isTransient = msg.includes('503') || msg.includes('UNAVAILABLE');
      if (!isTransient || attempt === maxAttempts) {
        throw err;
      }
      await new Promise((r) => setTimeout(r, 400 * attempt));
    }
  }
  throw lastErr;
}

function hashSecret(secret: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(secret, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifySecret(secret: string, stored: string): boolean {
  const [salt, expectedHex] = stored.split(':');
  if (!salt || !expectedHex) return false;
  const derived = crypto.scryptSync(secret, salt, 64);
  const expected = Buffer.from(expectedHex, 'hex');
  if (derived.length !== expected.length) return false;
  return crypto.timingSafeEqual(derived, expected);
}

interface StoredShopper {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  skinFocus: string;
  preferredPayment: 'eSewa' | 'Khalti' | 'Fonepay QR' | 'Card' | 'COD';
  memberSince: string;
  passwordHash: string;
}

interface StoredCreatorPartner {
  id: string;
  creatorPartnerId: string;
  name: string;
  email: string;
  phone: string;
  handle: string;
  tiktokHandle: string;
  deliveryAddress: string;
  referralCode: string;
  passcodeHash: string;
  tierPct: number;
  clicks: number;
  orders: number;
  grossSalesNpr: number;
  payableCommissionNpr: number;
  payoutChannel: 'eSewa' | 'Khalti';
  status: 'Active' | 'Pending Review' | 'Suspended';
  createdAt: string;
  createdByAdmin: string;
}

const SHOPPER_STORE: StoredShopper[] = [
  {
    id: 'shp-1',
    fullName: 'Aarohi Tuladhar',
    email: 'aarohi@carenest.np',
    phone: '+977 984-155-7720',
    city: 'Lalitpur',
    address: 'Sanepa Height, Lalitpur Ward 03',
    skinFocus: 'UV & Melasma Protection',
    preferredPayment: 'eSewa',
    memberSince: 'Oct 2026',
    passwordHash: hashSecret('SkinAid@2026'),
  },
];

const CREATOR_PARTNER_STORE: StoredCreatorPartner[] = [
  {
    id: 'aff-1',
    creatorPartnerId: 'CN-CR-1001',
    name: 'Aayusha Shrestha',
    email: 'aayusha@creator.carenest.np',
    phone: '+977 980-311-4401',
    handle: '@aayusha.glows',
    tiktokHandle: '@aayusha_skincare',
    deliveryAddress: 'Jhamsikhel-3, Lalitpur, Nepal',
    referralCode: 'AAYUSHA5',
    passcodeHash: hashSecret('Aayu#2026'),
    tierPct: 5,
    clicks: 2418,
    orders: 94,
    grossSalesNpr: 162400,
    payableCommissionNpr: 6150,
    payoutChannel: 'eSewa',
    status: 'Active',
    createdAt: 'Oct 02, 2026',
    createdByAdmin: 'CareNest HQ Admin',
  },
  {
    id: 'aff-2',
    creatorPartnerId: 'CN-CR-1002',
    name: 'Dr. Srijana Poudel',
    email: 'srijana@creator.carenest.np',
    phone: '+977 985-109-8821',
    handle: '@dr.srijana.derm',
    tiktokHandle: '@drsrijana_skin',
    deliveryAddress: 'Lazimpat-2, Kathmandu, Nepal',
    referralCode: 'PHYTOMAX5',
    passcodeHash: hashSecret('Srija#2026'),
    tierPct: 5,
    clicks: 1960,
    orders: 68,
    grossSalesNpr: 194500,
    payableCommissionNpr: 7820,
    payoutChannel: 'Khalti',
    status: 'Active',
    createdAt: 'Oct 10, 2026',
    createdByAdmin: 'CareNest HQ Admin',
  },
  {
    id: 'aff-3',
    creatorPartnerId: 'CN-CR-1003',
    name: 'Roshni Tamang',
    email: 'roshni@creator.carenest.np',
    phone: '+977 981-224-5509',
    handle: '@roshni.nepal',
    tiktokHandle: '@roshni_glow',
    deliveryAddress: 'Lakeside-6, Pokhara, Nepal',
    referralCode: 'SKINAID4',
    passcodeHash: hashSecret('Roshni#2026'),
    tierPct: 4,
    clicks: 1120,
    orders: 37,
    grossSalesNpr: 58900,
    payableCommissionNpr: 2356,
    payoutChannel: 'eSewa',
    status: 'Active',
    createdAt: 'Oct 18, 2026',
    createdByAdmin: 'CareNest HQ Admin',
  },
  {
    id: 'aff-4',
    creatorPartnerId: 'CN-CR-1004',
    name: 'Kritika Basnet',
    email: 'kritika@creator.carenest.np',
    phone: '+977 984-770-3102',
    handle: '@kritika.beauty',
    tiktokHandle: '@kritika_ktm',
    deliveryAddress: 'Baneshwor-10, Kathmandu, Nepal',
    referralCode: 'KRITIKA3',
    passcodeHash: hashSecret('Kriti#2026'),
    tierPct: 3,
    clicks: 340,
    orders: 9,
    grossSalesNpr: 14200,
    payableCommissionNpr: 426,
    payoutChannel: 'eSewa',
    status: 'Pending Review',
    createdAt: 'Nov 14, 2026',
    createdByAdmin: 'CareNest HQ Admin',
  },
];

const ADMIN_CREDENTIAL = {
  id: 'CN-ADMIN-HQ',
  email: 'admin@carenest.com.np',
  passcodeHash: hashSecret(process.env.CARENEST_ADMIN_PASSCODE || 'CareNestAdmin#2026'),
};

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '25mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true, hasApiKey: Boolean(process.env.GEMINI_API_KEY) });
  });

  app.post('/api/auth/shopper/signup', (req: Request, res: Response) => {
    const {
      fullName,
      email,
      phone,
      city,
      address,
      skinFocus,
      preferredPayment,
      password,
    } = req.body || {};

    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const cleanPhone = typeof phone === 'string' ? phone.trim() : '';
    const cleanName = typeof fullName === 'string' ? fullName.trim() : '';
    const cleanAddr = typeof address === 'string' ? address.trim() : '';

    if (!cleanName || !cleanEmail || !cleanPhone || !cleanAddr || typeof password !== 'string' || password.length < 8) {
      res.status(400).json({ error: 'All shopper profile fields and an 8+ character password are required.' });
      return;
    }

    if (cleanEmail === 'admin@carenest.com.np' || cleanEmail === 'admin@carenest.np') {
      res.status(403).json({ error: 'This email address is reserved.' });
      return;
    }

    const exists = SHOPPER_STORE.some(
      (s) => s.email === cleanEmail || s.phone.replace(/\D/g, '') === cleanPhone.replace(/\D/g, '')
    );
    if (exists) {
      res.status(409).json({ error: 'An account with this email or mobile number already exists. Please sign in.' });
      return;
    }

    const created: StoredShopper = {
      id: `shp-${Date.now()}`,
      fullName: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      city: typeof city === 'string' && city.trim() ? city.trim() : 'Lalitpur',
      address: cleanAddr,
      skinFocus: typeof skinFocus === 'string' && skinFocus.trim() ? skinFocus.trim() : 'UV & Melasma Protection',
      preferredPayment:
        preferredPayment === 'Khalti' ||
        preferredPayment === 'Fonepay QR' ||
        preferredPayment === 'Card' ||
        preferredPayment === 'COD'
          ? preferredPayment
          : 'eSewa',
      memberSince: 'Nov 2026',
      passwordHash: hashSecret(password),
    };
    SHOPPER_STORE.push(created);

    res.status(201).json({
      token: `shp-tok-${crypto.randomBytes(16).toString('hex')}`,
      profile: {
        fullName: created.fullName,
        email: created.email,
        phone: created.phone,
        city: created.city,
        address: created.address,
        skinFocus: created.skinFocus,
        preferredPayment: created.preferredPayment,
        memberSince: created.memberSince,
      },
    });
  });

  app.post('/api/auth/shopper/signin', (req: Request, res: Response) => {
    const { identifier, password } = req.body || {};
    const cleanId = typeof identifier === 'string' ? identifier.trim().toLowerCase() : '';
    const digits = cleanId.replace(/\D/g, '');
    if (!cleanId || typeof password !== 'string') {
      res.status(400).json({ error: 'Email or Nepal phone and password are required.' });
      return;
    }

    const matched = SHOPPER_STORE.find(
      (s) => s.email === cleanId || (digits.length >= 10 && s.phone.replace(/\D/g, '').endsWith(digits.slice(-10)))
    );
    if (!matched || !verifySecret(password, matched.passwordHash)) {
      res.status(401).json({ error: 'Invalid email/mobile number or password.' });
      return;
    }

    res.json({
      token: `shp-tok-${crypto.randomBytes(16).toString('hex')}`,
      profile: {
        fullName: matched.fullName,
        email: matched.email,
        phone: matched.phone,
        city: matched.city,
        address: matched.address,
        skinFocus: matched.skinFocus,
        preferredPayment: matched.preferredPayment,
        memberSince: matched.memberSince,
      },
    });
  });

  app.post('/api/auth/creator/signin', (req: Request, res: Response) => {
    const { creatorPartnerId, passcode } = req.body || {};
    const rawId = typeof creatorPartnerId === 'string' ? creatorPartnerId.trim() : '';
    const normalizedId = rawId.toUpperCase();
    const normalizedLower = rawId.toLowerCase();
    const cleanPass = typeof passcode === 'string' ? passcode.trim() : '';

    if (!rawId || !cleanPass) {
      res.status(400).json({ error: 'Creator Partner ID (or Creator Email) and passcode are required.' });
      return;
    }

    const matched = CREATOR_PARTNER_STORE.find(
      (c) =>
        c.creatorPartnerId.toUpperCase() === normalizedId ||
        (c.email && c.email.toLowerCase() === normalizedLower)
    );
    if (!matched) {
      res.status(401).json({
        error: 'Creator Partner ID not found. Only CareNest Admin can create Creator Partner IDs.',
      });
      return;
    }
    if (matched.status === 'Suspended') {
      res.status(403).json({ error: 'This Creator Partner ID has been suspended by CareNest Admin.' });
      return;
    }
    if (matched.status === 'Pending Review') {
      res.status(403).json({ error: 'This Creator Partner ID is awaiting CareNest Admin activation.' });
      return;
    }
    if (!verifySecret(cleanPass, matched.passcodeHash)) {
      res.status(401).json({ error: 'Invalid passcode for this Creator Partner ID.' });
      return;
    }

    const { passcodeHash: _omitted, ...safeAffiliate } = matched;
    res.json({
      token: `cr-tok-${crypto.randomBytes(16).toString('hex')}`,
      affiliate: safeAffiliate,
    });
  });

  app.post('/api/auth/admin/signin', (req: Request, res: Response) => {
    const { identifier, passcode } = req.body || {};
    const cleanId = typeof identifier === 'string' ? identifier.trim().toLowerCase() : '';
    const cleanPass = typeof passcode === 'string' ? passcode.trim() : '';
    if (!cleanId || !cleanPass) {
      res.status(400).json({ error: 'CareNest Admin ID/email and passcode are required.' });
      return;
    }

    const idMatch =
      cleanId === ADMIN_CREDENTIAL.email.toLowerCase() ||
      cleanId === 'admin@carenest.np' ||
      cleanId === 'carenest-admin' ||
      cleanId.toUpperCase() === ADMIN_CREDENTIAL.id;
    if (!idMatch || !verifySecret(cleanPass, ADMIN_CREDENTIAL.passcodeHash)) {
      res.status(401).json({ error: 'Invalid CareNest Admin credentials.' });
      return;
    }

    res.json({
      token: `adm-tok-${crypto.randomBytes(16).toString('hex')}`,
      adminEmail: ADMIN_CREDENTIAL.email,
    });
  });

  app.post('/api/admin/creators', (req: Request, res: Response) => {
    const {
      creatorPartnerId,
      name,
      email,
      phone,
      handle,
      tiktokHandle,
      deliveryAddress,
      referralCode,
      passcode,
      tierPct,
      payoutChannel,
    } = req.body || {};

    const cleanPartnerId = typeof creatorPartnerId === 'string' ? creatorPartnerId.trim().toUpperCase() : '';
    const cleanCode = typeof referralCode === 'string' ? referralCode.trim().toUpperCase() : '';
    const cleanPass = typeof passcode === 'string' ? passcode.trim() : '';
    const cleanName = typeof name === 'string' ? name.trim() : '';

    if (!cleanPartnerId || !cleanName || !cleanCode || cleanPass.length < 6) {
      res.status(400).json({ error: 'Partner ID, creator name, referral code, and 6+ character passcode are required.' });
      return;
    }

    if (CREATOR_PARTNER_STORE.some((c) => c.creatorPartnerId.toUpperCase() === cleanPartnerId)) {
      res.status(409).json({ error: `Creator Partner ID ${cleanPartnerId} is already assigned.` });
      return;
    }

    const cappedTier = Math.min(99, Math.max(1, Number(tierPct) || 5));
    const newPartner: StoredCreatorPartner = {
      id: `aff-${Date.now()}`,
      creatorPartnerId: cleanPartnerId,
      name: cleanName,
      email: typeof email === 'string' ? email.trim().toLowerCase() : '',
      phone: typeof phone === 'string' ? phone.trim() : '',
      handle: typeof handle === 'string' && handle.trim() ? handle.trim() : `@${cleanCode.toLowerCase()}`,
      tiktokHandle: typeof tiktokHandle === 'string' ? tiktokHandle.trim() : '',
      deliveryAddress: typeof deliveryAddress === 'string' && deliveryAddress.trim() ? deliveryAddress.trim() : 'Kathmandu, Nepal',
      referralCode: cleanCode,
      passcodeHash: hashSecret(cleanPass),
      tierPct: cappedTier,
      clicks: 0,
      orders: 0,
      grossSalesNpr: 0,
      payableCommissionNpr: 0,
      payoutChannel: payoutChannel === 'Khalti' ? 'Khalti' : 'eSewa',
      status: 'Active',
      createdAt: 'Nov 18, 2026',
      createdByAdmin: 'CareNest HQ Admin',
    };
    CREATOR_PARTNER_STORE.unshift(newPartner);
    const { passcodeHash: _omitted, ...safeAffiliate } = newPartner;
    res.status(201).json({ affiliate: safeAffiliate });
  });

  app.patch('/api/admin/creators/:partnerId', (req: Request, res: Response) => {
    const targetId = req.params.partnerId.trim().toUpperCase();
    const idx = CREATOR_PARTNER_STORE.findIndex(
      (c) => c.creatorPartnerId.toUpperCase() === targetId
    );
    if (idx === -1) {
      res.status(404).json({ error: 'Creator Partner ID not found.' });
      return;
    }
    const { status, tierPct, passcode } = req.body || {};
    if (status === 'Active' || status === 'Pending Review' || status === 'Suspended') {
      CREATOR_PARTNER_STORE[idx].status = status;
    }
    if (typeof tierPct === 'number') {
      CREATOR_PARTNER_STORE[idx].tierPct = Math.min(99, Math.max(1, tierPct));
    }
    if (typeof passcode === 'string' && passcode.trim().length >= 6) {
      CREATOR_PARTNER_STORE[idx].passcodeHash = hashSecret(passcode.trim());
    }
    const { passcodeHash: _omitted, ...safeAffiliate } = CREATOR_PARTNER_STORE[idx];
    res.json({ affiliate: safeAffiliate });
  });

  type GatewayMethod = 'eSewa' | 'Khalti' | 'Fonepay QR' | 'Card';

  interface PaymentSession {
    transactionUuid: string;
    method: GatewayMethod;
    amountNpr: number;
    customerName: string;
    customerPhone: string;
    gatewayMode: 'Live' | 'Sandbox';
    signature?: string;
    pidx?: string;
    qrPayload?: string;
    status: 'Pending' | 'Paid';
    referenceCode?: string;
    createdAt: string;
  }

  const PAYMENT_SESSIONS = new Map<string, PaymentSession>();

  app.get('/api/payments/config', (_req: Request, res: Response) => {
    res.json({
      merchant: 'CareNest Pvt. Ltd. (Skin AID)',
      currency: 'NPR',
      gateways: {
        eSewa: {
          mode: process.env.ESEWA_SECRET_KEY ? 'Live' : 'Sandbox',
          merchantCode: process.env.ESEWA_MERCHANT_CODE || 'EPAYTEST',
        },
        Khalti: {
          mode: process.env.KHALTI_SECRET_KEY ? 'Live' : 'Sandbox',
        },
        'Fonepay QR': {
          mode: process.env.FONEPAY_MERCHANT_ID ? 'Live' : 'Sandbox',
          merchantId: process.env.FONEPAY_MERCHANT_ID || 'FP-CARENEST-NP',
        },
        Card: {
          mode: 'Sandbox',
          networks: ['Visa', 'Mastercard', 'NepalPay Card'],
        },
      },
    });
  });

  app.post('/api/payments/initiate', async (req: Request, res: Response) => {
    const { method, amountNpr, customerName, customerPhone } = req.body || {};
    const validMethod: GatewayMethod | null =
      method === 'eSewa' ||
      method === 'Khalti' ||
      method === 'Fonepay QR' ||
      method === 'Card'
        ? method
        : null;

    const cleanAmount = Math.round(Number(amountNpr));
    if (!validMethod || !Number.isFinite(cleanAmount) || cleanAmount <= 0) {
      res.status(400).json({ error: 'Valid payment method and NPR amount are required.' });
      return;
    }

    const randSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const transactionUuid = `CN-${Date.now().toString().slice(-6)}-${randSuffix}`;

    if (validMethod === 'eSewa') {
      const merchantCode = process.env.ESEWA_MERCHANT_CODE || 'EPAYTEST';
      const secretKey = process.env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q';
      const gatewayMode: 'Live' | 'Sandbox' = process.env.ESEWA_SECRET_KEY
        ? 'Live'
        : 'Sandbox';
      const signPayload = `total_amount=${cleanAmount},transaction_uuid=${transactionUuid},product_code=${merchantCode}`;
      const signature = crypto
        .createHmac('sha256', secretKey)
        .update(signPayload)
        .digest('base64');

      const session: PaymentSession = {
        transactionUuid,
        method: 'eSewa',
        amountNpr: cleanAmount,
        customerName: typeof customerName === 'string' ? customerName : 'CareNest Customer',
        customerPhone: typeof customerPhone === 'string' ? customerPhone : '',
        gatewayMode,
        signature,
        status: 'Pending',
        createdAt: new Date().toISOString(),
      };
      PAYMENT_SESSIONS.set(transactionUuid, session);
      res.status(201).json({
        transactionUuid,
        method: 'eSewa',
        amountNpr: cleanAmount,
        gatewayMode,
        merchantCode,
        signature,
      });
      return;
    }

    if (validMethod === 'Khalti') {
      let pidx = `khl_pidx_${crypto.randomBytes(6).toString('hex')}`;
      let gatewayMode: 'Live' | 'Sandbox' = 'Sandbox';

      if (process.env.KHALTI_SECRET_KEY) {
        try {
          const khRes = await fetch('https://a.khalti.com/api/v2/epayment/initiate/', {
            method: 'POST',
            headers: {
              Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              return_url: `${process.env.APP_URL || 'http://localhost:3000'}/?payment=verify`,
              website_url: process.env.APP_URL || 'http://localhost:3000',
              amount: cleanAmount * 100,
              purchase_order_id: transactionUuid,
              purchase_order_name: 'Skin AID by CareNest Order',
              customer_info: {
                name: typeof customerName === 'string' ? customerName : 'CareNest Shopper',
                phone: typeof customerPhone === 'string' ? customerPhone : '9800000000',
              },
            }),
          });
          if (khRes.ok) {
            const khData = (await khRes.json()) as { pidx?: string };
            if (khData?.pidx) {
              pidx = khData.pidx;
              gatewayMode = 'Live';
            }
          }
        } catch {
          // Retain sandbox fallback if live endpoint unreachable
        }
      }

      const session: PaymentSession = {
        transactionUuid,
        method: 'Khalti',
        amountNpr: cleanAmount,
        customerName: typeof customerName === 'string' ? customerName : 'CareNest Customer',
        customerPhone: typeof customerPhone === 'string' ? customerPhone : '',
        gatewayMode,
        pidx,
        status: 'Pending',
        createdAt: new Date().toISOString(),
      };
      PAYMENT_SESSIONS.set(transactionUuid, session);
      res.status(201).json({
        transactionUuid,
        method: 'Khalti',
        amountNpr: cleanAmount,
        gatewayMode,
        pidx,
      });
      return;
    }

    if (validMethod === 'Fonepay QR') {
      const merchantId = process.env.FONEPAY_MERCHANT_ID || 'FP-CARENEST-NP';
      const gatewayMode: 'Live' | 'Sandbox' = process.env.FONEPAY_MERCHANT_ID
        ? 'Live'
        : 'Sandbox';
      const qrPayload = `FONEPAY|MERCHANT:${merchantId}|NAME:CareNest Skin AID|TXN:${transactionUuid}|AMT:NPR ${cleanAmount}`;
      const session: PaymentSession = {
        transactionUuid,
        method: 'Fonepay QR',
        amountNpr: cleanAmount,
        customerName: typeof customerName === 'string' ? customerName : 'CareNest Customer',
        customerPhone: typeof customerPhone === 'string' ? customerPhone : '',
        gatewayMode,
        qrPayload,
        status: 'Pending',
        createdAt: new Date().toISOString(),
      };
      PAYMENT_SESSIONS.set(transactionUuid, session);
      res.status(201).json({
        transactionUuid,
        method: 'Fonepay QR',
        amountNpr: cleanAmount,
        gatewayMode,
        merchantId,
        qrPayload,
      });
      return;
    }

    // Card (Visa / Mastercard 3D-Secure)
    const session: PaymentSession = {
      transactionUuid,
      method: 'Card',
      amountNpr: cleanAmount,
      customerName: typeof customerName === 'string' ? customerName : 'CareNest Customer',
      customerPhone: typeof customerPhone === 'string' ? customerPhone : '',
      gatewayMode: 'Sandbox',
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };
    PAYMENT_SESSIONS.set(transactionUuid, session);
    res.status(201).json({
      transactionUuid,
      method: 'Card',
      amountNpr: cleanAmount,
      gatewayMode: 'Sandbox',
    });
  });

  app.post('/api/payments/verify', (req: Request, res: Response) => {
    const {
      transactionUuid,
      method,
      amountNpr,
      walletNumber,
      pinOrOtp,
      cardNumber,
      cardExpiry,
      cardCvv,
    } = req.body || {};

    const cleanUuid =
      typeof transactionUuid === 'string' ? transactionUuid.trim() : '';
    const existing = cleanUuid ? PAYMENT_SESSIONS.get(cleanUuid) : undefined;
    const resolvedMethod: GatewayMethod =
      existing?.method ||
      (method === 'Khalti' || method === 'Fonepay QR' || method === 'Card'
        ? method
        : 'eSewa');

    if (resolvedMethod === 'eSewa' || resolvedMethod === 'Khalti') {
      const walletDigits =
        typeof walletNumber === 'string' ? walletNumber.replace(/\D/g, '') : '';
      const cleanOtp = typeof pinOrOtp === 'string' ? pinOrOtp.trim() : '';
      if (walletDigits.length < 10) {
        res.status(400).json({ error: `Enter a valid 10-digit ${resolvedMethod} ID mobile number.` });
        return;
      }
      if (cleanOtp.length < 4) {
        res.status(400).json({ error: 'Enter your 4-6 digit MPIN / OTP confirmation code.' });
        return;
      }
    }

    if (resolvedMethod === 'Card') {
      const digits =
        typeof cardNumber === 'string' ? cardNumber.replace(/\D/g, '') : '';
      const cleanExp = typeof cardExpiry === 'string' ? cardExpiry.trim() : '';
      const cleanCvv = typeof cardCvv === 'string' ? cardCvv.replace(/\D/g, '') : '';
      if (digits.length < 13 || digits.length > 19) {
        res.status(400).json({ error: 'Enter a valid 13–19 digit debit or credit card number.' });
        return;
      }
      if (!/^\d{2}\/\d{2}$/.test(cleanExp)) {
        res.status(400).json({ error: 'Enter card expiry in MM/YY format.' });
        return;
      }
      if (cleanCvv.length < 3 || cleanCvv.length > 4) {
        res.status(400).json({ error: 'Enter a valid 3 or 4 digit security CVV.' });
        return;
      }
    }

    const prefix =
      resolvedMethod === 'eSewa'
        ? 'ESW'
        : resolvedMethod === 'Khalti'
        ? 'KHL'
        : resolvedMethod === 'Fonepay QR'
        ? 'FPY'
        : 'CRD';
    const referenceCode = `${prefix}-${Math.floor(1000000 + Math.random() * 8999999)}`;

    if (existing) {
      existing.status = 'Paid';
      existing.referenceCode = referenceCode;
    }

    res.json({
      status: 'Paid',
      method: resolvedMethod,
      transactionUuid: cleanUuid || `CN-${Date.now()}`,
      referenceCode,
      gatewayMode: existing?.gatewayMode || 'Sandbox',
      amountNpr: existing?.amountNpr || Number(amountNpr) || 0,
      verifiedAt: new Date().toISOString(),
    });
  });

  app.post('/api/gemini/chat', async (req: Request, res: Response) => {
    try {
      const {
        message,
        history = [],
        mode = 'general',
        portalContext = 'store',
      } = req.body as {
        message?: string;
        history?: Array<{ role: 'user' | 'model'; text: string }>;
        mode?: ChatMode;
        portalContext?: PortalContext;
      };

      if (!message || typeof message !== 'string' || !message.trim()) {
        res.status(400).json({ error: 'A non-empty message is required.' });
        return;
      }

      const safeMode: ChatMode = MODEL_BY_MODE[mode] ? mode : 'general';
      const safePortal: PortalContext =
        portalContext === 'shopper' ||
        portalContext === 'creator' ||
        portalContext === 'admin'
          ? portalContext
          : 'store';

      const model = MODEL_BY_MODE[safeMode];
      const thinkingLevel = THINKING_BY_MODE[safeMode];
      const systemInstruction = buildSystemInstruction(safePortal, safeMode);

      const formattedHistory = Array.isArray(history)
        ? history
            .filter(
              (item) =>
                (item?.role === 'user' || item?.role === 'model') &&
                typeof item?.text === 'string' &&
                item.text.trim().length > 0
            )
            .slice(-20)
            .map((item) => ({
              role: item.role,
              parts: [{ text: item.text }],
            }))
        : [];

      const ai = getAiClient();
      const response = await withTransientRetry(async () => {
        const chat = ai.chats.create({
          model,
          history: formattedHistory,
          config: {
            systemInstruction,
            thinkingConfig: { thinkingLevel },
          },
        });
        return chat.sendMessage({ message: message.trim() });
      });

      const replyText = response.text?.trim();
      if (!replyText) {
        res.status(502).json({
          error: `Model ${model} returned an empty response.`,
        });
        return;
      }

      res.json({
        reply: replyText,
        model,
        mode: safeMode,
      });
    } catch (error) {
      const parsed = parseGeminiError(error);
      res.status(parsed.status).json({ error: parsed.message });
    }
  });

  app.post('/api/gemini/transcribe', async (req: Request, res: Response) => {
    try {
      const { audioBase64, mimeType } = req.body as {
        audioBase64?: string;
        mimeType?: string;
      };

      if (!audioBase64 || typeof audioBase64 !== 'string') {
        res.status(400).json({ error: 'audioBase64 payload is required.' });
        return;
      }

      const normalizedMime =
        typeof mimeType === 'string' && mimeType.startsWith('audio/')
          ? mimeType.split(';')[0]
          : 'audio/webm';

      const ai = getAiClient();
      const response = await withTransientRetry(() =>
        ai.models.generateContent({
          model: 'gemini-3.5-transcribe',
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: normalizedMime,
                  data: audioBase64,
                },
              },
              {
                text: 'Transcribe this spoken audio accurately. Preserve any CareNest, SkinAid, Phytomax, eSewa, Khalti, or skincare ingredient names. Output only the clean transcript.',
              },
            ],
          },
        })
      );

      res.json({
        transcript: response.text?.trim() ?? '',
        model: 'gemini-3.5-transcribe',
      });
    } catch (error) {
      const parsed = parseGeminiError(error);
      res.status(parsed.status).json({ error: parsed.message });
    }
  });

  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('/{*splat}', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/live' });

  wss.on('connection', async (clientWs: WebSocket, req) => {
    let liveSession: Awaited<ReturnType<GoogleGenAI['live']['connect']>> | null =
      null;
    let isClosed = false;

    const sendSafe = (payload: Record<string, unknown>) => {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify(payload));
      }
    };

    try {
      const reqUrl = new URL(req.url ?? '/live', 'http://localhost:3000');
      const portalParam = reqUrl.searchParams.get('portal');
      const portalContext: PortalContext =
        portalParam === 'shopper' ||
        portalParam === 'creator' ||
        portalParam === 'admin'
          ? portalParam
          : 'store';

      const ai = getAiClient();
      liveSession = await ai.live.connect({
        model: 'gemini-3.8-live',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Zephyr' },
            },
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: buildSystemInstruction(portalContext, 'live'),
        },
        callbacks: {
          onopen: () => {
            sendSafe({ ready: true, model: 'gemini-3.8-live', portalContext });
          },
          onmessage: (message: LiveServerMessage) => {
            const content = message.serverContent;
            for (const part of content?.modelTurn?.parts ?? []) {
              if (part.inlineData?.data) {
                sendSafe({ audio: part.inlineData.data });
              }
            }
            if (content?.inputTranscription?.text) {
              sendSafe({ inputTranscript: content.inputTranscription.text });
            }
            if (content?.outputTranscription?.text) {
              sendSafe({ outputTranscript: content.outputTranscription.text });
            }
            if (content?.interrupted) {
              sendSafe({ interrupted: true });
            }
            if (content?.turnComplete) {
              sendSafe({ turnComplete: true });
            }
          },
          onerror: (err) => {
            const parsed = parseGeminiError(err);
            sendSafe({ error: parsed.message });
          },
          onclose: () => {
            if (!isClosed) {
              sendSafe({ closed: true });
            }
          },
        },
      });
    } catch (error) {
      const parsed = parseGeminiError(error);
      sendSafe({ error: parsed.message });
      clientWs.close();
      return;
    }

    clientWs.on('message', (rawData) => {
      if (!liveSession || isClosed) return;
      try {
        const payload = JSON.parse(rawData.toString()) as {
          audio?: string;
          text?: string;
        };
        if (payload.audio) {
          liveSession.sendRealtimeInput({
            audio: { data: payload.audio, mimeType: 'audio/pcm;rate=16000' },
          });
        } else if (payload.text && payload.text.trim()) {
          liveSession.sendRealtimeInput({
            text: payload.text.trim(),
          });
        }
      } catch (err) {
        const parsed = parseGeminiError(err);
        sendSafe({ error: parsed.message });
      }
    });

    clientWs.on('close', () => {
      isClosed = true;
      if (liveSession) {
        try {
          liveSession.close();
        } catch {
          // Ignore double-close
        }
        liveSession = null;
      }
    });
  });

  const PORT = Number(process.env.PORT) || 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`CareNest full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start CareNest server:', err);
  process.exit(1);
});
