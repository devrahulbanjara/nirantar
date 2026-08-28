import {
  GaugeIcon,
  MoonIcon,
  PencilSimpleIcon,
  PlusIcon,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";

/**
 * Closed glyph names that can cross the Server → Client boundary.
 * Pass the name, never the icon component.
 */
export type TriggerGlyph = "plus" | "pencil" | "weight" | "sleep";

export const TRIGGER_GLYPHS: Record<TriggerGlyph, Icon> = {
  plus: PlusIcon,
  pencil: PencilSimpleIcon,
  weight: GaugeIcon,
  sleep: MoonIcon,
};
