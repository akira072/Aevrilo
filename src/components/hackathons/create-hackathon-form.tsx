"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, NativeSelect, Textarea } from "@/components/ui/input";

export function CreateHackathonForm({
  defaultDates,
}: {
  defaultDates: { regDeadline: string; startDate: string; endDate: string };
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [eligibility, setEligibility] = useState("Open to all college students across India");
  const [mode, setMode] = useState("hybrid");
  const [venue, setVenue] = useState("Campus Innovation Hub & Online");
  const [minTeamSize, setMinTeamSize] = useState(1);
  const [maxTeamSize, setMaxTeamSize] = useState(4);
  const [regDeadline, setRegDeadline] = useState(defaultDates.regDeadline);
  const [startDate, setStartDate] = useState(defaultDates.startDate);
  const [endDate, setEndDate] = useState(defaultDates.endDate);
  const [prizePool, setPrizePool] = useState(50000);
  const [fundingSource, setFundingSource] = useState("College Innovation Cell & Sponsors");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/hackathons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        tagline,
        description,
        eligibility,
        mode,
        venue,
        min_team_size: minTeamSize,
        max_team_size: maxTeamSize,
        registration_deadline: regDeadline,
        start_date: startDate,
        end_date: endDate,
        prize_pool_inr: prizePool,
        funding_source: fundingSource,
        status: "registration_open",
      }),
    });

    const json = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(json.error || "Unable to create hackathon.");
      return;
    }

    router.push(`/hackathons/${json.hackathon.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="h_title">Hackathon Title</Label>
          <Input id="h_title" value={title} onChange={(e) => setTitle(e.target.value)} required minLength={4} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="h_tagline">Tagline</Label>
          <Input id="h_tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="48 hours to build campus-first AI & design tools" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="h_desc">Description & Theme</Label>
        <Textarea id="h_desc" value={description} onChange={(e) => setDescription(e.target.value)} required minLength={20} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="h_mode">Mode</Label>
          <NativeSelect id="h_mode" value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="hybrid">Hybrid</option>
            <option value="online">Online</option>
            <option value="offline">In-Person / Campus</option>
          </NativeSelect>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="h_venue">Venue</Label>
          <Input id="h_venue" value={venue} onChange={(e) => setVenue(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="h_eligibility">Eligibility</Label>
          <Input id="h_eligibility" value={eligibility} onChange={(e) => setEligibility(e.target.value)} required />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor="h_min">Min Team Size</Label>
          <Input id="h_min" type="number" min={1} max={10} value={minTeamSize} onChange={(e) => setMinTeamSize(Number(e.target.value))} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="h_max">Max Team Size</Label>
          <Input id="h_max" type="number" min={1} max={10} value={maxTeamSize} onChange={(e) => setMaxTeamSize(Number(e.target.value))} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="h_pool">Prize Pool (INR)</Label>
          <Input id="h_pool" type="number" min={0} value={prizePool} onChange={(e) => setPrizePool(Number(e.target.value))} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="h_funding">Prize Funding Source</Label>
          <Input id="h_funding" value={fundingSource} onChange={(e) => setFundingSource(e.target.value)} required />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="h_reg">Registration Deadline</Label>
          <Input id="h_reg" type="datetime-local" value={regDeadline} onChange={(e) => setRegDeadline(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="h_start">Start Date</Label>
          <Input id="h_start" type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="h_end">Submission End Date</Label>
          <Input id="h_end" type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {error}
        </div>
      ) : null}

      <Button type="submit" variant="accent" disabled={submitting}>
        {submitting ? "Creating Hackathon..." : "Publish Hackathon"}
      </Button>
    </form>
  );
}
