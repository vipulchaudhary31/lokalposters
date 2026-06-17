const fs = require('fs');
const path = require('path');

const width = 1080;
const height = 2340;

const speckles = [];
let seed = 18473;

function random() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
}

for (let index = 0; index < 72; index += 1) {
  const useWarm = random() > 0.82;
  speckles.push({
    color: useWarm ? 'rgba(110, 78, 84, 0.028)' : 'rgba(255, 255, 255, 0.018)',
    radius: 1 + random() * 2.8,
    x: Math.round(random() * width),
    y: Math.round(random() * height),
  });
}

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="base" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#141414" />
      <stop offset="38%" stop-color="#232323" />
      <stop offset="72%" stop-color="#1B1B1C" />
      <stop offset="100%" stop-color="#101010" />
    </linearGradient>
    <radialGradient id="center-haze" gradientUnits="userSpaceOnUse" cx="${width * 0.52}" cy="${height * 0.42}" r="${Math.max(width * 0.88, height * 0.5)}">
      <stop offset="0%" stop-color="rgba(255,255,255,0.09)" />
      <stop offset="46%" stop-color="rgba(228,228,228,0.045)" />
      <stop offset="100%" stop-color="rgba(228,228,228,0)" />
    </radialGradient>
    <radialGradient id="top-left-mist" gradientUnits="userSpaceOnUse" cx="${width * 0.18}" cy="${height * 0.08}" r="${Math.max(width * 0.64, height * 0.3)}">
      <stop offset="0%" stop-color="rgba(255,255,255,0.06)" />
      <stop offset="60%" stop-color="rgba(255,255,255,0.018)" />
      <stop offset="100%" stop-color="rgba(255,255,255,0)" />
    </radialGradient>
    <radialGradient id="bottom-lift" gradientUnits="userSpaceOnUse" cx="${width * 0.48}" cy="${height * 0.9}" r="${Math.max(width * 0.9, height * 0.34)}">
      <stop offset="0%" stop-color="rgba(72,72,76,0.58)" />
      <stop offset="58%" stop-color="rgba(54,54,58,0.16)" />
      <stop offset="100%" stop-color="rgba(54,54,58,0)" />
    </radialGradient>
    <radialGradient id="side-shadow" gradientUnits="userSpaceOnUse" cx="${width * 1.02}" cy="${height * 0.5}" r="${Math.max(width * 0.86, height * 0.52)}">
      <stop offset="0%" stop-color="rgba(255,255,255,0.035)" />
      <stop offset="55%" stop-color="rgba(255,255,255,0.012)" />
      <stop offset="100%" stop-color="rgba(255,255,255,0)" />
    </radialGradient>
    <radialGradient id="subtle-warmth" gradientUnits="userSpaceOnUse" cx="${width * 0.28}" cy="${height * 0.88}" r="${Math.max(width * 0.42, height * 0.18)}">
      <stop offset="0%" stop-color="rgba(110,38,52,0.14)" />
      <stop offset="48%" stop-color="rgba(92,32,44,0.06)" />
      <stop offset="100%" stop-color="rgba(92,32,44,0)" />
    </radialGradient>
    <radialGradient id="subtle-violet" gradientUnits="userSpaceOnUse" cx="${width * 0.2}" cy="${height * 0.97}" r="${Math.max(width * 0.34, height * 0.14)}">
      <stop offset="0%" stop-color="rgba(88,44,132,0.12)" />
      <stop offset="45%" stop-color="rgba(88,44,132,0.045)" />
      <stop offset="100%" stop-color="rgba(88,44,132,0)" />
    </radialGradient>
    <radialGradient id="vignette" gradientUnits="userSpaceOnUse" cx="${width * 0.5}" cy="${height * 0.48}" r="${Math.max(width * 1.05, height * 0.84)}">
      <stop offset="42%" stop-color="rgba(0,0,0,0)" />
      <stop offset="100%" stop-color="rgba(0,0,0,0.42)" />
    </radialGradient>
    <filter id="grain-soften">
      <feGaussianBlur stdDeviation="0.2" />
    </filter>
  </defs>
  <rect x="0" y="0" width="${width}" height="${height}" fill="#141414" />
  <rect x="0" y="0" width="${width}" height="${height}" fill="url(#base)" />
  <rect x="0" y="0" width="${width}" height="${height}" fill="url(#center-haze)" />
  <rect x="0" y="0" width="${width}" height="${height}" fill="url(#top-left-mist)" />
  <rect x="0" y="0" width="${width}" height="${height}" fill="url(#bottom-lift)" />
  <rect x="0" y="0" width="${width}" height="${height}" fill="url(#side-shadow)" />
  <rect x="0" y="0" width="${width}" height="${height}" fill="url(#subtle-warmth)" />
  <rect x="0" y="0" width="${width}" height="${height}" fill="url(#subtle-violet)" />
  <g filter="url(#grain-soften)">
    ${speckles
      .map(
        (speckle) =>
          `<circle cx="${speckle.x}" cy="${speckle.y}" r="${speckle.radius}" fill="${speckle.color}" />`,
      )
      .join('\n    ')}
  </g>
  <rect x="0" y="0" width="${width}" height="${height}" fill="url(#vignette)" />
</svg>
`;

const outputDir = path.join(__dirname, '..', 'exports');
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(path.join(outputDir, 'default-grey-aura-1080x2340.svg'), svg);
