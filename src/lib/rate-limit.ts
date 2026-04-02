// In-memory monthly Rentcast API call counter.
// Resets automatically when the calendar month changes.
// For multi-instance deployments, consider using Supabase for persistence.

const MONTHLY_LIMIT = Number(process.env.RENTCAST_MONTHLY_LIMIT) || 45;

let currentMonth = new Date().getMonth();
let callCount = 0;

function resetIfNewMonth() {
  const month = new Date().getMonth();
  if (month !== currentMonth) {
    currentMonth = month;
    callCount = 0;
  }
}

export function canMakeRequest(): boolean {
  resetIfNewMonth();
  return callCount < MONTHLY_LIMIT;
}

export function recordRequest() {
  resetIfNewMonth();
  callCount++;
}

export function getRemainingRequests(): number {
  resetIfNewMonth();
  return Math.max(0, MONTHLY_LIMIT - callCount);
}
