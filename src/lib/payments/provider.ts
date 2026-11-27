/**
 * Payment Provider Abstraction Layer (India / INR MVP)
 *
 * MVP Policy:
 * - INR is the sole accounting currency.
 * - Client-to-freelancer settlements occur via approved external UPI or bank transfer arrangements.
 * - Aevrilo NEVER creates an internal wallet, holds customer funds in an ordinary bank account,
 *   implements unapproved escrow, or integrates crypto/virtual-asset custody.
 * - Payments are NEVER marked successful solely by a single unverified button click.
 * - Future split-marketplace adapters (e.g., Razorpay Route, Cashfree Easy Split) plug into
 *   PaymentProviderAdapter once compliance approval and API credentials are configured.
 */

export type PaymentStatus = "pending" | "processing" | "successful" | "failed";

export interface SettlementVerificationInput {
  paymentRecordId: string;
  externalReference: string;
  verifierUserId: string;
  notes?: string;
}

export interface ProviderTransferIntent {
  providerName: string;
  providerTransferId: string | null;
  status: PaymentStatus;
  instructions: string;
}

export interface PaymentProviderAdapter {
  readonly name: string;
  readonly isConfigured: boolean;
  createSettlementIntent(params: {
    projectId: string;
    grossAmountInr: number;
    commissionAmountInr: number;
    netAmountInr: number;
  }): Promise<ProviderTransferIntent>;
}

export class ManualExternalSettlementAdapter implements PaymentProviderAdapter {
  readonly name = "manual_record";
  readonly isConfigured = true;

  async createSettlementIntent(params: {
    projectId: string;
    grossAmountInr: number;
    commissionAmountInr: number;
    netAmountInr: number;
  }): Promise<ProviderTransferIntent> {
    return {
      providerName: this.name,
      providerTransferId: null,
      status: "pending",
      instructions: `External UPI/Bank settlement recorded for project ${params.projectId}. Gross: ₹${params.grossAmountInr}, Platform Fee: ₹${params.commissionAmountInr}, Freelancer Net: ₹${params.netAmountInr}. Requires UTR/reference verification before marking successful.`,
    };
  }
}

export class RazorpayRouteStubAdapter implements PaymentProviderAdapter {
  readonly name = "razorpay_route";
  readonly isConfigured = Boolean(
    process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
  );

  async createSettlementIntent(): Promise<ProviderTransferIntent> {
    if (!this.isConfigured) {
      throw new Error(
        "Razorpay Route is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET after provider onboarding."
      );
    }
    throw new Error(
      "Razorpay Route split transfers require approved marketplace onboarding and webhook verification."
    );
  }
}

export function getActivePaymentProvider(): PaymentProviderAdapter {
  const configured = process.env.PAYMENT_PROVIDER || "manual_record";
  if (configured === "razorpay_route") {
    return new RazorpayRouteStubAdapter();
  }
  return new ManualExternalSettlementAdapter();
}
