-- ============================================================================
-- Required Platform Seed: Settings, Freelance Categories, and Core Skills
-- Safe to run idempotently in production and local environments.
-- ============================================================================

INSERT INTO public.platform_settings (
  id,
  freelance_commission_bps,
  currency,
  freelancer_joining_fee_inr,
  allowed_college_domains
)
VALUES (1, 500, 'INR', 0, ARRAY['.edu', '.edu.in', '.ac.in'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.categories (name, slug, description, icon_name, display_order)
VALUES
  ('Video Editing', 'video-editing', 'Reels, YouTube edits, event recaps, colour grading and post-production.', 'Film', 1),
  ('Photo Editing', 'photo-editing', 'Retouching, product photography cleanup, colour correction and compositing.', 'Image', 2),
  ('Graphic Design', 'graphic-design', 'Brand identity, posters, pitch decks, social kits and campus merchandise.', 'Palette', 3),
  ('Blender and 3D Modelling', 'blender-3d-modelling', 'Product renders, architectural visualisation, game assets and hard-surface modelling.', 'Box', 4),
  ('Animation and VFX', 'animation-vfx', 'Motion graphics, 2D/3D explainers, title sequences and visual effects.', 'Sparkles', 5),
  ('Game Development', 'game-development', 'Unity, Unreal, Godot prototypes, level design, shaders and gameplay systems.', 'Gamepad2', 6),
  ('Web Development', 'web-development', 'Full-stack web apps, landing pages, dashboards and API integrations.', 'Globe', 7),
  ('Programming', 'programming', 'Python automation, AI/ML scripts, mobile utilities and backend tooling.', 'Code2', 8),
  ('UI/UX Design', 'ui-ux-design', 'Figma wireframes, design systems, interactive prototypes and usability audits.', 'Layout', 9),
  ('Other Creative Services', 'other-creative-services', 'Technical writing, sound design, voiceovers and multidisciplinary creative gigs.', 'Layers', 10)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon_name = EXCLUDED.icon_name,
  display_order = EXCLUDED.display_order;

INSERT INTO public.skills (name, slug)
VALUES
  ('Next.js', 'nextjs'),
  ('TypeScript', 'typescript'),
  ('React', 'react'),
  ('Node.js', 'nodejs'),
  ('Python', 'python'),
  ('PostgreSQL', 'postgresql'),
  ('Figma', 'figma'),
  ('Tailwind CSS', 'tailwind-css'),
  ('Blender', 'blender'),
  ('Premiere Pro', 'premiere-pro'),
  ('After Effects', 'after-effects'),
  ('DaVinci Resolve', 'davinci-resolve'),
  ('Photoshop', 'photoshop'),
  ('Illustrator', 'illustrator'),
  ('Unity', 'unity'),
  ('Unreal Engine', 'unreal-engine'),
  ('Three.js', 'threejs'),
  ('UI Systems', 'ui-systems'),
  ('Motion Graphics', 'motion-graphics'),
  ('Copywriting', 'copywriting')
ON CONFLICT (slug) DO NOTHING;
