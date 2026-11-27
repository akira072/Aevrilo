"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, NativeSelect, Textarea } from "@/components/ui/input";
import type { Profile } from "@/types/database";

export function ProfileEditor({
  profile,
  initialSkills,
}: {
  profile: Profile;
  initialSkills: string[];
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState(profile.full_name);
  const [username, setUsername] = useState(profile.username);
  const [headline, setHeadline] = useState(profile.headline || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [collegeOrOrg, setCollegeOrOrg] = useState(profile.college_or_org || "");
  const [collegeEmail, setCollegeEmail] = useState(profile.college_email || "");
  const [specialization, setSpecialization] = useState(profile.specialization || "");
  const [city, setCity] = useState(profile.city || "");
  const [availability, setAvailability] = useState(profile.availability);
  const [isClientEnabled, setIsClientEnabled] = useState(profile.is_client_enabled);
  const [isFreelancerEnabled, setIsFreelancerEnabled] = useState(profile.is_freelancer_enabled);
  const [payoutNote, setPayoutNote] = useState(profile.payout_preference_note || "");
  const [skillsText, setSkillsText] = useState(initialSkills.join(", "));
  const [status, setStatus] = useState<{ type: "idle" | "saving" | "saved" | "error"; msg?: string }>({
    type: "idle",
  });

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ type: "saving" });

    const skills = skillsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: fullName,
        username,
        headline,
        bio,
        college_or_org: collegeOrOrg,
        college_email: collegeEmail,
        specialization,
        city,
        availability,
        is_client_enabled: isClientEnabled,
        is_freelancer_enabled: isFreelancerEnabled,
        payout_preference_note: payoutNote,
        skills,
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      setStatus({ type: "error", msg: json.error || "Unable to save profile." });
      return;
    }
    setStatus({ type: "saved", msg: "Profile updated." });
    router.refresh();
  }

  return (
    <form onSubmit={handleSave} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="full_name">Full Name</Label>
          <Input id="full_name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="username">Username</Label>
          <Input id="username" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} required />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="headline">Headline</Label>
          <Input
            id="headline"
            placeholder="3D Generalist & Motion Designer"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="specialization">Primary Specialization</Label>
          <Input
            id="specialization"
            placeholder="Web Development / Video Editing"
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="college_or_org">College or Organization</Label>
          <Input id="college_or_org" value={collegeOrOrg} onChange={(e) => setCollegeOrOrg(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="college_email">College Email (for verification)</Label>
          <Input
            id="college_email"
            type="email"
            placeholder="name@college.ac.in"
            value={collegeEmail}
            onChange={(e) => setCollegeEmail(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="city">City</Label>
          <Input id="city" placeholder="Bengaluru" value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bio">Bio & Experience</Label>
        <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="skillsText">Skills (comma-separated)</Label>
          <Input
            id="skillsText"
            placeholder="Next.js, Figma, Blender, Premiere Pro"
            value={skillsText}
            onChange={(e) => setSkillsText(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="availability">Availability Status</Label>
          <NativeSelect
            id="availability"
            value={availability}
            onChange={(e) => setAvailability(e.target.value as Profile["availability"])}
          >
            <option value="available">Available for Projects</option>
            <option value="busy">Busy</option>
            <option value="unavailable">Unavailable</option>
          </NativeSelect>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="payoutNote">Settlement Preference Note (UPI / Bank arrangement)</Label>
        <Input
          id="payoutNote"
          placeholder="Preferred external settlement timing or invoicing note (do not enter sensitive PINs/secrets)"
          value={payoutNote}
          onChange={(e) => setPayoutNote(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isFreelancerEnabled}
            onChange={(e) => setIsFreelancerEnabled(e.target.checked)}
          />
          <span>Appear in Freelancer Directory</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isClientEnabled}
            onChange={(e) => setIsClientEnabled(e.target.checked)}
          />
          <span>Enable Client / Hiring Workspace</span>
        </label>
      </div>

      {status.type === "error" ? <p className="text-sm text-rose-700">{status.msg}</p> : null}
      {status.type === "saved" ? <p className="text-sm text-teal-800">{status.msg}</p> : null}

      <Button type="submit" disabled={status.type === "saving"}>
        {status.type === "saving" ? "Saving..." : "Save Profile"}
      </Button>
    </form>
  );
}
