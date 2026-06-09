"use server";

import { redirect } from "next/navigation";

import { isApprovedAdmin } from "@/lib/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type LoginState = {
  message: string;
};

export async function signIn(_: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { message: "Enter your email and password." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { message: "The email or password is incorrect." };
  }

  if (!isApprovedAdmin(email)) {
    await supabase.auth.signOut();
    return { message: "This email is not approved for the RUC Bible Study admin dashboard." };
  }

  redirect("/admin");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
