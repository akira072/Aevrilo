"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Trash2, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, NativeSelect, Textarea } from "@/components/ui/input";
import { ALLOWED_UPLOAD_TYPES } from "@/lib/domain/constants";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { Category, PortfolioItem } from "@/types/database";

export function PortfolioManager({
  userId,
  categories,
  items,
}: {
  userId: string;
  categories: Category[];
  items: PortfolioItem[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "");
  const [videoUrl, setVideoUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [liveDemoUrl, setLiveDemoUrl] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      let mediaPayload: Record<string, unknown> = {};
      if (file) {
        if (!(ALLOWED_UPLOAD_TYPES.image.mimeTypes as readonly string[]).includes(file.type)) {
          setError(`Unsupported file type. Allowed: ${ALLOWED_UPLOAD_TYPES.image.label}`);
          setSubmitting(false);
          return;
        }
        if (file.size > ALLOWED_UPLOAD_TYPES.image.maxBytes) {
          setError("Image file exceeds 10 MB limit.");
          setSubmitting(false);
          return;
        }

        const supabase = createBrowserSupabaseClient();
        if (supabase) {
          const ext = file.name.split(".").pop() || "png";
          const path = `${userId}/${Date.now()}.${ext}`;
          const { error: uploadErr } = await supabase.storage
            .from("portfolios")
            .upload(path, file, { contentType: file.type });
          if (uploadErr) {
            setError(`Upload failed: ${uploadErr.message}`);
            setSubmitting(false);
            return;
          }
          const { data: urlData } = supabase.storage.from("portfolios").getPublicUrl(path);
          mediaPayload = {
            storage_path: path,
            media_url: urlData.publicUrl,
            mime_type: file.type,
            file_size_bytes: file.size,
          };
        }
      }

      const tags = tagsText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category_id: categoryId,
          video_url: videoUrl,
          github_url: githubUrl,
          live_demo_url: liveDemoUrl,
          tags,
          ...mediaPayload,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Unable to save portfolio item.");
        setSubmitting(false);
        return;
      }

      setTitle("");
      setDescription("");
      setVideoUrl("");
      setGithubUrl("");
      setLiveDemoUrl("");
      setTagsText("");
      setFile(null);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/portfolio?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (res.ok) {
      router.refresh();
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-5">
      <Card className="lg:col-span-2 h-fit">
        <CardHeader>
          <CardTitle>Add Portfolio Project</CardTitle>
          <CardDescription>
            Showcase your best work with images, GitHub repos, or video reels.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="port_title">Project Title</Label>
              <Input
                id="port_title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                minLength={3}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="port_cat">Category</Label>
              <NativeSelect
                id="port_cat"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </NativeSelect>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="port_desc">Description</Label>
              <Textarea
                id="port_desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                minLength={10}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="port_image">Cover Image ({ALLOWED_UPLOAD_TYPES.image.label})</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="port_image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                <Upload className="h-4 w-4 shrink-0 text-slate-400" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="port_demo">Live Demo URL</Label>
              <Input id="port_demo" type="url" value={liveDemoUrl} onChange={(e) => setLiveDemoUrl(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="port_gh">GitHub URL</Label>
              <Input id="port_gh" type="url" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="port_video">Video URL</Label>
              <Input id="port_video" type="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="port_tags">Tags (comma-separated)</Label>
              <Input id="port_tags" value={tagsText} onChange={(e) => setTagsText(e.target.value)} />
            </div>

            {error ? <p className="text-xs text-rose-700">{error}</p> : null}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Adding..." : "Add to Portfolio"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4 lg:col-span-3">
        {items.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-slate-500">
              No portfolio items yet. Add your first project on the left.
            </CardContent>
          </Card>
        ) : (
          items.map((item) => (
            <Card key={item.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <Badge variant="indigo">{item.category?.name ?? "Creative"}</Badge>
                  <CardTitle className="mt-2 text-lg">{item.title}</CardTitle>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleDelete(item.id)}
                  aria-label="Delete portfolio item"
                >
                  <Trash2 className="h-4 w-4 text-rose-600" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-slate-600">{item.description}</p>
                {item.media && item.media.length > 0 ? (
                  <img
                    src={item.media[0].public_url}
                    alt={item.title}
                    className="h-48 w-full rounded-lg border border-slate-200 object-cover"
                  />
                ) : null}
                <div className="flex flex-wrap gap-3 text-xs">
                  {item.live_demo_url ? (
                    <a href={item.live_demo_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-indigo-700 underline">
                      <ExternalLink className="h-3.5 w-3.5" /> Live Demo
                    </a>
                  ) : null}
                  {item.github_url ? (
                    <a href={item.github_url} target="_blank" rel="noreferrer" className="text-slate-800 underline">
                      GitHub
                    </a>
                  ) : null}
                  {item.video_url ? (
                    <a href={item.video_url} target="_blank" rel="noreferrer" className="text-teal-800 underline">
                      Video
                    </a>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
