"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function deleteAccount(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Non authentifié." };
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return { error: "Configuration serveur manquante." };
  }

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
  );

  const { error } = await adminClient.auth.admin.deleteUser(user.id);

  if (error) {
    return { error: error.message };
  }

  redirect("/auth/login");
}
