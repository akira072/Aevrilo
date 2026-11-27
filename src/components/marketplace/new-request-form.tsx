"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input, Label, NativeSelect, Textarea } from "@/components/ui/input";
import { createRequestSchema } from "@/lib/validation/schemas";
import type { Category } from "@/types/database";

const formSchema = createRequestSchema.omit({ required_skills: true }).extend({
  skillsText: z.string().min(2, "Enter at least one required skill"),
});

type FormInput = z.input<typeof formSchema>;
type FormValues = z.output<typeof formSchema>;

export function NewRequestForm({
  categories,
  defaultDeadline,
}: {
  categories: Category[];
  defaultDeadline: string;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      payment_type: "fixed",
      freelancers_needed: 1,
      deadline: defaultDeadline,
      category_id: categories[0]?.id || "",
    },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    const required_skills = values.skillsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: values.title,
        description: values.description,
        category_id: values.category_id,
        required_skills,
        budget_inr: values.budget_inr,
        payment_type: values.payment_type,
        deadline: values.deadline,
        freelancers_needed: values.freelancers_needed,
        additional_requirements: values.additional_requirements,
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      setServerError(json.error || "Unable to create request.");
      return;
    }

    router.push(`/explore/${json.request.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="title">Project Title</Label>
        <Input
          id="title"
          placeholder="e.g., 60-second Launch Reel & Motion Graphics for Campus Tech Fest"
          {...register("title")}
        />
        {errors.title ? <p className="text-xs text-rose-600">{errors.title.message}</p> : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="category_id">Category</Label>
          <NativeSelect id="category_id" {...register("category_id")}>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </NativeSelect>
          {errors.category_id ? (
            <p className="text-xs text-rose-600">{errors.category_id.message}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="skillsText">Required Skills (comma-separated)</Label>
          <Input
            id="skillsText"
            placeholder="After Effects, Premiere Pro, Colour Grading"
            {...register("skillsText")}
          />
          {errors.skillsText ? (
            <p className="text-xs text-rose-600">{errors.skillsText.message}</p>
          ) : null}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Detailed Description</Label>
        <Textarea
          id="description"
          className="min-h-[140px]"
          placeholder="Outline deliverables, formats, visual references, and expectations..."
          {...register("description")}
        />
        {errors.description ? (
          <p className="text-xs text-rose-600">{errors.description.message}</p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor="budget_inr">Budget (INR)</Label>
          <Input id="budget_inr" type="number" min={100} placeholder="5000" {...register("budget_inr")} />
          {errors.budget_inr ? (
            <p className="text-xs text-rose-600">{errors.budget_inr.message}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="payment_type">Payment Type</Label>
          <NativeSelect id="payment_type" {...register("payment_type")}>
            <option value="fixed">Fixed Price</option>
            <option value="milestone">Milestone-based</option>
            <option value="hourly">Hourly</option>
          </NativeSelect>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="deadline">Deadline</Label>
          <Input id="deadline" type="date" {...register("deadline")} />
          {errors.deadline ? (
            <p className="text-xs text-rose-600">{errors.deadline.message}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="freelancers_needed">Creators Needed</Label>
          <Input id="freelancers_needed" type="number" min={1} max={20} {...register("freelancers_needed")} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="additional_requirements">Additional Requirements (optional)</Label>
        <Textarea
          id="additional_requirements"
          placeholder="Source file requirements, aspect ratios, NDA or campus preference..."
          {...register("additional_requirements")}
        />
      </div>

      {serverError ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {serverError}
        </div>
      ) : null}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Publishing..." : "Publish Request"}
      </Button>
    </form>
  );
}
