import { supabase } from "../supabase.js";
import { v4 as uuidv4 } from "uuid";

/**
 * Ensure a row exists in `public.business_profiles` for the given user ID.
 * It’s safe to call on every login; we UPSERT by primary‑key (id).
 *
 * @param userId – UUID from `public.users.id`
 * @param role   – user role; function returns immediately if not "business"
 */
export async function ensureBusinessProfile(userId: string, role: string) {
  if (role !== "business") return;

  /* quick existence check */
  const { data: existing } = await supabase
    .from("business_profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (existing) return; // profile already present

  /* create default profile */
  await supabase.from("business_profiles").upsert(
    {
      id: userId,                       // PK matches users.id
      session_id: uuidv4(),             // starter session
      name: "My Business",
      values: "Default values",
      product_type: "Default product",
      target_schools_sports: "All",
      created_at: new Date(),
      updated_at: new Date(),
    },
    { onConflict: "id" }
  );
}
