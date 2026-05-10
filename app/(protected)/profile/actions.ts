"use server";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

import type { ProfileActionState } from "./types";

function getEmailRedirectTo(headerStore: Headers) {
  const envSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (envSiteUrl) {
    return `${envSiteUrl}/auth/callback?next=/profile`;
  }

  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";

  if (!host) {
    return "http://localhost:3000/auth/callback?next=/profile";
  }

  return `${protocol}://${host}/auth/callback?next=/profile`;
}

export async function updateDisplayName(
  _previousState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const supabase = await createClient();
  const fullName = String(formData.get("fullName") ?? "").trim();

  if (!fullName) {
    return {
      status: "error",
      message: "Le pseudo ne peut pas être vide.",
    };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      status: "error",
      message: "Vous devez être connecté.",
    };
  }

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      full_name: fullName,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (error) {
    return {
      status: "error",
      message: "Impossible de mettre à jour le pseudo.",
    };
  }

  revalidatePath("/profile");

  return {
    status: "success",
    message: "Pseudo mis à jour.",
  };
}

export async function updateEmail(
  _previousState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const supabase = await createClient();
  const headerStore = await headers();
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    return {
      status: "error",
      message: "L'email est requis.",
    };
  }

  const { error } = await supabase.auth.updateUser(
    { email },
    {
      emailRedirectTo: getEmailRedirectTo(headerStore),
    },
  );

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  return {
    status: "success",
    message: "Email mis à jour. Confirmez via le mail reçu.",
  };
}

export async function updatePassword(
  _previousState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const supabase = await createClient();

  const oldPassword = String(formData.get("oldPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");

  if (!oldPassword) {
    return {
      status: "error",
      message: "L'ancien mot de passe est requis.",
    };
  }

  if (newPassword.length < 8) {
    return {
      status: "error",
      message: "Le nouveau mot de passe doit contenir au moins 8 caractères.",
    };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user || !user.email) {
    return {
      status: "error",
      message: "Utilisateur introuvable.",
    };
  }

  const credentialsClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );

  const { error: oldPasswordError } = await credentialsClient.auth.signInWithPassword({
    email: user.email,
    password: oldPassword,
  });

  if (oldPasswordError) {
    return {
      status: "error",
      message: "Ancien mot de passe invalide.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  return {
    status: "success",
    message: "Mot de passe mis à jour.",
  };
}

export async function updateAvatar(
  _previousState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const supabase = await createClient();
  const file = formData.get("avatar");

  if (!(file instanceof File) || file.size === 0) {
    return {
      status: "error",
      message: "Veuillez sélectionner une image.",
    };
  }

  if (!file.type.startsWith("image/")) {
    return {
      status: "error",
      message: "Le fichier doit être une image.",
    };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      status: "error",
      message: "Vous devez être connecté.",
    };
  }

  const extension = file.name.split(".").pop() || "jpg";
  const filePath = `${user.id}/${Date.now()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return {
      status: "error",
      message: "Échec de l'upload de l'avatar.",
    };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(filePath);

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      avatar_url: publicUrl,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (profileError) {
    return {
      status: "error",
      message: "Avatar uploadé mais profil non mis à jour.",
    };
  }

  revalidatePath("/profile");

  return {
    status: "success",
    message: "Avatar mis à jour.",
  };
}