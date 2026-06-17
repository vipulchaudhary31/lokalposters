const fs = require('fs');
const path = require('path');

const width = 1080;
const height = 2340;

const heroes = [
  { dominantHex: '#8C66AF', slug: 'hero-1' },
  { dominantHex: '#847949', slug: 'hero-2' },
  { dominantHex: '#B4755A', slug: 'hero-3' },
];

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
    dominant: [dr, dg, db],
    muted: [
      clampRgb(avg * 0.38 + dr * 0.24 + 128),
      clampRgb(avg * 0.38 + dg * 0.24 + 128),
      clampRgb(avg * 0.38 + db * 0.24 + 128),
    ],
    vibrant: [
      clampRgb(avg + (dr - avg) * boost + 34),
      clampRgb(avg + (dg - avg) * boost + 34),
      clampRgb(avg + (db - avg) * boost + 34),
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
  const random = createSeededRandom(`${hex}-payment-nudge`);
  const speckles = [];

  for (let index = 0; index < 56; index += 1) {
    const useVibrant = random() > 0.6;
    speckles.push({
      color: useVibrant ? palette.vibrant : palette.muted,
      opacity: 0.011 + random() * 0.024,
      radius: 0.9 + random() * 2.5,
      x: random() * canvasWidth,
      y: random() * canvasHeight,
    });
  }

  return speckles;
}

function buildSvg(dominantHex, slug) {
  const palette = buildAuraPalette(dominantHex);
  const baseColor = hexToRgb(mixHex(dominantHex, '#20182E', 0.48));
  const topShadeColor = hexToRgb(mixHex(dominantHex, '#1A1425', 0.4));
  const edgeShadeColor = hexToRgb(mixHex(dominantHex, '#120D1A', 0.22));
  const bottomLiftColor = hexToRgb(mixHex(dominantHex, '#473566', 0.5));
  const speckles = buildAuraSpeckles(dominantHex, palette, width, height);
  const centerGlowRadius = Math.max(width * 0.88, height * 0.49);
  const topBlobRadius = Math.max(width * 0.76, height * 0.35);
  const bottomBlobRadius = Math.max(width * 0.68, height * 0.29);
  const sideGlowRadius = Math.max(width * 0.72, height * 0.38);
  const vignetteRadius = Math.max(width * 1.02, height * 0.8);
  const idBase = `payment-nudge-aura-${slug}`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="${idBase}-base-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${rgb(topShadeColor)}" stop-opacity="1" />
      <stop offset="44%" stop-color="${rgb(baseColor)}" stop-opacity="0.75" />
      <stop offset="100%" stop-color="${rgb(bottomLiftColor)}" stop-opacity="1" />
    </linearGradient>
    <radialGradient id="${idBase}-center-haze" gradientUnits="userSpaceOnUse" cx="${width * 0.5}" cy="${height * 0.56}" r="${Math.max(width * 0.92, height * 0.56)}">
      <stop offset="0%" stop-color="${rgb(palette.muted)}" stop-opacity="0.24" />
      <stop offset="52%" stop-color="${rgb(palette.muted)}" stop-opacity="0.09" />
      <stop offset="100%" stop-color="${rgb(palette.muted)}" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="${idBase}-center-glow" gradientUnits="userSpaceOnUse" cx="${width * 0.5}" cy="${height * 0.44}" r="${centerGlowRadius}">
      <stop offset="0%" stop-color="${rgb(palette.vibrant)}" stop-opacity="0.56" />
      <stop offset="58%" stop-color="${rgb(palette.vibrant)}" stop-opacity="0.16" />
      <stop offset="100%" stop-color="${rgb(palette.vibrant)}" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="${idBase}-top-blob" gradientUnits="userSpaceOnUse" cx="${width * 0.88}" cy="${height * 0.04}" r="${topBlobRadius}">
      <stop offset="0%" stop-color="${rgb(palette.vibrant)}" stop-opacity="0.44" />
      <stop offset="54%" stop-color="${rgb(palette.vibrant)}" stop-opacity="0.11" />
      <stop offset="100%" stop-color="${rgb(palette.vibrant)}" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="${idBase}-bottom-blob" gradientUnits="userSpaceOnUse" cx="${width * 0.18}" cy="${height * 0.92}" r="${bottomBlobRadius}">
      <stop offset="0%" stop-color="${rgb(palette.dominant)}" stop-opacity="0.28" />
      <stop offset="56%" stop-color="${rgb(palette.dominant)}" stop-opacity="0.09" />
      <stop offset="100%" stop-color="${rgb(palette.dominant)}" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="${idBase}-side-glow" gradientUnits="userSpaceOnUse" cx="${width * 1.04}" cy="${height * 0.72}" r="${sideGlowRadius}">
      <stop offset="0%" stop-color="${rgb(palette.vibrant)}" stop-opacity="0.19" />
      <stop offset="58%" stop-color="${rgb(palette.vibrant)}" stop-opacity="0.065" />
      <stop offset="100%" stop-color="${rgb(palette.vibrant)}" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="${idBase}-vignette" gradientUnits="userSpaceOnUse" cx="${width * 0.5}" cy="${height * 0.5}" r="${vignetteRadius}">
      <stop offset="34%" stop-color="#000000" stop-opacity="0" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0.16" />
    </radialGradient>
    <linearGradient id="${idBase}-top-veil" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${rgb(edgeShadeColor)}" stop-opacity="0.4" />
      <stop offset="42%" stop-color="${rgb(edgeShadeColor)}" stop-opacity="0.06" />
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
}

const outputDir = path.join(__dirname, '..', 'exports', 'payment-nudge-auras');
fs.mkdirSync(outputDir, { recursive: true });

for (const hero of heroes) {
  const svg = buildSvg(hero.dominantHex, hero.slug);
  const outputPath = path.join(outputDir, `payment-nudge-aura-${hero.slug}-1080x2340.svg`);
  fs.writeFileSync(outputPath, svg);
  console.log(outputPath);
}
