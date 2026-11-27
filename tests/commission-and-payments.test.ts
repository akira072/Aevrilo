import { describe, expect, it } from "vitest";
import { calculateCommission } from "@/lib/payments/commission";
import { canTransitionPaymentStatus } from "@/lib/domain/state-machines";
import { getActivePaymentProvider, RazorpayRouteStubAdapter } from "@/lib/payments/provider";

describe("INR Commission & Payment Safeguards", () => {
  it("computes 5% commission on ₹5,000 accurately (₹250 fee, ₹4,750 net)", () => {
    const breakdown = calculateCommission(5000, 500);
    expect(breakdown.grossAmountInr).toBe(5000);
    expect(breakdown.commissionBps).toBe(500);
    expect(breakdown.commissionPercent).toBe(5);
    expect(breakdown.commissionAmountInr).toBe(250);
    expect(breakdown.netAmountInr).toBe(4750);
    expect(breakdown.currency).toBe("INR");
  });

  it("supports configurable commission basis points without floating-point drift", () => {
    const breakdown = calculateCommission(1234.56, 750); // 7.5%
    expect(breakdown.commissionAmountInr + breakdown.netAmountInr).toBeCloseTo(1234.56, 2);
  });

  it("rejects invalid commission rates or negative amounts", () => {
    expect(() => calculateCommission(-100, 500)).toThrow();
    expect(() => calculateCommission(1000, 5000)).toThrow();
  });

  it("prevents marking payment successful without admin verification and UTR reference", () => {
    const noAdmin = canTransitionPaymentStatus("pending", "successful", false, true);
    expect(noAdmin.allowed).toBe(false);

    const noUtr = canTransitionPaymentStatus("pending", "successful", true, false);
    expect(noUtr.allowed).toBe(false);

    const valid = canTransitionPaymentStatus("pending", "successful", true, true);
    expect(valid.allowed).toBe(true);

    const immutable = canTransitionPaymentStatus("successful", "failed", true, true);
    expect(immutable.allowed).toBe(false);
  });

  it("defaults to manual external settlement adapter and blocks unconfigured Razorpay Route", async () => {
    const provider = getActivePaymentProvider();
    expect(provider.name).toBe("manual_record");

    const stub = new RazorpayRouteStubAdapter();
    await expect(stub.createSettlementIntent()).rejects.toThrow(/not configured/i);
  });
});
