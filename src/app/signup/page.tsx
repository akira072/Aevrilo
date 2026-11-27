"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2 } from "lucide-react";
import { AevriloLogo } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, NativeSelect } from "@/components/ui/input";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { isCollegeEmail } from "@/lib/utils";
import { signUpSchema } from "@/lib/validation/schemas";

type SignUpInput = z.input<typeof signUpSchema>;
type SignUpValues = z.output<typeof signUpSchema>;

export default function SignUpPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [verificationSentTo, setVerificationSentTo] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SignUpInput, unknown, SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      primaryIntent: "both",
    },
  });

  const watchedEmail = useWatch({ control, name: "email" }) || "";
  const collegeDetected = isCollegeEmail(watchedEmail);

  async function onSubmit(values: SignUpValues) {
    setServerError(null);
    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setServerError(
        "Supabase credentials are missing. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local."
      );
      return;
    }

    const origin = window.location.origin;
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
        data: {
          full_name: values.fullName,
          college_or_org: values.collegeOrOrg || "",
          primary_intent: values.primaryIntent,
        },
      },
    });

    if (error) {
      setServerError(error.message);
      return;
    }

    if (data.session) {
      router.push("/dashboard");
      router.refresh();
      return;
    }

    setVerificationSentTo(values.email);
  }

  if (verificationSentTo) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-14">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-teal-700">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <CardTitle>Check your inbox</CardTitle>
            <CardDescription>
              We sent a verification link to <strong>{verificationSentTo}</strong>. Verify your email to activate your Aevrilo workspace.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/login">Return to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto">
            <AevriloLogo href="/" size="md" />
          </div>
          <Badge variant="teal" className="mx-auto w-fit">
            Free registration · ₹0 freelancer fee
          </Badge>
          <CardTitle className="pt-1 text-2xl">Create your Aevrilo account</CardTitle>
          <CardDescription>
            One account lets you work as a freelancer, hire talent, and compete in hackathons.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full name</Label>
              <Input id="fullName" placeholder="Aarav Sharma" {...register("fullName")} />
              {errors.fullName ? (
                <p className="text-xs text-rose-600">{errors.fullName.message}</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="email">Email (college email recommended)</Label>
                {collegeDetected ? (
                  <Badge variant="teal" className="text-[10px]">College domain detected</Badge>
                ) : null}
              </div>
              <Input
                id="email"
                type="email"
                placeholder="aarav@iitb.ac.in or you@gmail.com"
                {...register("email")}
              />
              {errors.email ? (
                <p className="text-xs text-rose-600">{errors.email.message}</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="collegeOrOrg">College or organization</Label>
              <Input
                id="collegeOrOrg"
                placeholder="e.g., NIT Trichy / Independent Studio"
                {...register("collegeOrOrg")}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="primaryIntent">Primary focus</Label>
              <NativeSelect id="primaryIntent" {...register("primaryIntent")}>
                <option value="both">Both Freelancing & Hiring / Hackathons</option>
                <option value="freelancer">Freelancer / Student Creator</option>
                <option value="client">Client / Project Requester</option>
              </NativeSelect>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Min 8 chars, 1 uppercase, 1 number"
                {...register("password")}
              />
              {errors.password ? (
                <p className="text-xs text-rose-600">{errors.password.message}</p>
              ) : null}
            </div>

            {serverError ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                {serverError}
              </div>
            ) : null}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creating account..." : "Create free account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Already registered?{" "}
            <Link href="/login" className="font-medium text-indigo-700 hover:underline">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
