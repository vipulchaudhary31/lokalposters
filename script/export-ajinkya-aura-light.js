const fs = require('fs');
const path = require('path');

const width = 1080;
const height = 2340;
const dominantHex = '#5B43A3';

const DEFAULT_AURA_PARAMS = {
  intensity: 0.68,
  gradientMidOpacity: 0.78,
  gradientMidPoint: 42,
  glowOpacity: 0.6,
  accentBlobOpacity: 0.46,
  accentBlobBlur: 88,
  vignetteOpacity: 0.14,
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
  const boost = 1.55;

  return {
    dominant: [dr, dg, db],
    muted: [
      clampRgb(avg * 0.34 + dr * 0.28 + 136),
      clampRgb(avg * 0.34 + dg * 0.28 + 136),
      clampRgb(avg * 0.34 + db * 0.28 + 136),
    ],
    vibrant: [
      clampRgb(avg + (dr - avg) * boost + 42),
      clampRgb(avg + (dg - avg) * boost + 42),
      clampRgb(avg + (db - avg) * boost + 42),
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
  const random = createSeededRandom(`${hex}-light`);
  const speckles = [];

  for (let index = 0; index < 56; index += 1) {
    const useVibrant = random() > 0.56;
    speckles.push({
      color: useVibrant ? palette.vibrant : palette.muted,
      opacity: 0.01 + random() * 0.022,
      radius: 0.9 + random() * 2.4,
      x: random() * canvasWidth,
      y: random() * canvasHeight,
    });
  }

  return speckles;
}

const palette = buildAuraPalette(dominantHex);
const baseColor = hexToRgb(mixHex(dominantHex, '#2E2740', 0.5));
const topShadeColor = hexToRgb(mixHex(dominantHex, '#2A223C', 0.46));
const edgeShadeColor = hexToRgb(mixHex(dominantHex, '#1B1627', 0.28));
const bottomLiftColor = hexToRgb(mixHex(dominantHex, '#53417F', 0.56));
const speckles = buildAuraSpeckles(dominantHex, palette, width, height);
const centerGlowRadius = Math.max(width * 0.9, height * 0.5);
const topBlobRadius = Math.max(width * 0.8, height * 0.36);
const bottomBlobRadius = Math.max(width * 0.72, height * 0.3);
const sideGlowRadius = Math.max(width * 0.76, height * 0.4);
const vignetteRadius = Math.max(width * 1.02, height * 0.8);
const idBase = 'poster-stage-aura-ajinkya-light';

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="${idBase}-base-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${rgb(topShadeColor)}" stop-opacity="1" />
      <stop offset="${DEFAULT_AURA_PARAMS.gradientMidPoint}%" stop-color="${rgb(baseColor)}" stop-opacity="${DEFAULT_AURA_PARAMS.gradientMidOpacity}" />
      <stop offset="100%" stop-color="${rgb(bottomLiftColor)}" stop-opacity="1" />
    </linearGradient>
    <radialGradient id="${idBase}-center-haze" gradientUnits="userSpaceOnUse" cx="${width * 0.5}" cy="${height * 0.54}" r="${Math.max(width * 0.94, height * 0.58)}">
      <stop offset="0%" stop-color="${rgb(palette.muted)}" stop-opacity="0.28" />
      <stop offset="52%" stop-color="${rgb(palette.muted)}" stop-opacity="0.11" />
      <stop offset="100%" stop-color="${rgb(palette.muted)}" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="${idBase}-center-glow" gradientUnits="userSpaceOnUse" cx="${width * 0.48}" cy="${height * 0.42}" r="${centerGlowRadius}">
      <stop offset="0%" stop-color="${rgb(palette.vibrant)}" stop-opacity="${DEFAULT_AURA_PARAMS.glowOpacity}" />
      <stop offset="58%" stop-color="${rgb(palette.vibrant)}" stop-opacity="0.18" />
      <stop offset="100%" stop-color="${rgb(palette.vibrant)}" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="${idBase}-top-blob" gradientUnits="userSpaceOnUse" cx="${width * 0.88}" cy="${height * 0.05}" r="${topBlobRadius}">
      <stop offset="0%" stop-color="${rgb(palette.vibrant)}" stop-opacity="${DEFAULT_AURA_PARAMS.accentBlobOpacity}" />
      <stop offset="56%" stop-color="${rgb(palette.vibrant)}" stop-opacity="0.14" />
      <stop offset="100%" stop-color="${rgb(palette.vibrant)}" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="${idBase}-bottom-blob" gradientUnits="userSpaceOnUse" cx="${width * 0.22}" cy="${height * 0.92}" r="${bottomBlobRadius}">
      <stop offset="0%" stop-color="${rgb(palette.dominant)}" stop-opacity="0.3" />
      <stop offset="56%" stop-color="${rgb(palette.dominant)}" stop-opacity="0.1" />
      <stop offset="100%" stop-color="${rgb(palette.dominant)}" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="${idBase}-side-glow" gradientUnits="userSpaceOnUse" cx="${width * 1.02}" cy="${height * 0.72}" r="${sideGlowRadius}">
      <stop offset="0%" stop-color="${rgb(palette.vibrant)}" stop-opacity="0.2" />
      <stop offset="58%" stop-color="${rgb(palette.vibrant)}" stop-opacity="0.07" />
      <stop offset="100%" stop-color="${rgb(palette.vibrant)}" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="${idBase}-vignette" gradientUnits="userSpaceOnUse" cx="${width * 0.5}" cy="${height * 0.5}" r="${vignetteRadius}">
      <stop offset="36%" stop-color="#000000" stop-opacity="0" />
      <stop offset="100%" stop-color="#000000" stop-opacity="${DEFAULT_AURA_PARAMS.vignetteOpacity}" />
    </radialGradient>
    <linearGradient id="${idBase}-top-veil" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${rgb(edgeShadeColor)}" stop-opacity="0.32" />
      <stop offset="42%" stop-color="${rgb(edgeShadeColor)}" stop-opacity="0.05" />
      <stop offset="100%" stop-color="${rgb(edgeShadeColor)}" stop-opacity="0" />
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="${width}" height="${height}" fill="${rgb(baseColor)}" />
  <rect x="0" y="0" width="${width}" height="${height}" fill="url(#${idBase}-base-gradient)" />
  <rect x="0" y="0" width="${width}" height="${height}" fill="url(#${idBase}-center-haze)" />
  <rect x="0" y="0" width="${width}" height="${height}" fill="url(#${idBase}-center-glow)" />
  <rect x="0" y="0" width="${width}" height="${height}" fill="url(#${idBase}-top-blob)" />
  <rect x="0" y="0" width="${width}" height="${height}" fill="url(#${idBase}-bottom-blob)" />
  <rect x="0" y="0" width="${width}" height="${height}" fill="url(#${idBase}-side-glow)" />
  <rect x="0" y="0" width="${width}" height="${height}" fill="url(#${idBase}-top-veil)" />
  ${speckles
    .map(
      (speckle) =>
        `<circle cx="${speckle.x}" cy="${speckle.y}" r="${speckle.radius}" fill="${rgb(speckle.color)}" opacity="${clampNumber(speckle.opacity, 0, 1)}" />`,
    )
    .join('\n  ')}
  <rect x="0" y="0" width="${width}" height="${height}" fill="url(#${idBase}-vignette)" />
</svg>
`;

const outputDir = path.join(__dirname, '..', 'exports');
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(path.join(outputDir, 'ajinkya-feed-aura-light-1080x2340.svg'), svg);
