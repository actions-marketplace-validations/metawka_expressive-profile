import {
  argbFromHex,
  hexFromArgb,
  Hct,
  SchemeExpressive,
  SchemeFidelity,
  SchemeMonochrome,
  SchemeTonalSpot,
  SchemeVibrant,
} from "@material/material-color-utilities";
import type { Palette, SchemeName } from "./types";

const SCHEMES = {
  tonalSpot: SchemeTonalSpot,
  vibrant: SchemeVibrant,
  expressive: SchemeExpressive,
  fidelity: SchemeFidelity,
  monochrome: SchemeMonochrome,
};

const ROLES = [
  "primary", "onPrimary", "primaryContainer", "onPrimaryContainer",
  "secondary", "onSecondary", "secondaryContainer", "onSecondaryContainer",
  "tertiary", "onTertiary", "tertiaryContainer", "onTertiaryContainer",
  "error", "onError", "errorContainer", "onErrorContainer",
  "surface", "surfaceDim", "surfaceBright", "surfaceContainerLowest", "surfaceContainerLow",
  "surfaceContainer", "surfaceContainerHigh", "surfaceContainerHighest",
  "onSurface", "onSurfaceVariant", "outline", "outlineVariant", "inverseSurface", "inverseOnSurface",
  "inversePrimary", "scrim", "shadow",
] as const;

export function palette(seed: string, scheme: SchemeName, dark: boolean): Palette {
  const Scheme = SCHEMES[scheme] ?? SchemeTonalSpot;
  const s = new Scheme(Hct.fromInt(argbFromHex(seed)), dark, 0) as unknown as Record<string, number>;
  const out: Palette = {};
  for (const r of ROLES) out[r] = hexFromArgb(s[r]);
  return out;
}
