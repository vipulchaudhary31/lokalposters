# Poster Aura Implementation

This document describes how the current React Native poster background effect is implemented in [App.tsx](/Users/vipulchaudhary/Desktop/lokalposters/App.tsx), and how it maps to the web prototype spec you shared.

## Goal

Recreate the web "aura" background treatment behind poster images so the empty vertical space:

- stays in the same hue family as the header
- feels soft and atmospheric instead of flat
- works reliably on both iOS and Android

The native implementation uses `react-native-svg` gradients and full-frame overlay layers. It does not use DOM canvas, CSS `filter: blur(...)`, or browser-only radial-gradient behavior.

## Where It Lives

Main implementation:

- [App.tsx](/Users/vipulchaudhary/Desktop/lokalposters/App.tsx)

Relevant pieces:

- `AuraParams`
- `AuraPalette`
- `buildAuraPalette(...)`
- `PosterStageBackdrop(...)`
- `headerBackgroundColor`

## Current Data Flow

Each feed item still carries a `dominantHex`:

```ts
type PosterStagePalette = {
  dominantHex: string;
};
```

Right now, the native aura effect derives all palette values from that existing `dominantHex`.

Important difference from the web prototype:

- Web version: extracts palette directly from image pixels using a `16x16` canvas sample.
- Native version: does not yet sample the actual image bitmap on-device.
- Native version instead synthesizes `vibrant`, `muted`, and `darkened` from `dominantHex`.

So the current implementation matches the palette math shape, but not the image-sampling source.

## Header Color

The top categories header is still unchanged and uses the active poster dominant color mixed toward black:

```ts
const headerBackgroundColor = mixHexOverBlack(
  activeFeedItem.palette.dominantHex,
  0.56,
);
```

This means:

- header color is the canonical tone anchor
- poster aura should feel like a softer, more atmospheric extension of that same family

## Aura Params

Current tuning object:

```ts
const AURA_PARAMS: AuraParams = {
  gradientMidOpacity: 0.16,
  gradientMidPoint: 0.52,
  glowOpacity: 0.34,
  accentBlobOpacity: 0.28,
  accentBlobBlur: 36,
  vignetteOpacity: 0.3,
  shadowY: 24,
  shadowBlur: 56,
  shadowOpacity: 0.18,
  shadowColorMatch: 0.3,
};
```

Notes:

- `accentBlobBlur`, `shadowY`, `shadowBlur`, `shadowOpacity`, and `shadowColorMatch` are currently defined for parity with the original prototype intent.
- In the current native renderer, the visible effect is driven mainly by SVG gradients rather than real blurred view layers.
- So some knobs exist conceptually, but are not yet expressed 1:1 in the final render output.

## Palette Derivation

Current helper:

```ts
function buildAuraPalette(dominantHex: string): AuraPalette
```

It computes:

- `dominant`: parsed from `dominantHex`
- `vibrant`: saturation-boosted version
- `muted`: pastel/washed-out version
- `darkened`: darkened version

This follows the same broad math intent as the web prototype:

- `vibrant` = boosted, brighter accent color
- `muted` = softer mid wash
- `darkened` = darker supporting tone

## Current Render Stack

The native implementation currently renders the backdrop in `PosterStageBackdrop(...)` using one `Svg` with layered fills.

### Layer 1: Base Fill

Uses the dominant color scaled by `AURA_INTENSITY = 0.6`.

Equivalent intent to web:

- solid base fill
- darker than the raw dominant
- still color-related to the poster/header

### Layer 2: Vertical Wash

Rendered as a full-height linear gradient:

- top = base color
- middle = muted color with reduced opacity
- bottom = base color

This approximates the atmospheric center softening from the web version.

Difference from web:

- web version used a simpler base + separate radial overlays
- native version currently folds some of that tonal variation into the vertical wash layer

### Layer 3: Center Glow

Rendered as a full-frame radial gradient centered in the middle of the poster area.

Equivalent intent to web:

- soft vibrant glow
- centered
- helps prevent the backdrop from feeling dead/flat

### Layer 4: Top-Right Accent Blob

Rendered as a radial gradient positioned near the top-right area.

Equivalent intent to web:

- off-axis accent energy
- more colorful than the base
- creates asymmetry

Difference from web:

- web version used an actual blurred positioned DOM element
- native version approximates this using a radial SVG gradient spread over the full canvas

### Layer 5: Bottom-Left Secondary Blob

Rendered as another radial gradient near the bottom-left using the dominant family instead of the vibrant one.

Equivalent intent to web:

- balances the top-right accent
- keeps the composition from feeling too one-sided

### Layer 6: Vignette

Rendered as a final radial gradient with:

- transparent center
- darker edge falloff

Equivalent intent to web:

- darken edges
- focus attention inward

## Why It May Still Differ From Web

These are the main reasons you may still notice discrepancies:

### 1. No true image sampling yet

The web prototype computes palette from the real image pixels.

Current native version uses:

- existing `dominantHex`
- derived values from that single color

Impact:

- less image-specific nuance
- weaker match for posters whose brightest/vibrant areas differ a lot from the dominant color

### 2. No real blurred blob layers

The web prototype uses:

- absolutely positioned blobs
- heavy CSS blur

Current native version uses:

- SVG radial gradients as a visual approximation

Impact:

- edges may feel cleaner or harder than web
- blob spread may not feel as airy or organic

### 3. Different gradient engines

Browser CSS gradients and `react-native-svg` gradients do not always look identical.

Impact:

- falloff may feel tighter
- center glow may appear weaker/stronger
- vignette edge timing may differ

### 4. Poster `contain` layout

The poster image itself is rendered with:

```ts
<Image contentFit="contain" ... />
```

Impact:

- the aura backdrop is visible only in the leftover vertical space around the poster
- if the poster occupies most of the height, the aura can feel subtler than expected

## Verification Checklist

When comparing to the web version, verify these separately:

### Color Family

- Does the backdrop clearly belong to the same family as the header tint?
- Does it avoid drifting into unrelated hues?

### Center Glow

- Is there visible lift in the middle of the empty space?
- Is it soft, or does it feel flat/absent?

### Accent Balance

- Can you feel a top-right push and a bottom-left counterweight?
- Or does the whole field look uniformly tinted?

### Vignette

- Are the edges slightly darker than the center?
- Is the falloff too strong, too weak, or too abrupt?

### Atmospheric Softness

- Does it feel like color floating behind the poster?
- Or like a hard block / plain gradient / dark matte?

## If We Want a Closer 1:1 Match Next

These are the most likely next fixes, in order:

1. Implement true palette extraction from the real local poster images instead of relying on `dominantHex`.
2. Replace or augment SVG radial blobs with actual native blurred layers where platform support is acceptable.
3. Retune the glow radius, blob radius, and vignette falloff using side-by-side screenshots.
4. Separate "base fill" and "mid wash" more faithfully to the web stack if the current composition feels too compressed.

## Current Status Summary

What is already matched:

- same conceptual palette roles: dominant / vibrant / muted / darkened
- same conceptual 5-layer aura structure
- same cohesive relationship to the header color family
- native-safe rendering approach for iOS and Android

What is not yet fully matched:

- true image-based palette extraction
- real blurred blob behavior
- exact browser gradient feel

That gap is likely where the remaining visual discrepancies are coming from.
