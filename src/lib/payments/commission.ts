export interface CommissionBreakdown {
  grossAmountInr: number;
  commissionBps: number;
  commissionPercent: number;
  commissionAmountInr: number;
  netAmountInr: number;
  currency: "INR";
}

/**
 * Computes platform commission in integer paise to prevent floating-point drift.
 * Default Aevrilo commission is 5% (500 basis points), configurable via platform_settings.
 */
export function calculateCommission(
  grossAmountInr: number,
  commissionBps = 500
): CommissionBreakdown {
  if (!Number.isFinite(grossAmountInr) || grossAmountInr < 0) {
    throw new Error("Gross amount must be a non-negative finite number.");
  }
  if (!Number.isInteger(commissionBps) || commissionBps < 0 || commissionBps > 3000) {
    throw new Error("Commission basis points must be an integer between 0 and 3000.");
  }

  const grossPaise = Math.round(grossAmountInr * 100);
  const commissionPaise = Math.round((grossPaise * commissionBps) / 10000);
  const netPaise = grossPaise - commissionPaise;

  return {
    grossAmountInr: grossPaise / 100,
    commissionBps,
    commissionPercent: commissionBps / 100,
    commissionAmountInr: commissionPaise / 100,
    netAmountInr: netPaise / 100,
    currency: "INR",
  };
}
