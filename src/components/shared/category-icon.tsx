import {
  Box,
  Code2,
  Film,
  Gamepad2,
  Globe,
  Image as ImageIcon,
  Layers,
  Layout,
  Palette,
  Sparkles,
} from "lucide-react";

const ICON_MAP = {
  Film,
  Image: ImageIcon,
  Palette,
  Box,
  Sparkles,
  Gamepad2,
  Globe,
  Code2,
  Layout,
  Layers,
};

export function CategoryIcon({
  name,
  className = "h-5 w-5",
}: {
  name: string;
  className?: string;
}) {
  const Icon = ICON_MAP[name as keyof typeof ICON_MAP] ?? Sparkles;
  return <Icon className={className} />;
}
