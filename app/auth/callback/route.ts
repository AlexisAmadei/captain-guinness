import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { sanitizeNextPath } from "@/lib/auth/redirect";

function isSupportedEmailOtpType(value: string | null): value is EmailOtpType {
  if (!value) {
    return false;
  }

  return ["signup", "invite", "magiclink", "recovery", "email_change", "email"].includes(value);
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const next = requestUrl.searchParams.get("next");

  const safeNext = sanitizeNextPath(next, "/");
  const errorRedirect = new URL("/auth/error", request.url);

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[auth/callback] exchangeCodeForSession failed:", error.message);
      errorRedirect.searchParams.set("reason", error.message);
      return NextResponse.redirect(errorRedirect);
    }

    return NextResponse.redirect(new URL(safeNext, request.url));
  }

  if (tokenHash && isSupportedEmailOtpType(type)) {
    if (type === "email_change") {
      // Supabase's /verify endpoint already applied the email change and consumed
      // the token before redirecting here. Calling verifyOtp would fail with
      // "One-time token not found". The session is still valid — just redirect.
      return NextResponse.redirect(new URL(safeNext, request.url));
    }

    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });

    if (error) {
      console.error("[auth/callback] verifyOtp failed:", error.message);
      errorRedirect.searchParams.set("reason", error.message);
      return NextResponse.redirect(errorRedirect);
    }

    return NextResponse.redirect(new URL(safeNext, request.url));
  }

  console.error("[auth/callback] no code or token_hash in URL. params:", Object.fromEntries(requestUrl.searchParams));
  errorRedirect.searchParams.set("reason", "no_token");
  return NextResponse.redirect(errorRedirect);
}
