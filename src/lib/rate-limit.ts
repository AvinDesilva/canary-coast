// Supabase-backed monthly Rentcast API call counter.
// Uses atomic INSERT ... ON CONFLICT to survive Vercel cold starts and multi-instance deployments.
// Falls back to allowing the request if Supabase is unavailable.

import type { SupabaseClient } from "@supabase/supabase-js";

const MONTHLY_LIMIT = Number(process.env.RENTCAST_MONTHLY_LIMIT) || 45;

export async function canMakeRequest(supabase: SupabaseClient): Promise<boolean> {
  try {
    const { data } = await supabase.rpc("get_api_usage", { p_provider: "rentcast" });
    const row = data?.[0];
    return (row?.remaining ?? MONTHLY_LIMIT) > 0;
  } catch {
    // Fail open — allow the request if we can't check
    return true;
  }
}

export async function recordRequest(supabase: SupabaseClient): Promise<number> {
  try {
    const { data } = await supabase.rpc("increment_api_usage", {
      p_provider: "rentcast",
      p_limit: MONTHLY_LIMIT,
    });
    return data?.[0]?.new_count ?? 1;
  } catch {
    return 0;
  }
}

export async function getRemainingRequests(supabase: SupabaseClient): Promise<number> {
  try {
    const { data } = await supabase.rpc("get_api_usage", { p_provider: "rentcast" });
    const row = data?.[0];
    return row?.remaining ?? MONTHLY_LIMIT;
  } catch {
    return MONTHLY_LIMIT;
  }
}
