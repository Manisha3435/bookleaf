/**
 * Safe currency formatter.
 * Handles null/undefined -> '—'
 * 0 -> '₹0'
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) {
    return "—";
  }
  return `₹${amount.toLocaleString("en-IN")}`;
}

/**
 * Safe number formatter.
 * Handles null/undefined -> '—'
 * 0 -> '0'
 */
export function formatNumber(val: number | null | undefined): string {
  if (val === null || val === undefined) {
    return "—";
  }
  return val.toLocaleString("en-IN");
}

/**
 * Safe date formatter.
 * Handles null/undefined -> '—'
 */
export function formatDate(
  dateVal: string | Date | null | undefined,
  includeTime: boolean = false
): string {
  if (!dateVal) return "—";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "—";
    if (includeTime) {
      return d.toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}
