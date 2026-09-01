/**
 * Kard API client.
 *
 * Every screen reads its data through this module. Today each function resolves
 * mock data from `lib/mock-data.ts`; each one is marked with a TODO showing the
 * request the real Kard backend will serve. Swapping in the real API means
 * replacing the bodies here — no component changes required.
 *
 * Conventions the real implementation must keep:
 *   - functions are async and reject with `KardApiError` on failure;
 *   - read models (`WalletSummary`, `RewardProgress`, ...) are composed here if
 *     the backend returns raw rows;
 *   - no mock value ever leaks out of this file except through these functions.
 */

import {
  KardApiError,
  type KardApiClient,
  type AwardPointsRequest,
  type AwardPointsResult,
  type CreateRewardRequest,
  type DashboardPeriod,
  type Id,
  type Merchant,
  type MerchantCustomer,
  type MerchantCustomerDetail,
  type MerchantDashboard,
  type MerchantDetail,
  type MerchantTransactionView,
  type NearbyMerchant,
  type PointTransaction,
  type Reward,
  type RewardProgress,
  type RedeemRewardRequest,
  type RedeemRewardResult,
  type ScannedCustomer,
  type TransactionView,
  type User,
  type Wallet,
  type WalletSummary,
} from "@/lib/api-types";
import {
  MOCK_CURRENT_MERCHANT_ID,
  MOCK_CURRENT_USER_ID,
  mockDashboardStats,
  mockLocations,
  mockMerchantCustomerTransactions,
  mockMerchantCustomers,
  mockMerchantRedemptions,
  mockMerchantTransactions,
  mockMerchants,
  mockPopularRewards,
  mockRewards,
  mockTransactions,
  mockUsers,
  mockWallets,
} from "@/lib/mock-data";
import { MOCK_DEMO_QR_VALUE, parseMockCustomerQrValue } from "@/lib/mock-qr";

/** Simulated round trip so loading skeletons and pending states are exercised. */
const MOCK_LATENCY_MS = 120;

function delay(ms: number = MOCK_LATENCY_MS): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function requireMerchant(merchantId: Id): Merchant {
  const merchant = mockMerchants.find((item) => item.id === merchantId);
  if (!merchant) {
    throw new KardApiError("not_found", `Merchant ${merchantId} was not found.`);
  }
  return merchant;
}

function requireUser(userId: Id): User {
  const user = mockUsers.find((item) => item.id === userId);
  if (!user) {
    throw new KardApiError("not_found", `User ${userId} was not found.`);
  }
  return user;
}

function byNewest(a: { createdAt: string }, b: { createdAt: string }): number {
  return Date.parse(b.createdAt) - Date.parse(a.createdAt);
}

function progressPercent(balance: number, required: number): number {
  if (required <= 0) return 100;
  return Math.max(0, Math.min(100, Math.round((balance / required) * 100)));
}

function toWalletSummary(wallet: Wallet): WalletSummary {
  const merchant = requireMerchant(wallet.merchantId);
  const activeRewards = mockRewards
    .filter((reward) => reward.merchantId === wallet.merchantId && reward.isActive)
    .sort((a, b) => a.pointsRequired - b.pointsRequired);

  const nextReward =
    activeRewards.find((reward) => reward.pointsRequired > wallet.pointsBalance) ??
    activeRewards.at(-1) ??
    null;

  return {
    wallet,
    merchant,
    nextReward,
    pointsToNextReward: nextReward
      ? Math.max(0, nextReward.pointsRequired - wallet.pointsBalance)
      : 0,
    progressPercent: nextReward
      ? progressPercent(wallet.pointsBalance, nextReward.pointsRequired)
      : 100,
  };
}

function toRewardProgress(reward: Reward, pointsBalance: number): RewardProgress {
  return {
    reward,
    merchant: requireMerchant(reward.merchantId),
    pointsBalance,
    pointsRemaining: Math.max(0, reward.pointsRequired - pointsBalance),
    isUnlocked: pointsBalance >= reward.pointsRequired,
  };
}

function toTransactionView(transaction: PointTransaction): TransactionView {
  return { transaction, merchant: requireMerchant(transaction.merchantId) };
}

function walletFor(userId: Id, merchantId: Id): Wallet | null {
  return (
    mockWallets.find(
      (wallet) => wallet.userId === userId && wallet.merchantId === merchantId,
    ) ?? null
  );
}

/**
 * Balances mutated by the simulated merchant writes, so a scan → award →
 * redeem run inside one browser session stays consistent. Purely in-memory:
 * the real backend owns this state and this map disappears with the mock.
 */
const simulatedBalances = new Map<Id, number>();

function currentBalanceOf(wallet: Wallet): number {
  return simulatedBalances.get(wallet.id) ?? wallet.pointsBalance;
}

/* -------------------------------------------------------------------------- */
/* Session                                                                     */
/* -------------------------------------------------------------------------- */

/** TODO(backend): GET /api/me — resolve the Supabase session user. */
export async function getCurrentUser(): Promise<User> {
  await delay();
  return requireUser(MOCK_CURRENT_USER_ID);
}

/** TODO(backend): GET /api/merchant/me — resolve the merchant from the session. */
export async function getCurrentMerchant(): Promise<Merchant> {
  await delay();
  return requireMerchant(MOCK_CURRENT_MERCHANT_ID);
}

/* -------------------------------------------------------------------------- */
/* Customer reads                                                              */
/* -------------------------------------------------------------------------- */

/** TODO(backend): GET /api/wallets */
export async function getWallets(
  userId: Id = MOCK_CURRENT_USER_ID,
): Promise<WalletSummary[]> {
  await delay();
  return mockWallets
    .filter((wallet) => wallet.userId === userId)
    .map(toWalletSummary)
    .sort(
      (a, b) =>
        Date.parse(b.wallet.lastActivityAt) - Date.parse(a.wallet.lastActivityAt),
    );
}

/** TODO(backend): GET /api/transactions?merchantId=&limit= */
export async function getTransactions(
  userId: Id = MOCK_CURRENT_USER_ID,
  options: { merchantId?: Id; limit?: number } = {},
): Promise<TransactionView[]> {
  await delay();
  const walletIds = new Set(
    mockWallets.filter((wallet) => wallet.userId === userId).map((wallet) => wallet.id),
  );

  const transactions = mockTransactions
    .filter((transaction) => walletIds.has(transaction.walletId))
    .filter(
      (transaction) =>
        !options.merchantId || transaction.merchantId === options.merchantId,
    )
    .sort(byNewest)
    .map(toTransactionView);

  return options.limit ? transactions.slice(0, options.limit) : transactions;
}

/** TODO(backend): GET /api/rewards — every reward the customer can work toward. */
export async function getRewards(
  userId: Id = MOCK_CURRENT_USER_ID,
): Promise<RewardProgress[]> {
  await delay();
  const balances = new Map(
    mockWallets
      .filter((wallet) => wallet.userId === userId)
      .map((wallet) => [wallet.merchantId, wallet.pointsBalance]),
  );

  return mockRewards
    .filter((reward) => reward.isActive && balances.has(reward.merchantId))
    .map((reward) => toRewardProgress(reward, balances.get(reward.merchantId) ?? 0))
    .sort((a, b) => {
      if (a.isUnlocked !== b.isUnlocked) return a.isUnlocked ? -1 : 1;
      return a.pointsRemaining - b.pointsRemaining;
    });
}

/** TODO(backend): GET /api/merchants */
export async function getMerchants(): Promise<Merchant[]> {
  await delay();
  return [...mockMerchants];
}

/** TODO(backend): GET /api/merchants/:id (scoped to the signed-in customer). */
export async function getMerchantDetail(
  userId: Id,
  merchantId: Id,
): Promise<MerchantDetail> {
  await delay();
  const merchant = requireMerchant(merchantId);
  const wallet = walletFor(userId, merchantId);
  const pointsBalance = wallet?.pointsBalance ?? 0;

  const rewards = mockRewards
    .filter((reward) => reward.merchantId === merchantId && reward.isActive)
    .sort((a, b) => a.pointsRequired - b.pointsRequired)
    .map((reward) => toRewardProgress(reward, pointsBalance));

  const nextReward =
    rewards.find((entry) => !entry.isUnlocked)?.reward ?? rewards.at(-1)?.reward ?? null;

  const recentTransactions = wallet
    ? mockTransactions
        .filter((transaction) => transaction.walletId === wallet.id)
        .sort(byNewest)
        .slice(0, 6)
        .map(toTransactionView)
    : [];

  return {
    merchant,
    wallet,
    nextReward,
    rewards,
    recentTransactions,
    locations: mockLocations.filter((location) => location.merchantId === merchantId),
  };
}

/** TODO(backend): GET /api/merchants/nearby?lat=&lng= */
export async function getNearbyMerchants(
  userId: Id = MOCK_CURRENT_USER_ID,
): Promise<NearbyMerchant[]> {
  await delay();
  const walletMerchantIds = new Set(
    mockWallets
      .filter((wallet) => wallet.userId === userId)
      .map((wallet) => wallet.merchantId),
  );

  return mockMerchants
    .map((merchant): NearbyMerchant | null => {
      const location =
        mockLocations.find((entry) => entry.merchantId === merchant.id) ?? null;
      if (!location) return null;

      const featuredReward =
        mockRewards
          .filter((reward) => reward.merchantId === merchant.id && reward.isActive)
          .sort((a, b) => a.pointsRequired - b.pointsRequired)[0] ?? null;

      return {
        merchant,
        location,
        distanceMiles: location.distanceMiles ?? 0,
        featuredReward,
        hasWallet: walletMerchantIds.has(merchant.id),
      };
    })
    .filter((entry): entry is NearbyMerchant => entry !== null)
    .sort((a, b) => a.distanceMiles - b.distanceMiles);
}

/**
 * TODO(backend): GET /api/customer/qr-token — must return a short-lived signed
 * token. The mock value is intentionally static and insecure.
 */
export async function getCustomerQrToken(
  userId: Id = MOCK_CURRENT_USER_ID,
): Promise<string> {
  await delay();
  requireUser(userId);
  return MOCK_DEMO_QR_VALUE;
}

/* -------------------------------------------------------------------------- */
/* Merchant reads                                                              */
/* -------------------------------------------------------------------------- */

/** TODO(backend): GET /api/merchant/dashboard?period= */
export async function getMerchantDashboard(
  merchantId: Id = MOCK_CURRENT_MERCHANT_ID,
  period: DashboardPeriod = "today",
): Promise<MerchantDashboard> {
  await delay();
  const merchant = requireMerchant(merchantId);
  const stats = mockDashboardStats[period] ?? mockDashboardStats.today;

  const recentTransactions: MerchantTransactionView[] = mockMerchantTransactions
    .filter((entry) => entry.transaction.merchantId === merchantId)
    .sort((a, b) => byNewest(a.transaction, b.transaction))
    .slice(0, 6);

  const totalRedemptions = mockPopularRewards.reduce(
    (total, entry) => total + entry.redemptionCount,
    0,
  );

  const popularRewards = mockPopularRewards
    .map((entry) => {
      const reward = mockRewards.find((item) => item.id === entry.rewardId);
      if (!reward || reward.merchantId !== merchantId) return null;
      return {
        reward,
        redemptionCount: entry.redemptionCount,
        sharePercent:
          totalRedemptions > 0
            ? Math.round((entry.redemptionCount / totalRedemptions) * 100)
            : 0,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  return {
    merchant,
    period,
    stats,
    recentCustomers: mockMerchantCustomers
      .filter((customer) => customer.merchantId === merchantId)
      .sort((a, b) => Date.parse(b.lastVisitAt) - Date.parse(a.lastVisitAt))
      .slice(0, 5),
    recentTransactions,
    popularRewards,
  };
}

/** TODO(backend): GET /api/merchant/rewards */
export async function getMerchantRewards(
  merchantId: Id = MOCK_CURRENT_MERCHANT_ID,
): Promise<Reward[]> {
  await delay();
  requireMerchant(merchantId);
  return mockRewards
    .filter((reward) => reward.merchantId === merchantId)
    .sort((a, b) => a.pointsRequired - b.pointsRequired);
}

/** TODO(backend): GET /api/merchant/customers?search= */
export async function getMerchantCustomers(
  merchantId: Id = MOCK_CURRENT_MERCHANT_ID,
  search?: string,
): Promise<MerchantCustomer[]> {
  await delay();
  requireMerchant(merchantId);
  const query = search?.trim().toLowerCase() ?? "";

  return mockMerchantCustomers
    .filter((customer) => customer.merchantId === merchantId)
    .filter((customer) => !query || customer.displayName.toLowerCase().includes(query))
    .sort((a, b) => Date.parse(b.lastVisitAt) - Date.parse(a.lastVisitAt));
}

/** TODO(backend): GET /api/merchant/customers/:id */
export async function getMerchantCustomerDetail(
  merchantId: Id,
  customerId: Id,
): Promise<MerchantCustomerDetail> {
  await delay();
  const customer = mockMerchantCustomers.find(
    (entry) => entry.id === customerId && entry.merchantId === merchantId,
  );
  if (!customer) {
    throw new KardApiError("not_found", `Customer ${customerId} was not found.`);
  }

  return {
    customer,
    recentTransactions: (mockMerchantCustomerTransactions[customerId] ?? [])
      .slice()
      .sort(byNewest),
    redemptions: mockMerchantRedemptions[customerId] ?? [],
  };
}

/**
 * TODO(backend): POST /api/merchant/scan — the server verifies the QR
 * signature, checks it has not expired and returns the customer profile.
 * The mock accepts any well formed `kard://customer/...` string.
 */
export async function getCustomerByQR(
  merchantId: Id,
  qrToken: string,
): Promise<ScannedCustomer> {
  await delay(400);
  const merchant = requireMerchant(merchantId);

  if (parseMockCustomerQrValue(qrToken) === null) {
    throw new KardApiError("invalid_qr", "That code is not a Kard customer code.");
  }

  const user = requireUser(MOCK_CURRENT_USER_ID);
  const storedWallet = walletFor(user.id, merchantId);
  if (!storedWallet) {
    throw new KardApiError("not_found", "This customer has no Kard with you yet.");
  }

  const wallet: Wallet = {
    ...storedWallet,
    pointsBalance: currentBalanceOf(storedWallet),
  };

  const rewards = mockRewards
    .filter((reward) => reward.merchantId === merchantId && reward.isActive)
    .sort((a, b) => a.pointsRequired - b.pointsRequired)
    .map((reward) => toRewardProgress(reward, wallet.pointsBalance));

  return {
    user,
    merchant,
    wallet,
    rewards,
    recentTransactions: mockTransactions
      .filter((transaction) => transaction.walletId === wallet.id)
      .sort(byNewest)
      .slice(0, 4),
  };
}

/* -------------------------------------------------------------------------- */
/* Writes (simulated)                                                          */
/* -------------------------------------------------------------------------- */

/**
 * TODO(backend): POST /api/merchant/award-points.
 *
 * The backend owns the point calculation; the UI must render the returned
 * `pointsAwarded` and `newBalance` rather than anything computed locally. This
 * mock does not persist anything.
 */
export async function awardPoints(
  request: AwardPointsRequest,
): Promise<AwardPointsResult> {
  await delay(500);
  const merchant = requireMerchant(request.merchantId);

  if (parseMockCustomerQrValue(request.customerQrToken) === null) {
    throw new KardApiError("invalid_qr", "That code is not a Kard customer code.");
  }
  if (request.amountCents <= 0) {
    throw new KardApiError("validation_failed", "Enter a purchase amount first.");
  }

  const wallet = walletFor(MOCK_CURRENT_USER_ID, merchant.id);
  if (!wallet) {
    throw new KardApiError("not_found", "This customer has no Kard with you yet.");
  }

  const pointsAwarded = Math.floor((request.amountCents / 100) * merchant.pointsPerDollar);
  const newBalance = currentBalanceOf(wallet) + pointsAwarded;
  simulatedBalances.set(wallet.id, newBalance);

  return {
    pointsAwarded,
    newBalance,
    transaction: {
      id: `txn_mock_${Date.now()}`,
      walletId: wallet.id,
      merchantId: merchant.id,
      locationId: request.locationId,
      type: "earn",
      pointsDelta: pointsAwarded,
      amountCents: request.amountCents,
      description: `$${(request.amountCents / 100).toFixed(2)} purchase`,
      createdAt: new Date().toISOString(),
    },
  };
}

/**
 * TODO(backend): POST /api/merchant/redeem — the server validates the balance
 * and writes the redemption. This mock only simulates a success response.
 */
export async function redeemReward(
  request: RedeemRewardRequest,
): Promise<RedeemRewardResult> {
  await delay(500);
  requireMerchant(request.merchantId);

  const reward = mockRewards.find((entry) => entry.id === request.rewardId);
  if (!reward) {
    throw new KardApiError("not_found", "That reward is no longer available.");
  }

  const wallet = mockWallets.find((entry) => entry.id === request.walletId);
  if (!wallet) {
    throw new KardApiError("not_found", "That Kard was not found.");
  }

  const balance = currentBalanceOf(wallet);
  if (balance < reward.pointsRequired) {
    throw new KardApiError(
      "insufficient_points",
      "This customer does not have enough points yet.",
    );
  }

  const newBalance = balance - reward.pointsRequired;
  simulatedBalances.set(wallet.id, newBalance);

  return {
    pointsSpent: reward.pointsRequired,
    newBalance,
    redemption: {
      id: `rdm_mock_${Date.now()}`,
      rewardId: reward.id,
      walletId: wallet.id,
      merchantId: request.merchantId,
      userId: wallet.userId,
      pointsSpent: reward.pointsRequired,
      status: "completed",
      redeemedAt: new Date().toISOString(),
    },
  };
}

/**
 * TODO(backend): POST /api/merchant/rewards — nothing is persisted today, the
 * created reward is returned so the UI can show it optimistically.
 */
export async function createReward(request: CreateRewardRequest): Promise<Reward> {
  await delay(400);
  requireMerchant(request.merchantId);

  if (request.name.trim().length === 0) {
    throw new KardApiError("validation_failed", "Give the reward a name.");
  }
  if (!Number.isInteger(request.pointsRequired) || request.pointsRequired <= 0) {
    throw new KardApiError("validation_failed", "Points required must be above zero.");
  }

  return {
    id: `rwd_mock_${Date.now()}`,
    merchantId: request.merchantId,
    name: request.name.trim(),
    description: request.description.trim(),
    pointsRequired: request.pointsRequired,
    isActive: request.isActive,
    createdAt: new Date().toISOString(),
  };
}

/* -------------------------------------------------------------------------- */
/* Contract check                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Grouped export that proves this module satisfies `KardApiClient`. The real
 * HTTP client must export an object with the same shape.
 */
export const kardApi: KardApiClient = {
  getCurrentUser,
  getCurrentMerchant,
  getWallets,
  getTransactions,
  getRewards,
  getMerchants,
  getMerchantDetail,
  getNearbyMerchants,
  getCustomerQrToken,
  getMerchantDashboard,
  getMerchantRewards,
  getMerchantCustomers,
  getMerchantCustomerDetail,
  getCustomerByQR,
  awardPoints,
  redeemReward,
  createReward,
};
