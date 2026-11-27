"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { calculateCommission } from "@/lib/payments/commission";
import { formatINR } from "@/lib/utils";
import { createApplicationSchema } from "@/lib/validation/schemas";

const formSchema = createApplicationSchema.omit({ request_id: true }).extend({
  skillsInput: z.string().optional().default(""),
  portfolioLinksInput: z.string().optional().default(""),
});

type FormInput = z.input<typeof formSchema>;
type FormValues = z.output<typeof formSchema>;

export function ApplyForm({
  requestId,
  defaultBudget,
  commissionBps = 500,
}: {
  requestId: string;
  defaultBudget: number;
  commissionBps?: number;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      proposed_price_inr: defaultBudget,
      estimated_days: 7,
      cover_message: "",
      relevant_skills: [],
      portfolio_links: [],
    },
  });

  const proposedPrice = Number(useWatch({ control, name: "proposed_price_inr" }) || 0);
  const feePreview = proposedPrice >= 0 ? calculateCommission(proposedPrice, commissionBps) : null;

  async function onSubmit(values: FormValues) {
    setServerError(null);
    const relevant_skills = (values.skillsInput || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const portfolio_links = (values.portfolioLinksInput || "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        request_id: requestId,
        cover_message: values.cover_message,
        relevant_skills,
        portfolio_links,
        proposed_price_inr: values.proposed_price_inr,
        estimated_days: values.estimated_days,
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      setServerError(json.error || "Unable to submit proposal.");
      return;
    }

    setSubmitted(true);
    router.refresh();
  }

  if (submitted) {
    return (
      <div className="rounded-lg border border-teal-200 bg-teal-50 p-4 text-sm text-teal-900">
        Your proposal has been sent to the client. Track its status in{" "}
        <a href="/applications" className="font-semibold underline">
          My Applications
        </a>
        .
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="proposed_price_inr">Proposed Price (INR)</Label>
          <Input id="proposed_price_inr" type="number" min={100} {...register("proposed_price_inr")} />
          {errors.proposed_price_inr ? (
            <p className="text-xs text-rose-600">{errors.proposed_price_inr.message}</p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="estimated_days">Estimated Days</Label>
          <Input id="estimated_days" type="number" min={1} max={365} {...register("estimated_days")} />
          {errors.estimated_days ? (
            <p className="text-xs text-rose-600">{errors.estimated_days.message}</p>
          ) : null}
        </div>
      </div>

      {feePreview ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
          <div className="flex justify-between">
            <span>Proposed Amount</span>
            <span className="font-mono">{formatINR(feePreview.grossAmountInr)}</span>
          </div>
          <div className="mt-1 flex justify-between">
            <span>Aevrilo Platform Fee ({feePreview.commissionPercent}%)</span>
            <span className="font-mono">- {formatINR(feePreview.commissionAmountInr)}</span>
          </div>
          <div className="mt-1.5 flex justify-between border-t border-slate-200 pt-1.5 font-semibold text-slate-950">
            <span>Estimated Freelancer Payout</span>
            <span className="font-mono">{formatINR(feePreview.netAmountInr)}</span>
          </div>
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="cover_message">Proposal & Approach</Label>
        <Textarea
          id="cover_message"
          placeholder="Explain how you will deliver this project, relevant past work, and milestones..."
          {...register("cover_message")}
        />
        {errors.cover_message ? (
          <p className="text-xs text-rose-600">{errors.cover_message.message}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="skillsInput">Relevant Skills (comma-separated)</Label>
        <Input id="skillsInput" placeholder="Premiere Pro, Motion Graphics, Sound Design" {...register("skillsInput")} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="portfolioLinksInput">Portfolio Links (one URL per line)</Label>
        <Textarea
          id="portfolioLinksInput"
          className="min-h-[76px]"
          placeholder="https://github.com/username/project"
          {...register("portfolioLinksInput")}
        />
      </div>

      {serverError ? (
        <p className="text-xs text-rose-600">{serverError}</p>
      ) : null}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Submitting Proposal..." : "Submit Proposal"}
      </Button>
    </form>
  );
}
