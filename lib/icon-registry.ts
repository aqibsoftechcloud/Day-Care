import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Ambulance,
  Award,
  Baby,
  Bandage,
  Bed,
  Bell,
  BicepsFlexed,
  Bone,
  Book,
  BookOpen,
  Brain,
  Briefcase,
  Building,
  Building2,
  Calendar,
  CalendarHeart,
  Check,
  CheckCircle,
  Clipboard,
  ClipboardCheck,
  Clock,
  Compass,
  Cross,
  Crosshair,
  Droplet,
  Ear,
  Eye,
  FileCheck,
  FileText,
  Flag,
  FlaskConical,
  Globe,
  Hand,
  HandHeart,
  HeartHandshake,
  Heart,
  HeartPulse,
  Home,
  Hospital,
  Key,
  Layers,
  Leaf,
  LifeBuoy,
  Lightbulb,
  Lock,
  MapPin,
  MapPinned,
  MessageCircle,
  Microscope,
  Navigation,
  Pill,
  Phone,
  PhoneCall,
  Plus,
  PlusCircle,
  Quote,
  Scale,
  Scan,
  Shield,
  ShieldCheck,
  ShieldPlus,
  Smile,
  Sparkles,
  Stethoscope,
  Sun,
  Syringe,
  Target,
  Thermometer,
  ThumbsUp,
  Timer,
  Trophy,
  UserCheck,
  UserRound,
  Users,
  UsersRound,
  Wallet,
  Watch,
  Wind,
  Zap,
} from "lucide-react";

/**
 * Centralized, statically-imported allowlist of Lucide icons the admin
 * CMS is permitted to choose from, and the ONLY source either the admin
 * icon picker or the public homepage reads a stored icon name against.
 * Every entry is a real, directly-imported component — never a dynamic
 * `import()`/`require()` keyed by a database string, so a saved icon
 * name can only ever resolve to one of these fixed components or fail
 * safely (see `getIconComponent` below), never execute arbitrary code.
 *
 * Curated to healthcare/trust/navigation-relevant icons rather than
 * Lucide's full 1000+ set — a finite, searchable, relevant list serves
 * the admin picker better than an unbounded one.
 */
export const ICON_REGISTRY: Record<string, LucideIcon> = {
  Activity,
  Ambulance,
  Award,
  Baby,
  Bandage,
  Bed,
  Bell,
  BicepsFlexed,
  Bone,
  Book,
  BookOpen,
  Brain,
  Briefcase,
  Building,
  Building2,
  Calendar,
  CalendarHeart,
  Check,
  CheckCircle,
  Clipboard,
  ClipboardCheck,
  Clock,
  Compass,
  Cross,
  Crosshair,
  Droplet,
  Ear,
  Eye,
  FileCheck,
  FileText,
  Flag,
  FlaskConical,
  Globe,
  Hand,
  HandHeart,
  HeartHandshake,
  Heart,
  HeartPulse,
  Home,
  Hospital,
  Key,
  Layers,
  Leaf,
  LifeBuoy,
  Lightbulb,
  Lock,
  MapPin,
  MapPinned,
  MessageCircle,
  Microscope,
  Navigation,
  Pill,
  Phone,
  PhoneCall,
  Plus,
  PlusCircle,
  Quote,
  Scale,
  Scan,
  Shield,
  ShieldCheck,
  ShieldPlus,
  Smile,
  Sparkles,
  Stethoscope,
  Sun,
  Syringe,
  Target,
  Thermometer,
  ThumbsUp,
  Timer,
  Trophy,
  UserCheck,
  UserRound,
  Users,
  UsersRound,
  Wallet,
  Watch,
  Wind,
  Zap,
};

export type IconName = keyof typeof ICON_REGISTRY;

/** Alphabetically sorted list of every allowlisted icon name — what the admin picker searches/renders. */
export const ICON_NAMES: IconName[] = Object.keys(ICON_REGISTRY).sort((a, b) => a.localeCompare(b));

/** Validates a stored/submitted icon name against the allowlist — the single gate both the Zod validator and the public renderer go through. */
export function isValidIconName(name: string): name is IconName {
  return Object.prototype.hasOwnProperty.call(ICON_REGISTRY, name);
}

/**
 * Resolves a stored icon name to its real component, falling back to
 * `fallback` (never throwing, never rendering nothing) when the stored
 * value is missing, was never a real icon, or was removed from the
 * allowlist since it was saved — e.g. by a manual DB edit bypassing the
 * validator.
 */
export function getIconComponent(name: string | null | undefined, fallback: LucideIcon): LucideIcon {
  if (!name) return fallback;
  return isValidIconName(name) ? ICON_REGISTRY[name] : fallback;
}
