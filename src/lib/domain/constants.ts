export const FREELANCE_CATEGORIES = [
  { slug: "video-editing", name: "Video Editing", iconName: "Film", description: "Reels, YouTube edits, event recaps, colour grading and post-production." },
  { slug: "photo-editing", name: "Photo Editing", iconName: "Image", description: "Retouching, product photography cleanup, colour correction and compositing." },
  { slug: "graphic-design", name: "Graphic Design", iconName: "Palette", description: "Brand identity, posters, pitch decks, social kits and campus merchandise." },
  { slug: "blender-3d-modelling", name: "Blender and 3D Modelling", iconName: "Box", description: "Product renders, architectural visualisation, game assets and hard-surface modelling." },
  { slug: "animation-vfx", name: "Animation and VFX", iconName: "Sparkles", description: "Motion graphics, 2D/3D explainers, title sequences and visual effects." },
  { slug: "game-development", name: "Game Development", iconName: "Gamepad2", description: "Unity, Unreal, Godot prototypes, level design, shaders and gameplay systems." },
  { slug: "web-development", name: "Web Development", iconName: "Globe", description: "Full-stack web apps, landing pages, dashboards and API integrations." },
  { slug: "programming", name: "Programming", iconName: "Code2", description: "Python automation, AI/ML scripts, mobile utilities and backend tooling." },
  { slug: "ui-ux-design", name: "UI/UX Design", iconName: "Layout", description: "Figma wireframes, design systems, interactive prototypes and usability audits." },
  { slug: "other-creative-services", name: "Other Creative Services", iconName: "Layers", description: "Technical writing, sound design, voiceovers and multidisciplinary creative gigs." },
] as const;

export const ALLOWED_UPLOAD_TYPES = {
  image: {
    mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    maxBytes: 10 * 1024 * 1024,
    label: "JPG, PNG, WEBP or GIF up to 10 MB",
  },
  document: {
    mimeTypes: ["image/jpeg", "image/png", "image/webp", "application/pdf", "application/zip"],
    maxBytes: 15 * 1024 * 1024,
    label: "Images, PDF, or ZIP up to 15 MB",
  },
  deliverable: {
    mimeTypes: ["image/jpeg", "image/png", "image/webp", "application/pdf", "application/zip", "video/mp4"],
    maxBytes: 50 * 1024 * 1024,
    label: "Images, PDF, ZIP, or MP4 up to 50 MB",
  },
} as const;

export const REQUEST_STATUS_META: Record<string, { label: string; tone: "neutral" | "indigo" | "teal" | "amber" | "rose" }> = {
  OPEN: { label: "Open", tone: "teal" },
  "UNDER REVIEW": { label: "Under Review", tone: "amber" },
  ASSIGNED: { label: "Assigned", tone: "indigo" },
  "IN PROGRESS": { label: "In Progress", tone: "indigo" },
  DELIVERED: { label: "Delivered", tone: "amber" },
  COMPLETED: { label: "Completed", tone: "teal" },
  CANCELLED: { label: "Cancelled", tone: "neutral" },
  DISPUTED: { label: "Disputed", tone: "rose" },
};
