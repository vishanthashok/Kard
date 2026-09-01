/**
 * Kard frontend contract types.
 *
 * These interfaces describe the shapes the frontend expects from the Kard API.
 * They are intentionally independent of the mock data in `lib/mock-data.ts` so
 * that swapping the mock implementation in `lib/api-client.ts` for real network
 * calls requires no component changes.
 *
 * Entity types mirror expected backend records. "View" types are read models
 * the UI renders; if the backend does not return them directly, the API client
 * is responsible for composing them.
 */

export type Id = string;

/** ISO-8601 timestamp, e.g. "2026-08-28T15:04:05.000Z". */
export type IsoDateTime = string;

/* -------------------------------------------------------------------------- */
/* Entities                                                                    */
/* -------------------------------------------------------------------------- */

export interface User {
  id: Id;
  /** Human readable name shown in the app and on the merchant scanner. */
  fullName: string;
  firstName: string;
  email: string;
  /** Public facing member identifier printed under the customer QR code. */
  memberId: string;
  avatarUrl: string | null;
  joinedAt: IsoDateTime;
  homeCity: string;
}

export type MerchantCategory =
  | "Coffee"
  | "Burgers"
  | "Tacos"
  | "Breakfast"
  | "Bakery"
  | "Pizza"
  | "Juice"
  | "Sandwiches";

export interface Merchant {
  id: Id;
  slug: string;
  name: string;
  category: MerchantCategory;
  tagline: string;
  /** Short monogram rendered when no logo image is available. */
  logoText: string;
  logoUrl: string | null;
  /** Brand tint used for the merchant avatar background (CSS color). */
  brandColor: string;
  /**
   * Display-only earning rate. Authoritative point math always happens on the
   * backend — this value is used for "earn 1 pt / $1" style copy.
   */
  pointsPerDollar: number;
  locationCount: number;
}

export interface Location {
  id: Id;
  merchantId: Id;
  name: string;
  addressLine1: string;
  city: string;
  region: string;
  postalCode: string;
  /** Straight line distance from the user, when the API knows the position. */
  distanceMiles: number | null;
  hours: string;
}

export interface Wallet {
  id: Id;
  userId: Id;
  merchantId: Id;
  pointsBalance: number;
  lifetimePoints: number;
  visitCount: number;
  lastActivityAt: IsoDateTime;
}

export type PointTransactionType = "earn" | "redeem" | "adjustment";

export interface PointTransaction {
  id: Id;
  walletId: Id;
  merchantId: Id;
  locationId: Id | null;
  type: PointTransactionType;
  /** Positive for earning, negative for redemptions. */
  pointsDelta: number;
  /** Purchase amount in cents, null for redemptions and adjustments. */
  amountCents: number | null;
  description: string;
  createdAt: IsoDateTime;
}

export interface Reward {
  id: Id;
  merchantId: Id;
  name: string;
  description: string;
  pointsRequired: number;
  isActive: boolean;
  createdAt: IsoDateTime;
}

export type RedemptionStatus = "pending" | "completed" | "cancelled";

export interface Redemption {
  id: Id;
  rewardId: Id;
  walletId: Id;
  merchantId: Id;
  userId: Id;
  pointsSpent: number;
  status: RedemptionStatus;
  redeemedAt: IsoDateTime;
}

export interface MerchantCustomer {
  id: Id;
  merchantId: Id;
  userId: Id;
  displayName: string;
  pointsBalance: number;
  visitCount: number;
  lifetimePoints: number;
  rewardsRedeemed: number;
  lastVisitAt: IsoDateTime;
}

/* -------------------------------------------------------------------------- */
/* Read models                                                                 */
/* -------------------------------------------------------------------------- */

/** A wallet joined with its merchant and progress toward the next reward. */
export interface WalletSummary {
  wallet: Wallet;
  merchant: Merchant;
  nextReward: Reward | null;
  /** Points still needed for `nextReward`, 0 when it is already unlocked. */
  pointsToNextReward: number;
  /** 0-100, clamped. */
  progressPercent: number;
}

/** A reward joined with the customer balance that unlocks it. */
export interface RewardProgress {
  reward: Reward;
  merchant: Merchant;
  pointsBalance: number;
  pointsRemaining: number;
  isUnlocked: boolean;
}

/** A transaction joined with the merchant it belongs to (customer facing). */
export interface TransactionView {
  transaction: PointTransaction;
  merchant: Merchant;
}

/** A transaction joined with the customer who made it (merchant facing). */
export interface MerchantTransactionView {
  transaction: PointTransaction;
  customerName: string;
}

export interface MerchantDetail {
  merchant: Merchant;
  wallet: Wallet | null;
  nextReward: Reward | null;
  rewards: RewardProgress[];
  recentTransactions: TransactionView[];
  locations: Location[];
}

export interface NearbyMerchant {
  merchant: Merchant;
  location: Location;
  distanceMiles: number;
  featuredReward: Reward | null;
  /** True when the signed-in customer already has a wallet here. */
  hasWallet: boolean;
}

export interface MerchantDashboardStats {
  customers: number;
  customersDeltaPercent: number;
  transactions: number;
  transactionsDeltaPercent: number;
  pointsIssued: number;
  pointsIssuedDeltaPercent: number;
  rewardsRedeemed: number;
  rewardsRedeemedDeltaPercent: number;
}

export interface PopularReward {
  reward: Reward;
  redemptionCount: number;
  /** Share of all redemptions for the period, 0-100. */
  sharePercent: number;
}

export type DashboardPeriod = "today" | "week" | "month";

export interface MerchantDashboard {
  merchant: Merchant;
  period: DashboardPeriod;
  stats: MerchantDashboardStats;
  recentCustomers: MerchantCustomer[];
  recentTransactions: MerchantTransactionView[];
  popularRewards: PopularReward[];
}

/** Everything the merchant scanner shows after reading a customer QR code. */
export interface ScannedCustomer {
  user: User;
  merchant: Merchant;
  wallet: Wallet;
  rewards: RewardProgress[];
  recentTransactions: PointTransaction[];
}

export interface MerchantCustomerDetail {
  customer: MerchantCustomer;
  recentTransactions: PointTransaction[];
  redemptions: Redemption[];
}

/* -------------------------------------------------------------------------- */
/* Requests                                                                    */
/* -------------------------------------------------------------------------- */

export interface AwardPointsRequest {
  merchantId: Id;
  locationId: Id | null;
  /** Raw value decoded from the customer QR code. */
  customerQrToken: string;
  amountCents: number;
  /**
   * Idempotency key for the register. The backend enforces uniqueness per
   * merchant, so a retried award never double-credits.
   */
  externalReference?: string | null;
}

export interface AwardPointsResult {
  transaction: PointTransaction;
  pointsAwarded: number;
  newBalance: number;
}

export interface RedeemRewardRequest {
  merchantId: Id;
  rewardId: Id;
  /**
   * Redemption is authorised by the scanned code, not by a wallet id — the
   * server resolves the token to a customer and locks their wallet.
   */
  customerQrToken: string;
  locationId?: Id | null;
}

export interface RedeemRewardResult {
  redemption: Redemption;
  pointsSpent: number;
  newBalance: number;
}

export interface CreateRewardRequest {
  merchantId: Id;
  name: string;
  description: string;
  pointsRequired: number;
  isActive: boolean;
}

/* -------------------------------------------------------------------------- */
/* Errors                                                                      */
/* -------------------------------------------------------------------------- */

export type KardErrorCode =
  | "not_found"
  | "invalid_qr"
  | "insufficient_points"
  | "validation_failed"
  | "unauthorized"
  | "network_error"
  | "unknown";

export class KardApiError extends Error {
  readonly code: KardErrorCode;

  constructor(code: KardErrorCode, message: string) {
    super(message);
    this.name = "KardApiError";
    this.code = code;
  }
}

/* -------------------------------------------------------------------------- */
/* Client contract                                                             */
/* -------------------------------------------------------------------------- */

/**
 * The surface every Kard API implementation must provide. The mock client in
 * `lib/api-client.ts` satisfies this today; the HTTP client that talks to the
 * real backend must satisfy the exact same interface.
 */
export interface KardApiClient {
  getCurrentUser(): Promise<User>;
  getCurrentMerchant(): Promise<Merchant>;
  getWallets(userId: Id): Promise<WalletSummary[]>;
  getTransactions(userId: Id, options?: { merchantId?: Id; limit?: number }): Promise<TransactionView[]>;
  getRewards(userId: Id): Promise<RewardProgress[]>;
  getMerchants(): Promise<Merchant[]>;
  getMerchantDetail(userId: Id, merchantId: Id): Promise<MerchantDetail>;
  getNearbyMerchants(userId: Id): Promise<NearbyMerchant[]>;
  getCustomerQrToken(userId: Id): Promise<string>;
  getMerchantDashboard(merchantId: Id, period: DashboardPeriod): Promise<MerchantDashboard>;
  getMerchantRewards(merchantId: Id): Promise<Reward[]>;
  getMerchantCustomers(merchantId: Id, search?: string): Promise<MerchantCustomer[]>;
  getMerchantCustomerDetail(merchantId: Id, customerId: Id): Promise<MerchantCustomerDetail>;
  getCustomerByQR(merchantId: Id, qrToken: string): Promise<ScannedCustomer>;
  awardPoints(request: AwardPointsRequest): Promise<AwardPointsResult>;
  redeemReward(request: RedeemRewardRequest): Promise<RedeemRewardResult>;
  createReward(request: CreateRewardRequest): Promise<Reward>;
}
