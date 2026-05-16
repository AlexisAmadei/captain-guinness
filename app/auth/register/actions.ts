"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buildAuthCallbackUrl, sanitizeNextPath } from "@/lib/auth/redirect";

export async function register(formData: FormData) {
  const supabase = await createClient();
  const headerStore = await headers();

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();
  const termsAccepted = formData.get("termsAccepted") === "on";
  const next = sanitizeNextPath(String(formData.get("next") ?? ""), "/");

  if (!termsAccepted) {
    redirect(`/auth/register?error=${encodeURIComponent("Vous devez accepter les CGU et la politique de confidentialité.")}`);
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: buildAuthCallbackUrl(headerStore, next),
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    redirect(`/auth/register?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/auth/login?message=Inscription%20r%C3%A9ussie%20!%20Tu%20peux%20maintenant%20te%20connecter.");
}
