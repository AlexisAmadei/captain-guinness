"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buildAuthCallbackUrl, sanitizeNextPath } from "@/lib/auth/redirect";

function getSafeNextFromForm(formData: FormData, fallback = "/") {
  const next = String(formData.get("next") ?? "");
  return sanitizeNextPath(next, fallback);
}

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = getSafeNextFromForm(formData, "/");

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/auth/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect(next);
}

export async function loginWithGithub(formData: FormData) {
  const supabase = await createClient();
  const headerStore = await headers();
  const next = getSafeNextFromForm(formData, "/");

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: buildAuthCallbackUrl(headerStore, next),
    },
  });

  if (error || !data.url) {
    redirect(`/auth/login?error=${encodeURIComponent(error?.message ?? "OAuth init failed")}`);
  }

  redirect(data.url);
}

export async function loginWithGoogle(formData: FormData) {
  const supabase = await createClient();
  const headerStore = await headers();
  const next = getSafeNextFromForm(formData, "/");

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: buildAuthCallbackUrl(headerStore, next),
    },
  });

  if (error || !data.url) {
    redirect(`/auth/login?error=${encodeURIComponent(error?.message ?? "OAuth init failed")}`);
  }

  redirect(data.url);
}

export async function loginWithMagicLink(formData: FormData) {
  const supabase = await createClient();
  const headerStore = await headers();

  const email = String(formData.get("email") ?? "").trim();
  const next = getSafeNextFromForm(formData, "/");

  if (!email) {
    redirect("/auth/login?error=Email%20is%20required");
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: buildAuthCallbackUrl(headerStore, next),
    },
  });

  if (error) {
    redirect(`/auth/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/auth/login?message=Magic%20link%20sent.%20Check%20your%20email.");
}

export async function sendPasswordReset(formData: FormData) {
  const supabase = await createClient();
  const headerStore = await headers();

  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    redirect("/auth/forgot-password?error=Email%20requis");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: buildAuthCallbackUrl(headerStore, "/auth/reset-password"),
  });

  if (error) {
    redirect(`/auth/forgot-password?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/auth/forgot-password?sent=true&email=${encodeURIComponent(email)}`);
}

export async function logout() {
  const supabase = await createClient();

  await supabase.auth.signOut();

  redirect("/auth/login");
}
