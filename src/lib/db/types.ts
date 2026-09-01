// Hand-written database row types. Kept in sync with supabase/migrations.
// We deliberately avoid generated types so this repo can be reviewed without
// running the Supabase CLI first.

export type UUID = string;
export type ISODate = string;

export type MerchantRole = "owner" | "manager" | "employee";
export type TransactionType =
  | "earn"
  | "redeem"
  | "adjustment"
  | "refund"
  | "expiration";
export type RedemptionStatus = "pending" | "completed" | "cancelled";

export interface ProfileRow {
  id: UUID;
  email: string;
  first_name: string | null;
  last_name: string | null;
  created_at: ISODate;
  updated_at: ISODate;
}

export interface MerchantRow {
  id: UUID;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  is_active: boolean;
  created_at: ISODate;
  updated_at: ISODate;
}

export interface LocationRow {
  id: UUID;
  merchant_id: UUID;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
  created_at: ISODate;
}

export interface MerchantUserRow {
  id: UUID;
  merchant_id: UUID;
  user_id: UUID;
  role: MerchantRole;
  created_at: ISODate;
}

export interface WalletRow {
  id: UUID;
  user_id: UUID;
  merchant_id: UUID;
  created_at: ISODate;
  updated_at: ISODate;
}

export interface PointTransactionRow {
  id: UUID;
  wallet_id: UUID;
  merchant_id: UUID;
  user_id: UUID;
  location_id: UUID | null;
  transaction_type: TransactionType;
  points_delta: number;
  purchase_amount_cents: number | null;
  external_reference: string | null;
  created_by: UUID | null;
  metadata: Record<string, unknown>;
  created_at: ISODate;
}

export interface RewardRow {
  id: UUID;
  merchant_id: UUID;
  name: string;
  description: string | null;
  points_required: number;
  is_active: boolean;
  created_at: ISODate;
  updated_at: ISODate;
}

export interface RedemptionRow {
  id: UUID;
  reward_id: UUID;
  wallet_id: UUID;
  merchant_id: UUID;
  user_id: UUID;
  points_spent: number;
  status: RedemptionStatus;
  redeemed_by: UUID | null;
  redeemed_at: ISODate;
  created_at: ISODate;
}

export interface CustomerQrTokenRow {
  id: UUID;
  user_id: UUID;
  token_hash: string;
  expires_at: ISODate;
  revoked_at: ISODate | null;
  created_at: ISODate;
}

export interface WalletPassRow {
  id: UUID;
  user_id: UUID;
  serial_number: string;
  authentication_token_hash: string;
  pass_type_identifier: string;
  last_updated_at: ISODate;
  created_at: ISODate;
}
