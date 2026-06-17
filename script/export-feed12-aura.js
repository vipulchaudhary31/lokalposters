const fs = require('fs');
const path = require('path');

const width = 1080;
const height = 2340;
const dominantHex = '#0A8A83';

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

function normalizeHex(hex) {
  const normalizedHex = hex.replace('#', '');
  return /^[0-9A-Fa-f]{6}$/.test(normalizedHex) ? normalizedHex : null;
}

function mixHex(sourceHex, targetHex, sourceWeight) {
  const normalizedSourceHex = normalizeHex(sourceHex);
  const normalizedTargetHex = normalizeHex(targetHex);

  if (!normalizedSourceHex || !normalizedTargetHex) {
    return '#000000';
  }

  const weight = Math.max(0, Math.min(1, sourceWeight));
  const red = Math.round(
    parseInt(normalizedSourceHex.slice(0, 2), 16) * weight +
      parseInt(normalizedTargetHex.slice(0, 2), 16) * (1 - weight),
  );
  const green = Math.round(
    parseInt(normalizedSourceHex.slice(2, 4), 16) * weight +
      parseInt(normalizedTargetHex.slice(2, 4), 16) * (1 - weight),
  );
  const blue = Math.round(
    parseInt(normalizedSourceHex.slice(4, 6), 16) * weight +
      parseInt(normalizedTargetHex.slice(4, 6), 16) * (1 - weight),
  );

  return `#${[red, green, blue]
    .map((channel) => channel.toString(16).padStart(2, '0'))
    .join('')}`;
}

function hexToRgb(hex) {
  const normalizedHex = normalizeHex(hex);

  if (!normalizedHex) {
    return [0, 0, 0];
  }

  return [
    parseInt(normalizedHex.slice(0, 2), 16),
    parseInt(normalizedHex.slice(2, 4), 16),
    parseInt(normalizedHex.slice(4, 6), 16),
  ];
}

function clampRgb(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function clampNumber(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function rgb([red, green, blue]) {
  return `rgb(${red}, ${green}, ${blue})`;
}

function buildAuraPalette(hex) {
  const [dr, dg, db] = hexToRgb(hex);
  const avg = (dr + dg + db) / 3;
  const boost = 1.5;

  return {
    darkened: [
      clampRgb(dr * 0.35),
      clampRgb(dg * 0.35),
      clampRgb(db * 0.35),
    ],
    dominant: [dr, dg, db],
    muted: [
      clampRgb(avg * 0.4 + dr * 0.2 + 120),
      clampRgb(avg * 0.4 + dg * 0.2 + 120),
      clampRgb(avg * 0.4 + db * 0.2 + 120),
    ],
    vibrant: [
      clampRgb(avg + (dr - avg) * boost + 30),
      clampRgb(avg + (dg - avg) * boost + 30),
      clampRgb(avg + (db - avg) * boost + 30),
    ],
  };
}

function createSeededRandom(seedSource) {
  let seed = 0;

  for (let index = 0; index < seedSource.length; index += 1) {
    seed = (seed * 31 + seedSource.charCodeAt(index)) >>> 0;
  }

  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function buildAuraSpeckles(hex, palette, canvasWidth, canvasHeight) {
  const random = createSeededRandom(hex);
  const speckles = [];

  for (let index = 0; index < 56; index += 1) {
    const useVibrant = random() > 0.6;
    speckles.push({
      color: useVibrant ? palette.vibrant : palette.muted,
      opacity: 0.012 + random() * 0.028,
      radius: 0.9 + random() * 2.6,
      x: random() * canvasWidth,
      y: random() * canvasHeight,
    });
  }

  return speckles;
}

function getPosterBackdropModel(hex, palette, canvasWidth, canvasHeight, auraParams) {
  const baseColor = hexToRgb(mixHex(hex, '#120D14', 0.26));
  const topShadeColor = hexToRgb(mixHex(hex, '#17111A', 0.3));
  const edgeShadeColor = hexToRgb(mixHex(hex, '#0B0810', 0.16));
  const bottomLiftColor = hexToRgb(mixHex(hex, '#2A1E2F', 0.42));
  const speckles = buildAuraSpeckles(hex, palette, canvasWidth, canvasHeight);
  const intensityScale = auraParams.intensity / DEFAULT_AURA_PARAMS.intensity;
  const blobSpreadScale = auraParams.accentBlobBlur / DEFAULT_AURA_PARAMS.accentBlobBlur;

  return {
    baseColor,
    bottomBlobRadius: Math.max(canvasWidth * 0.66, canvasHeight * 0.28) * blobSpreadScale,
    bottomLiftColor,
    centerGlowRadius:
      Math.max(canvasWidth * 0.84, canvasHeight * 0.48) * (0.92 + intensityScale * 0.08),
    edgeShadeColor,
    sideGlowRadius:
      Math.max(canvasWidth * 0.7, canvasHeight * 0.36) * (0.94 + blobSpreadScale * 0.06),
    speckles,
    topBlobRadius: Math.max(canvasWidth * 0.74, canvasHeight * 0.34) * blobSpreadScale,
    topShadeColor,
    vignetteRadius: Math.max(canvasWidth * 1.02, canvasHeight * 0.8),
  };
}

const palette = buildAuraPalette(dominantHex);
const model = getPosterBackdropModel(
  dominantHex,
  palette,
  width,
  height,
  DEFAULT_AURA_PARAMS,
);
const intensityScale = DEFAULT_AURA_PARAMS.intensity / DEFAULT_AURA_PARAMS.intensity;

const idBase = `poster-stage-aura-${dominantHex.replace('#', '')}`;
const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="${idBase}-base-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${rgb(model.topShadeColor)}" stop-opacity="1" />
      <stop offset="${DEFAULT_AURA_PARAMS.gradientMidPoint}%" stop-color="${rgb(model.baseColor)}" stop-opacity="${DEFAULT_AURA_PARAMS.gradientMidOpacity}" />
      <stop offset="100%" stop-color="${rgb(model.bottomLiftColor)}" stop-opacity="1" />
    </linearGradient>
    <radialGradient id="${idBase}-center-haze" gradientUnits="userSpaceOnUse" cx="${width * 0.5}" cy="${height * 0.56}" r="${Math.max(width * 0.9, height * 0.54)}">
      <stop offset="0%" stop-color="${rgb(palette.muted)}" stop-opacity="0.22" />
      <stop offset="52%" stop-color="${rgb(palette.muted)}" stop-opacity="0.08" />
      <stop offset="100%" stop-color="${rgb(palette.muted)}" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="${idBase}-center-glow" gradientUnits="userSpaceOnUse" cx="${width * 0.5}" cy="${height * 0.44}" r="${model.centerGlowRadius}">
      <stop offset="0%" stop-color="${rgb(palette.vibrant)}" stop-opacity="${clampNumber(DEFAULT_AURA_PARAMS.glowOpacity * intensityScale, 0, 1)}" />
      <stop offset="58%" stop-color="${rgb(palette.vibrant)}" stop-opacity="0.14" />
      <stop offset="100%" stop-color="${rgb(palette.vibrant)}" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="${idBase}-top-blob" gradientUnits="userSpaceOnUse" cx="${width * 0.88}" cy="${height * 0.04}" r="${model.topBlobRadius}">
      <stop offset="0%" stop-color="${rgb(palette.vibrant)}" stop-opacity="${clampNumber(DEFAULT_AURA_PARAMS.accentBlobOpacity * intensityScale, 0, 1)}" />
      <stop offset="54%" stop-color="${rgb(palette.vibrant)}" stop-opacity="${clampNumber(DEFAULT_AURA_PARAMS.accentBlobOpacity * intensityScale * 0.24, 0, 1)}" />
      <stop offset="100%" stop-color="${rgb(palette.vibrant)}" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="${idBase}-bottom-blob" gradientUnits="userSpaceOnUse" cx="${width * 0.18}" cy="${height * 0.92}" r="${model.bottomBlobRadius}">
      <stop offset="0%" stop-color="${rgb(palette.dominant)}" stop-opacity="${clampNumber(DEFAULT_AURA_PARAMS.accentBlobOpacity * intensityScale * 0.6, 0, 1)}" />
      <stop offset="56%" stop-color="${rgb(palette.dominant)}" stop-opacity="${clampNumber(DEFAULT_AURA_PARAMS.accentBlobOpacity * intensityScale * 0.18, 0, 1)}" />
      <stop offset="100%" stop-color="${rgb(palette.dominant)}" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="${idBase}-side-glow" gradientUnits="userSpaceOnUse" cx="${width * 1.04}" cy="${height * 0.72}" r="${model.sideGlowRadius}">
      <stop offset="0%" stop-color="${rgb(palette.vibrant)}" stop-opacity="0.18" />
      <stop offset="58%" stop-color="${rgb(palette.vibrant)}" stop-opacity="0.06" />
      <stop offset="100%" stop-color="${rgb(palette.vibrant)}" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="${idBase}-vignette" gradientUnits="userSpaceOnUse" cx="${width * 0.5}" cy="${height * 0.5}" r="${model.vignetteRadius}">
      <stop offset="34%" stop-color="#000000" stop-opacity="0" />
      <stop offset="100%" stop-color="#000000" stop-opacity="${clampNumber(DEFAULT_AURA_PARAMS.vignetteOpacity * intensityScale, 0, 1)}" />
    </radialGradient>
    <linearGradient id="${idBase}-top-veil" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${rgb(model.edgeShadeColor)}" stop-opacity="0.46" />
      <stop offset="42%" stop-color="${rgb(model.edgeShadeColor)}" stop-opacity="0.08" />
      <stop offset="100%" stop-color="${rgb(model.edgeShadeColor)}" stop-opacity="0" />
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="${width}" height="${height}" fill="${rgb(model.baseColor)}" />
  <rect x="0" y="0" width="${width}" height="${height}" fill="url(#${idBase}-base-gradient)" />
  <rect x="0" y="0" width="${width}" height="${height}" fill="url(#${idBase}-center-haze)" />
  <rect x="0" y="0" width="${width}" height="${height}" fill="url(#${idBase}-center-glow)" />
  <rect x="0" y="0" width="${width}" height="${height}" fill="url(#${idBase}-top-blob)" />
  <rect x="0" y="0" width="${width}" height="${height}" fill="url(#${idBase}-bottom-blob)" />
  <rect x="0" y="0" width="${width}" height="${height}" fill="url(#${idBase}-side-glow)" />
  <rect x="0" y="0" width="${width}" height="${height}" fill="url(#${idBase}-top-veil)" />
  ${model.speckles.map((speckle) => (
    `<circle cx="${speckle.x}" cy="${speckle.y}" r="${speckle.radius}" fill="${rgb(speckle.color)}" opacity="${clampNumber(speckle.opacity * (0.88 + intensityScale * 0.12), 0, 1)}" />`
  )).join('\n  ')}
  <rect x="0" y="0" width="${width}" height="${height}" fill="url(#${idBase}-vignette)" />
</svg>
`;

const outputDir = path.join(__dirname, '..', 'exports');
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(path.join(outputDir, 'feed-12-aura-1080x2340.svg'), svg);
