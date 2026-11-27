export function getPublicEnv() {
  return {
    appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    appName: process.env.NEXT_PUBLIC_APP_NAME || "Aevrilo",
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  };
}

export function isSupabaseConfigured(): boolean {
  const { supabaseUrl, supabaseAnonKey } = getPublicEnv();
  return Boolean(
    supabaseUrl &&
      supabaseAnonKey &&
      supabaseUrl.startsWith("http") &&
      !supabaseUrl.includes("your-project")
  );
}

export function getServerEnv() {
  const pub = getPublicEnv();
  return {
    ...pub,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    defaultCommissionBps: Number(process.env.AEVRILO_DEFAULT_COMMISSION_BPS || 500),
    currency: process.env.AEVRILO_CURRENCY || "INR",
    resendApiKey: process.env.RESEND_API_KEY || "",
    emailFromAddress: process.env.EMAIL_FROM_ADDRESS || "",
  };
}
