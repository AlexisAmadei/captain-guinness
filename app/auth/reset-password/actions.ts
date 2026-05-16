"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();

  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (password.length < 8) {
    redirect("/auth/reset-password?error=Le%20mot%20de%20passe%20doit%20faire%20au%20moins%208%20caract%C3%A8res");
  }

  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    redirect("/auth/reset-password?error=Le%20mot%20de%20passe%20doit%20contenir%20des%20lettres%20et%20des%20chiffres");
  }

  if (password !== confirmPassword) {
    redirect("/auth/reset-password?error=Les%20mots%20de%20passe%20ne%20correspondent%20pas");
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/auth/forgot-password?error=Lien%20expir%C3%A9.%20Demande%20un%20nouvel%20email.");
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(`/auth/reset-password?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/auth/login?message=Mot%20de%20passe%20mis%20%C3%A0%20jour.%20Tu%20peux%20maintenant%20te%20connecter.");
}
