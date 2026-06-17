# Android GPU Aura Background

This document extracts the aura background logic currently used in [App.tsx](/Users/vipulchaudhary/Desktop/lokalposters/App.tsx) and rewrites it as an Android-native rendering plan for a React Native app using Kotlin.

The current app renders the aura with `react-native-svg` gradients. For Android, the better visual match to a soft "aura" is:

- keep the same palette math
- keep the same blob positions and sizing rules
- replace fake SVG blob spreads with real GPU blur layers

## What The Effect Actually Is

The aura is not one blur. It is a stack of layers:

1. a dark color-related base fill
2. a large center haze using a muted tone
3. a brighter center glow using a vibrant tone
4. a top-right accent blob
5. a bottom-left balancing blob
6. a side glow near the right edge
7. a darker top veil
8. tiny low-opacity speckles
9. a vignette that darkens the edges

The important part is that all of these layers come from one source color: `dominantHex`.

## Source Logic From The Current App

These are the current defaults from [App.tsx](/Users/vipulchaudhary/Desktop/lokalposters/App.tsx):

```ts
const DEFAULT_AURA_PARAMS = {
  intensity: 0.6,
  gradientMidOpacity: 0.72,
  gradientMidPoint: 44,
  glowOpacity: 0.5,
  accentBlobOpacity: 0.42,
  accentBlobBlur: 80,
  vignetteOpacity: 0.2,
  shadowY: 24,
  shadowBlur: 56,
  shadowOpacity: 0.18,
  shadowColorMatch: 0.3,
};
```

The current palette derivation is:

```ts
function buildAuraPalette(dominantHex: string) {
  const [dr, dg, db] = hexToRgb(dominantHex);
  const avg = (dr + dg + db) / 3;
  const boost = 1.5;

  const vibrant = [
    clamp(avg + (dr - avg) * boost + 30),
    clamp(avg + (dg - avg) * boost + 30),
    clamp(avg + (db - avg) * boost + 30),
  ];

  const muted = [
    clamp(avg * 0.4 + dr * 0.2 + 120),
    clamp(avg * 0.4 + dg * 0.2 + 120),
    clamp(avg * 0.4 + db * 0.2 + 120),
  ];

  const darkened = [
    clamp(dr * 0.35),
    clamp(dg * 0.35),
    clamp(db * 0.35),
  ];

  return {
    dominant: [dr, dg, db],
    vibrant,
    muted,
    darkened,
  };
}
```

The current backdrop model is:

```ts
baseColor = mixHex(dominantHex, "#120D14", 0.26)
topShadeColor = mixHex(dominantHex, "#17111A", 0.3)
edgeShadeColor = mixHex(dominantHex, "#0B0810", 0.16)
bottomLiftColor = mixHex(dominantHex, "#2A1E2F", 0.42)

bottomBlobRadius = max(width * 0.66, height * 0.28) * blobSpreadScale
centerGlowRadius = max(width * 0.84, height * 0.48) * (0.92 + intensityScale * 0.08)
sideGlowRadius = max(width * 0.7, height * 0.36) * (0.94 + blobSpreadScale * 0.06)
topBlobRadius = max(width * 0.74, height * 0.34) * blobSpreadScale
vignetteRadius = max(width * 1.02, height * 0.8)
```

Blob anchors:

- center haze: `x = 0.50w`, `y = 0.56h`
- center glow: `x = 0.50w`, `y = 0.44h`
- top blob: `x = 0.88w`, `y = 0.04h`
- bottom blob: `x = 0.18w`, `y = 0.92h`
- side glow: `x = 1.04w`, `y = 0.72h`
- vignette: `x = 0.50w`, `y = 0.50h`

## Recommended Android Rendering Strategy

For Android in Kotlin, use a native `FrameLayout`-based view exposed to React Native.

Recommended structure:

- parent `AuraBackgroundView : FrameLayout`
- one custom `BaseGradientView` for the base wash and vignette
- three or four absolutely-positioned blob child views
- each blob child gets a GPU blur through `RenderEffect`
- one lightweight speckle overlay view

This gives you real blurred light masses instead of only radial gradients.

## Why `FrameLayout` + Blurred Child Views

`RenderEffect.createBlurEffect(...)` is applied at the view layer level on Android 12+.

That means the easiest GPU path is:

1. create one child view per blob
2. draw a solid oval or radial fill inside that child
3. apply `setRenderEffect(...)` to that child
4. position and scale the child inside the parent

This is simpler than trying to do multi-pass blur manually in a single custom canvas.

## Android Version Guidance

- Best path: Android 12+ using `RenderEffect`
- Fallback path for older Android: draw the same blobs with radial gradients and no real blur
- If you need one codepath for all versions with strong visual parity, consider `react-native-skia`

If your app already targets Android 12+ heavily, `RenderEffect` is the cleanest native option.

## Kotlin Data Model

```kotlin
data class AuraParams(
    val intensity: Float = 0.6f,
    val gradientMidOpacity: Float = 0.72f,
    val gradientMidPoint: Float = 44f,
    val glowOpacity: Float = 0.5f,
    val accentBlobOpacity: Float = 0.42f,
    val accentBlobBlur: Float = 80f,
    val vignetteOpacity: Float = 0.2f,
    val shadowY: Float = 24f,
    val shadowBlur: Float = 56f,
    val shadowOpacity: Float = 0.18f,
    val shadowColorMatch: Float = 0.3f,
)

data class AuraPalette(
    val dominant: Int,
    val vibrant: Int,
    val muted: Int,
    val darkened: Int,
)

data class BlobSpec(
    val centerX: Float,
    val centerY: Float,
    val radius: Float,
    val color: Int,
    val opacity: Float,
    val blurRadius: Float,
)
```

## Kotlin Palette Logic

Keep this logic identical to the current React Native version so the Android port stays visually aligned.

```kotlin
private fun clampChannel(value: Float): Int {
    return value.toInt().coerceIn(0, 255)
}

private fun rgb(r: Int, g: Int, b: Int): Int {
    return android.graphics.Color.rgb(r, g, b)
}

private fun mixRgb(source: Int, target: Int, weight: Float): Int {
    val w = weight.coerceIn(0f, 1f)
    val r = android.graphics.Color.red(source) * w + android.graphics.Color.red(target) * (1f - w)
    val g = android.graphics.Color.green(source) * w + android.graphics.Color.green(target) * (1f - w)
    val b = android.graphics.Color.blue(source) * w + android.graphics.Color.blue(target) * (1f - w)
    return rgb(clampChannel(r), clampChannel(g), clampChannel(b))
}

private fun buildAuraPalette(dominant: Int): AuraPalette {
    val dr = android.graphics.Color.red(dominant).toFloat()
    val dg = android.graphics.Color.green(dominant).toFloat()
    val db = android.graphics.Color.blue(dominant).toFloat()
    val avg = (dr + dg + db) / 3f
    val boost = 1.5f

    val vibrant = rgb(
        clampChannel(avg + (dr - avg) * boost + 30f),
        clampChannel(avg + (dg - avg) * boost + 30f),
        clampChannel(avg + (db - avg) * boost + 30f),
    )

    val muted = rgb(
        clampChannel(avg * 0.4f + dr * 0.2f + 120f),
        clampChannel(avg * 0.4f + dg * 0.2f + 120f),
        clampChannel(avg * 0.4f + db * 0.2f + 120f),
    )

    val darkened = rgb(
        clampChannel(dr * 0.35f),
        clampChannel(dg * 0.35f),
        clampChannel(db * 0.35f),
    )

    return AuraPalette(
        dominant = dominant,
        vibrant = vibrant,
        muted = muted,
        darkened = darkened,
    )
}
```

## Backdrop Model In Kotlin

```kotlin
data class AuraBackdropModel(
    val baseColor: Int,
    val topShadeColor: Int,
    val edgeShadeColor: Int,
    val bottomLiftColor: Int,
    val centerGlowRadius: Float,
    val topBlobRadius: Float,
    val bottomBlobRadius: Float,
    val sideGlowRadius: Float,
    val vignetteRadius: Float,
)

private fun buildBackdropModel(
    dominant: Int,
    width: Float,
    height: Float,
    params: AuraParams,
): AuraBackdropModel {
    val intensityScale = params.intensity / 0.6f
    val blobSpreadScale = params.accentBlobBlur / 80f

    return AuraBackdropModel(
        baseColor = mixRgb(dominant, android.graphics.Color.parseColor("#120D14"), 0.26f),
        topShadeColor = mixRgb(dominant, android.graphics.Color.parseColor("#17111A"), 0.30f),
        edgeShadeColor = mixRgb(dominant, android.graphics.Color.parseColor("#0B0810"), 0.16f),
        bottomLiftColor = mixRgb(dominant, android.graphics.Color.parseColor("#2A1E2F"), 0.42f),
        centerGlowRadius = maxOf(width * 0.84f, height * 0.48f) * (0.92f + intensityScale * 0.08f),
        topBlobRadius = maxOf(width * 0.74f, height * 0.34f) * blobSpreadScale,
        bottomBlobRadius = maxOf(width * 0.66f, height * 0.28f) * blobSpreadScale,
        sideGlowRadius = maxOf(width * 0.70f, height * 0.36f) * (0.94f + blobSpreadScale * 0.06f),
        vignetteRadius = maxOf(width * 1.02f, height * 0.80f),
    )
}
```

## Native View Composition

Suggested child order inside the parent:

1. base gradient view
2. center haze blob
3. center glow blob
4. top-right blob
5. bottom-left blob
6. side glow blob
7. top veil overlay
8. speckle overlay
9. vignette overlay

This order matches the current composition logic from [App.tsx](/Users/vipulchaudhary/Desktop/lokalposters/App.tsx).

## Blob Implementation

Each blob child can be a simple custom `View` that draws a filled oval. The softness should come from `RenderEffect`, not from a hardcoded gradient only.

```kotlin
class AuraBlobView(context: Context) : View(context) {
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG)
    var blobColor: Int = Color.WHITE

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        paint.color = blobColor
        canvas.drawOval(0f, 0f, width.toFloat(), height.toFloat(), paint)
    }
}
```

When placing it:

- set width = `radius * 2`
- set height = `radius * 2`
- place it so its center lands on the normalized anchor
- set alpha from the spec
- apply `RenderEffect.createBlurEffect(blurX, blurY, Shader.TileMode.DECAL)`

Example:

```kotlin
if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
    blobView.setRenderEffect(
        RenderEffect.createBlurEffect(
            blurRadiusPx,
            blurRadiusPx,
            Shader.TileMode.DECAL
        )
    )
}
```

## Suggested Blob Specs

Translate the current design into these native blobs:

### Center haze

- center: `0.50w`, `0.56h`
- size: `max(width * 0.9, height * 0.54) * 2`
- color: `muted`
- alpha: about `0.22`
- blur: `accentBlobBlur * 1.35`

### Center glow

- center: `0.50w`, `0.44h`
- radius: `centerGlowRadius`
- color: `vibrant`
- alpha: `glowOpacity * intensityScale`
- blur: `accentBlobBlur * 1.1`

### Top-right blob

- center: `0.88w`, `0.04h`
- radius: `topBlobRadius`
- color: `vibrant`
- alpha: `accentBlobOpacity * intensityScale`
- blur: `accentBlobBlur`

### Bottom-left blob

- center: `0.18w`, `0.92h`
- radius: `bottomBlobRadius`
- color: `dominant`
- alpha: `accentBlobOpacity * intensityScale * 0.6`
- blur: `accentBlobBlur * 0.95`

### Side glow

- center: `1.04w`, `0.72h`
- radius: `sideGlowRadius`
- color: `vibrant`
- alpha: `0.18`
- blur: `accentBlobBlur * 1.15`

## Base Wash

The base is not a flat color. It is a dark diagonal wash:

- top-left uses `topShadeColor`
- mid point uses `baseColor` at `gradientMidPoint`
- bottom uses `bottomLiftColor`

Implement this in a custom `View` using `LinearGradient`.

```kotlin
class AuraBaseGradientView(context: Context) : View(context) {
    var topColor: Int = Color.BLACK
    var midColor: Int = Color.BLACK
    var bottomColor: Int = Color.BLACK
    var midPoint: Float = 0.44f
    var midOpacity: Float = 0.72f

    private val paint = Paint(Paint.ANTI_ALIAS_FLAG)

    override fun onDraw(canvas: Canvas) {
        val shader = LinearGradient(
            0f,
            0f,
            width.toFloat(),
            height.toFloat(),
            intArrayOf(
                topColor,
                withAlpha(midColor, midOpacity),
                bottomColor,
            ),
            floatArrayOf(0f, midPoint, 1f),
            Shader.TileMode.CLAMP
        )
        paint.shader = shader
        canvas.drawRect(0f, 0f, width.toFloat(), height.toFloat(), paint)
    }
}
```

## Top Veil

The top veil is a separate darkening pass to stop the top from feeling washed out.

- color: `edgeShadeColor`
- gradient:
  - `0% -> alpha 0.46`
  - `42% -> alpha 0.08`
  - `100% -> alpha 0`

This should be another lightweight overlay `View`.

## Vignette

The vignette should be rendered last.

- center: transparent
- edges: black with `vignetteOpacity * intensityScale`
- radius: `vignetteRadius`

You can implement this as a `RadialGradient` in a top overlay `View`.

## Speckles

The current app generates 56 tiny dots using a seeded RNG from `dominantHex`.

Rules from [App.tsx](/Users/vipulchaudhary/Desktop/lokalposters/App.tsx):

- count: `56`
- 40% of the time use `muted`, otherwise use `vibrant`
- opacity: `0.012..0.040`
- radius: `0.9..3.5`
- random `x` and `y` across the whole canvas

These should remain very subtle. They are texture, not confetti.

## React Native Bridge Shape

Expose the native view with small props:

```ts
type AuraBackgroundProps = {
  dominantHex: string;
  intensity?: number;
  accentBlobBlur?: number;
  glowOpacity?: number;
  vignetteOpacity?: number;
};
```

The native side should rebuild the palette and model when:

- size changes
- `dominantHex` changes
- aura params change

## Recommended RN Android Architecture

If you are building this in React Native:

1. create `AuraBackgroundViewManager`
2. expose props like `dominantHex` and `intensity`
3. host all drawing logic in a Kotlin `AuraBackgroundView`
4. place that native view behind your poster/card/image in JS

That keeps JS simple and keeps blur work on the Android render path.

## Important Performance Notes

- Enable hardware acceleration for the screen that hosts this effect.
- Do not create many aura instances in a scrolling list at full resolution.
- Cache the palette and backdrop model by `dominantHex + width + height + params`.
- Reuse child views instead of recreating them on every prop change.
- Keep speckles in a single overlay view, not one view per speckle.

Best practice:

- use the full GPU blur aura only for the active hero/poster
- use a cheaper static gradient fallback for offscreen or list cells

## Practical Implementation Mapping

Use this mapping from the current repo to native Android:

- `buildAuraPalette(...)` -> same Kotlin math
- `getPosterBackdropModel(...)` -> same Kotlin geometry
- `PosterStageBackdrop(...)` -> native `AuraBackgroundView`
- SVG radial layers -> blurred blob child views
- SVG linear overlays -> gradient overlay views

## If You Want The Closest Match To This Repo

Use the current React Native values exactly first:

- same color mixing constants
- same normalized blob anchors
- same radius formulas
- same opacity formulas

Then only tune:

- blur multipliers per blob
- top veil strength
- vignette strength

That will keep the Android-native version visually connected to the current implementation instead of turning into a different effect.

## Short Implementation Summary

If you only need the essence:

1. derive `vibrant`, `muted`, and `darkened` from `dominantHex`
2. build a dark diagonal base gradient from mixed colors
3. place 4 to 5 large colored blobs using normalized positions
4. blur those blob views with `RenderEffect`
5. add a top veil, speckles, and vignette on top
6. expose the whole thing as a native React Native Android view written in Kotlin

That is the aura background logic behind the current app, translated into a GPU-blur-friendly Android implementation plan.
