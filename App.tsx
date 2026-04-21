import { useEffect, useRef, useState } from 'react';
import type { ComponentType } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import EditStatusPencil from './assets/action-bar/Vector.svg';
import BottomNav1 from './assets/bottom-nav/1.svg';
import BottomNav2 from './assets/bottom-nav/2.svg';
import BottomNav3 from './assets/bottom-nav/3.svg';
import BottomNav4 from './assets/bottom-nav/4.svg';
import {
  Animated,
  Easing,
  FlatList,
  LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

const ASSETS = {
  downloadButton: require('./assets/action-bar/download.png'),
  editStatusAvatar: require('./assets/action-bar/sample-photo-bg.png'),
  instagramButton: require('./assets/action-bar/insta.png'),
  moreButton: require('./assets/action-bar/more.png'),
  whatsappButton: require('./assets/action-bar/whatsapp.png'),
  feed1: require('./assets/feed/1.png'),
  feed2: require('./assets/feed/2.png'),
  feed3: require('./assets/feed/3.png'),
  feed4: require('./assets/feed/4.png'),
  feed5: require('./assets/feed/5.png'),
  feed6: require('./assets/feed/6.png'),
  feed7: require('./assets/feed/7.png'),
  feed8: require('./assets/feed/8.png'),
  feed9: require('./assets/feed/9.png'),
  feed10: require('./assets/feed/10.png'),
  feed11: require('./assets/feed/11.png'),
};

const ACTION_BUTTON_SIZE = 56;
const ACTION_ITEM_WIDTH = 76;
const ACTION_ITEM_GAP = 6;
const ACTION_BAR_HORIZONTAL_PADDING = 12;
const ACTION_BAR_VERTICAL_PADDING = 12;
const ACTION_LABEL_LINE_HEIGHT = 16;
const ACTION_LABEL_GAP = 8;
const ACTION_BAR_HEIGHT =
  ACTION_BAR_VERTICAL_PADDING * 2 +
  ACTION_BUTTON_SIZE +
  ACTION_LABEL_GAP +
  ACTION_LABEL_LINE_HEIGHT;
const BOTTOM_NAV_HEIGHT = 48;
const MAX_BOTTOM_VISUAL_INSET = 16;
const SWIPE_DIRECTION_THRESHOLD = 6;
const CHROME_ANIMATION_DURATION = 280;
const HEADER_BOTTOM_PADDING = 12;
const FONT_FAMILY_REGULAR = 'GoogleSans-Regular';
const FONT_FAMILY_MEDIUM = 'GoogleSans-Medium';
const FONT_FAMILY_BOLD = 'GoogleSans-Bold';

const GOOGLE_SANS_FONT_MAP = {
  [FONT_FAMILY_REGULAR]: {
    uri: 'https://fonts.gstatic.com/s/googlesans/v67/4Ua_rENHsxJlGDuGo1OIlJfC6l_24rlCK1Yo_Iqcsih3SAyH6cAwhX9RFD48TE63OOYKtrwEIKli.ttf',
  },
  [FONT_FAMILY_MEDIUM]: {
    uri: 'https://fonts.gstatic.com/s/googlesans/v67/4Ua_rENHsxJlGDuGo1OIlJfC6l_24rlCK1Yo_Iqcsih3SAyH6cAwhX9RFD48TE63OOYKtrw2IKli.ttf',
  },
  [FONT_FAMILY_BOLD]: {
    uri: 'https://fonts.gstatic.com/s/googlesans/v67/4Ua_rENHsxJlGDuGo1OIlJfC6l_24rlCK1Yo_Iqcsih3SAyH6cAwhX9RFD48TE63OOYKtrzjJ6li.ttf',
  },
} as const;

const TOP_FILTERS: Array<{
  active?: boolean;
  chevron?: boolean;
  icon?: 'birthday' | 'trending';
  label: string;
}> = [
  { active: true, label: 'For you' },
  { label: 'Love' },
  { icon: 'trending', label: 'Trending' },
  { label: 'Politics' },
  { label: 'Suvichar' },
  { icon: 'birthday', label: 'Birthday' },
  { label: 'Motivation' },
  { label: 'Festival' },
  { label: 'Good Morning' },
  { chevron: true, label: 'More' },
];

const ACTIONS: Array<{
  customType?: 'download' | 'edit-status' | 'instagram' | 'more' | 'whatsapp';
  Icon?: ComponentType<{ height?: number; width?: number }>;
  label: string;
  size: number;
}> = [
  {
    customType: 'download',
    label: 'Download',
    size: ACTION_BUTTON_SIZE,
  },
  {
    customType: 'whatsapp',
    label: 'Whatsapp',
    size: ACTION_BUTTON_SIZE,
  },
  {
    customType: 'instagram',
    label: 'Instagram',
    size: ACTION_BUTTON_SIZE,
  },
  {
    customType: 'edit-status',
    label: 'Edit',
    size: ACTION_BUTTON_SIZE,
  },
  {
    customType: 'more',
    label: 'More',
    size: ACTION_BUTTON_SIZE,
  },
];

function getGoogleSansFontFamily(
  fontsLoaded: boolean,
  fontsError: Error | null | undefined,
  variant: 'regular' | 'medium' | 'bold',
) {
  if (!fontsLoaded || fontsError) {
    return undefined;
  }

  if (variant === 'bold') {
    return FONT_FAMILY_BOLD;
  }

  if (variant === 'medium') {
    return FONT_FAMILY_MEDIUM;
  }

  return FONT_FAMILY_REGULAR;
}

const NAV_ITEMS: Array<{
  Icon: typeof BottomNav1;
  key: string;
}> = [
  { Icon: BottomNav1, key: 'news' },
  { Icon: BottomNav2, key: 'posters' },
  { Icon: BottomNav3, key: 'alerts' },
  { Icon: BottomNav4, key: 'profile' },
];

type PosterStagePalette = {
  auraPalette: AuraPalette;
  dominantHex: string;
};

type FeedItem = {
  key: string;
  palette: PosterStagePalette;
  source: number;
};

interface AuraParams {
  intensity: number;
  gradientMidOpacity: number;
  gradientMidPoint: number;
  glowOpacity: number;
  accentBlobOpacity: number;
  accentBlobBlur: number;
  vignetteOpacity: number;
  shadowY: number;
  shadowBlur: number;
  shadowOpacity: number;
  shadowColorMatch: number;
}

interface AuraPalette {
  dominant: [number, number, number];
  vibrant: [number, number, number];
  muted: [number, number, number];
  darkened: [number, number, number];
}

interface AuraSpeckle {
  color: [number, number, number];
  opacity: number;
  radius: number;
  x: number;
  y: number;
}

const DEFAULT_AURA_PARAMS: AuraParams = {
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

const AURA_CONTROL_SPECS: Array<{
  formatValue?: (value: number) => string;
  key: keyof AuraParams;
  label: string;
  max: number;
  min: number;
  step: number;
}> = [
  {
    formatValue: (value) => value.toFixed(2),
    key: 'intensity',
    label: 'Aura Intensity',
    max: 1.2,
    min: 0,
    step: 0.02,
  },
  {
    formatValue: (value) => `${Math.round(value * 100)}%`,
    key: 'gradientMidOpacity',
    label: 'Gradient Mid Opacity',
    max: 1,
    min: 0,
    step: 0.02,
  },
  {
    formatValue: (value) => `${Math.round(value)}%`,
    key: 'gradientMidPoint',
    label: 'Gradient Mid Point',
    max: 100,
    min: 0,
    step: 1,
  },
  {
    formatValue: (value) => `${Math.round(value * 100)}%`,
    key: 'glowOpacity',
    label: 'Center Glow',
    max: 1,
    min: 0,
    step: 0.02,
  },
  {
    formatValue: (value) => `${Math.round(value * 100)}%`,
    key: 'accentBlobOpacity',
    label: 'Accent Blob Opacity',
    max: 1,
    min: 0,
    step: 0.02,
  },
  {
    formatValue: (value) => `${Math.round(value)} px`,
    key: 'accentBlobBlur',
    label: 'Accent Blob Spread',
    max: 160,
    min: 20,
    step: 2,
  },
  {
    formatValue: (value) => `${Math.round(value * 100)}%`,
    key: 'vignetteOpacity',
    label: 'Vignette',
    max: 0.6,
    min: 0,
    step: 0.01,
  },
  {
    formatValue: (value) => `${Math.round(value)} px`,
    key: 'shadowY',
    label: 'Poster Shadow Y',
    max: 48,
    min: 0,
    step: 1,
  },
  {
    formatValue: (value) => `${Math.round(value)} px`,
    key: 'shadowBlur',
    label: 'Poster Shadow Blur',
    max: 120,
    min: 0,
    step: 2,
  },
  {
    formatValue: (value) => `${Math.round(value * 100)}%`,
    key: 'shadowOpacity',
    label: 'Poster Shadow Opacity',
    max: 0.5,
    min: 0,
    step: 0.01,
  },
  {
    formatValue: (value) => `${Math.round(value * 100)}%`,
    key: 'shadowColorMatch',
    label: 'Shadow Color Match',
    max: 1,
    min: 0,
    step: 0.02,
  },
];

function normalizeHex(hex: string) {
  const normalizedHex = hex.replace('#', '');

  if (!/^[0-9A-Fa-f]{6}$/.test(normalizedHex)) {
    return null;
  }

  return normalizedHex;
}

function mixHex(sourceHex: string, targetHex: string, sourceWeight: number) {
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

function mixHexOverBlack(hex: string, opacity: number) {
  return mixHex(hex, '#000000', opacity);
}

function hexToRgb(hex: string): [number, number, number] {
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

function clampRgb(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function clampNumber(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function rgba(
  [red, green, blue]: [number, number, number],
  opacity: number,
) {
  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
}

function rgb([red, green, blue]: [number, number, number]) {
  return `rgb(${red}, ${green}, ${blue})`;
}

function buildAuraPalette(dominantHex: string): AuraPalette {
  const [dr, dg, db] = hexToRgb(dominantHex);
  const avg = (dr + dg + db) / 3;
  const boost = 1.5;

  const vibrant: [number, number, number] = [
    clampRgb(avg + (dr - avg) * boost + 30),
    clampRgb(avg + (dg - avg) * boost + 30),
    clampRgb(avg + (db - avg) * boost + 30),
  ];
  const muted: [number, number, number] = [
    clampRgb(avg * 0.4 + dr * 0.2 + 120),
    clampRgb(avg * 0.4 + dg * 0.2 + 120),
    clampRgb(avg * 0.4 + db * 0.2 + 120),
  ];
  const darkened: [number, number, number] = [
    clampRgb(dr * 0.35),
    clampRgb(dg * 0.35),
    clampRgb(db * 0.35),
  ];

  return {
    darkened,
    dominant: [dr, dg, db],
    muted,
    vibrant,
  };
}

const auraPaletteCache = new Map<string, AuraPalette>();
const auraSpecklesCache = new Map<string, AuraSpeckle[]>();

function getAuraPalette(dominantHex: string) {
  const cachedPalette = auraPaletteCache.get(dominantHex);

  if (cachedPalette) {
    return cachedPalette;
  }

  const nextPalette = buildAuraPalette(dominantHex);
  auraPaletteCache.set(dominantHex, nextPalette);

  return nextPalette;
}

function createSeededRandom(seedSource: string) {
  let seed = 0;

  for (let index = 0; index < seedSource.length; index += 1) {
    seed = (seed * 31 + seedSource.charCodeAt(index)) >>> 0;
  }

  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;

    return seed / 4294967296;
  };
}

function buildAuraSpeckles(
  dominantHex: string,
  palette: AuraPalette,
  width: number,
  height: number,
): AuraSpeckle[] {
  const random = createSeededRandom(dominantHex);
  const speckles: AuraSpeckle[] = [];

  for (let index = 0; index < 56; index += 1) {
    const useVibrant = random() > 0.6;

    speckles.push({
      color: useVibrant ? palette.vibrant : palette.muted,
      opacity: 0.012 + random() * 0.028,
      radius: 0.9 + random() * 2.6,
      x: random() * width,
      y: random() * height,
    });
  }

  return speckles;
}

function getAuraSpeckles(
  dominantHex: string,
  palette: AuraPalette,
  width: number,
  height: number,
) {
  const cacheKey = `${dominantHex}-${Math.round(width)}x${Math.round(height)}`;
  const cachedSpeckles = auraSpecklesCache.get(cacheKey);

  if (cachedSpeckles) {
    return cachedSpeckles;
  }

  const nextSpeckles = buildAuraSpeckles(dominantHex, palette, width, height);
  auraSpecklesCache.set(cacheKey, nextSpeckles);

  return nextSpeckles;
}

function createFeedItem(
  key: string,
  dominantHex: string,
  source: number,
): FeedItem {
  return {
    key,
    palette: {
      auraPalette: getAuraPalette(dominantHex),
      dominantHex,
    },
    source,
  };
}

const FEED_ITEMS: FeedItem[] = [
  createFeedItem('feed-1', '#E5E4DE', ASSETS.feed1),
  createFeedItem('feed-2', '#621C4D', ASSETS.feed2),
  createFeedItem('feed-3', '#6E1B56', ASSETS.feed3),
  createFeedItem('feed-4', '#74BABE', ASSETS.feed4),
  createFeedItem('feed-5', '#432918', ASSETS.feed5),
  createFeedItem('feed-6', '#834E07', ASSETS.feed6),
  createFeedItem('feed-7', '#F8DEBC', ASSETS.feed7),
  createFeedItem('feed-8', '#02234E', ASSETS.feed8),
  createFeedItem('feed-9', '#EDDFD0', ASSETS.feed9),
  createFeedItem('feed-10', '#E3D6BA', ASSETS.feed10),
  createFeedItem('feed-11', '#E4DFC9', ASSETS.feed11),
];

const firstFeedItem = FEED_ITEMS[0];
const LOOPED_FEED_ITEMS = firstFeedItem
  ? [...FEED_ITEMS, { ...firstFeedItem, key: `${firstFeedItem.key}-loop` }]
  : FEED_ITEMS;

function PosterStageBackdrop({
  auraParams,
  auraPalette,
  dominantHex,
  height,
  width,
}: {
  auraParams: AuraParams;
  auraPalette: AuraPalette;
  dominantHex: string;
  height: number;
  width: number;
}) {
  const palette = auraPalette;
  const baseColor = hexToRgb(mixHex(dominantHex, '#120D14', 0.26));
  const topShadeColor = hexToRgb(mixHex(dominantHex, '#17111A', 0.3));
  const edgeShadeColor = hexToRgb(mixHex(dominantHex, '#0B0810', 0.16));
  const bottomLiftColor = hexToRgb(mixHex(dominantHex, '#2A1E2F', 0.42));
  const speckles = getAuraSpeckles(
    dominantHex,
    palette,
    width,
    height,
  );
  const idBase = `poster-stage-aura-${dominantHex.replace('#', '')}`;
  const intensityScale = DEFAULT_AURA_PARAMS.intensity
    ? auraParams.intensity / DEFAULT_AURA_PARAMS.intensity
    : 1;
  const blobSpreadScale = DEFAULT_AURA_PARAMS.accentBlobBlur
    ? auraParams.accentBlobBlur / DEFAULT_AURA_PARAMS.accentBlobBlur
    : 1;
  const centerGlowRadius =
    Math.max(width * 0.84, height * 0.48) * (0.92 + intensityScale * 0.08);
  const topBlobRadius = Math.max(width * 0.74, height * 0.34) * blobSpreadScale;
  const bottomBlobRadius =
    Math.max(width * 0.66, height * 0.28) * blobSpreadScale;
  const sideGlowRadius =
    Math.max(width * 0.7, height * 0.36) * (0.94 + blobSpreadScale * 0.06);
  const vignetteRadius = Math.max(width * 1.02, height * 0.8);

  return (
    <View
      pointerEvents="none"
      style={[
        styles.posterStageBackdrop,
        {
          backgroundColor: rgba(baseColor, 1),
        },
      ]}
    >
      <Svg
        height="100%"
        preserveAspectRatio="none"
        style={styles.posterStageBackdropSvg}
        width="100%"
      >
        <Defs>
          <SvgLinearGradient
            id={`${idBase}-base-gradient`}
            x1="0%"
            x2="100%"
            y1="0%"
            y2="100%"
          >
            <Stop offset="0%" stopColor={rgb(topShadeColor)} stopOpacity="1" />
            <Stop
              offset={`${auraParams.gradientMidPoint}%`}
              stopColor={rgb(baseColor)}
              stopOpacity={auraParams.gradientMidOpacity}
            />
            <Stop offset="100%" stopColor={rgb(bottomLiftColor)} stopOpacity="1" />
          </SvgLinearGradient>
          <RadialGradient
            cx={width * 0.5}
            cy={height * 0.56}
            gradientUnits="userSpaceOnUse"
            id={`${idBase}-center-haze`}
            r={Math.max(width * 0.9, height * 0.54)}
          >
            <Stop offset="0%" stopColor={rgb(palette.muted)} stopOpacity="0.22" />
            <Stop offset="52%" stopColor={rgb(palette.muted)} stopOpacity="0.08" />
            <Stop offset="100%" stopColor={rgb(palette.muted)} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient
            cx={width * 0.5}
            cy={height * 0.44}
            gradientUnits="userSpaceOnUse"
            id={`${idBase}-center-glow`}
            r={centerGlowRadius}
          >
            <Stop
              offset="0%"
              stopColor={rgb(palette.vibrant)}
              stopOpacity={clampNumber(auraParams.glowOpacity * intensityScale, 0, 1)}
            />
            <Stop offset="58%" stopColor={rgb(palette.vibrant)} stopOpacity="0.14" />
            <Stop offset="100%" stopColor={rgb(palette.vibrant)} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient
            cx={width * 0.88}
            cy={height * 0.04}
            gradientUnits="userSpaceOnUse"
            id={`${idBase}-top-blob`}
            r={topBlobRadius}
          >
            <Stop
              offset="0%"
              stopColor={rgb(palette.vibrant)}
              stopOpacity={clampNumber(auraParams.accentBlobOpacity * intensityScale, 0, 1)}
            />
            <Stop
              offset="54%"
              stopColor={rgb(palette.vibrant)}
              stopOpacity={clampNumber(auraParams.accentBlobOpacity * intensityScale * 0.24, 0, 1)}
            />
            <Stop offset="100%" stopColor={rgb(palette.vibrant)} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient
            cx={width * 0.18}
            cy={height * 0.92}
            gradientUnits="userSpaceOnUse"
            id={`${idBase}-bottom-blob`}
            r={bottomBlobRadius}
          >
            <Stop
              offset="0%"
              stopColor={rgb(palette.dominant)}
              stopOpacity={clampNumber(auraParams.accentBlobOpacity * intensityScale * 0.6, 0, 1)}
            />
            <Stop
              offset="56%"
              stopColor={rgb(palette.dominant)}
              stopOpacity={clampNumber(auraParams.accentBlobOpacity * intensityScale * 0.18, 0, 1)}
            />
            <Stop offset="100%" stopColor={rgb(palette.dominant)} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient
            cx={width * 1.04}
            cy={height * 0.72}
            gradientUnits="userSpaceOnUse"
            id={`${idBase}-side-glow`}
            r={sideGlowRadius}
          >
            <Stop offset="0%" stopColor={rgb(palette.vibrant)} stopOpacity="0.18" />
            <Stop offset="58%" stopColor={rgb(palette.vibrant)} stopOpacity="0.06" />
            <Stop offset="100%" stopColor={rgb(palette.vibrant)} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient
            cx={width * 0.5}
            cy={height * 0.5}
            gradientUnits="userSpaceOnUse"
            id={`${idBase}-vignette`}
            r={vignetteRadius}
          >
            <Stop offset="34%" stopColor="#000000" stopOpacity="0" />
            <Stop
              offset="100%"
              stopColor="#000000"
              stopOpacity={clampNumber(auraParams.vignetteOpacity * intensityScale, 0, 1)}
            />
          </RadialGradient>
          <SvgLinearGradient
            id={`${idBase}-top-veil`}
            x1="0%"
            x2="0%"
            y1="0%"
            y2="100%"
          >
            <Stop offset="0%" stopColor={rgb(edgeShadeColor)} stopOpacity="0.46" />
            <Stop offset="42%" stopColor={rgb(edgeShadeColor)} stopOpacity="0.08" />
            <Stop offset="100%" stopColor={rgb(edgeShadeColor)} stopOpacity="0" />
          </SvgLinearGradient>
        </Defs>
        <Rect fill={`url(#${idBase}-base-gradient)`} height="100%" width="100%" x="0" y="0" />
        <Rect fill={`url(#${idBase}-center-haze)`} height="100%" width="100%" x="0" y="0" />
        <Rect fill={`url(#${idBase}-center-glow)`} height="100%" width="100%" x="0" y="0" />
        <Rect fill={`url(#${idBase}-top-blob)`} height="100%" width="100%" x="0" y="0" />
        <Rect fill={`url(#${idBase}-bottom-blob)`} height="100%" width="100%" x="0" y="0" />
        <Rect fill={`url(#${idBase}-side-glow)`} height="100%" width="100%" x="0" y="0" />
        <Rect fill={`url(#${idBase}-top-veil)`} height="100%" width="100%" x="0" y="0" />
        {speckles.map((speckle, index) => (
          <Circle
            key={`${idBase}-speckle-${index}`}
            cx={speckle.x}
            cy={speckle.y}
            fill={rgb(speckle.color)}
            opacity={clampNumber(speckle.opacity * (0.88 + intensityScale * 0.12), 0, 1)}
            r={speckle.radius}
          />
        ))}
        <Rect fill={`url(#${idBase}-vignette)`} height="100%" width="100%" x="0" y="0" />
      </Svg>
    </View>
  );
}

function FilterChip({
  active = false,
  chevron = false,
  fontsError,
  fontsLoaded,
  icon,
  label,
}: {
  active?: boolean;
  chevron?: boolean;
  fontsError?: Error | null;
  fontsLoaded?: boolean;
  icon?: 'birthday' | 'trending';
  label: string;
}) {
  return (
    <Pressable
      style={[
        styles.filterChip,
        active ? styles.filterChipActive : styles.filterChipInactive,
      ]}
    >
      {icon === 'trending' ? (
        <Ionicons color="rgba(255,255,255,0.75)" name="flame-outline" size={16} />
      ) : null}
      {icon === 'birthday' ? (
        <FontAwesome5 color="rgba(255,255,255,0.75)" name="birthday-cake" size={14} />
      ) : null}
      <Text
        style={[
          styles.filterChipText,
          {
            fontFamily: getGoogleSansFontFamily(
              !!fontsLoaded,
              fontsError,
              active ? 'medium' : 'regular',
            ),
          },
          active ? styles.filterChipTextActive : styles.filterChipTextInactive,
        ]}
      >
        {label}
      </Text>
      {chevron ? <Ionicons color="rgba(255,255,255,0.75)" name="chevron-down" size={12} /> : null}
    </Pressable>
  );
}

function ActionButton({
  customType,
  fontsError,
  fontsLoaded,
  Icon,
  label,
  onPress,
  size,
}: {
  customType?: 'download' | 'edit-status' | 'instagram' | 'more' | 'whatsapp';
  fontsError?: Error | null;
  fontsLoaded?: boolean;
  Icon?: ComponentType<{ height?: number; width?: number }>;
  label: string;
  onPress?: () => void;
  size: number;
}) {
  return (
    <Pressable onPress={onPress} style={styles.actionItem}>
      <View style={styles.actionItemContent}>
        <View
          style={[
            styles.actionIconWrap,
            { height: size, width: size },
          ]}
        >
          {customType === 'download' ? (
            <ActionPngIcon source={ASSETS.downloadButton} />
          ) : customType === 'edit-status' ? (
            <EditStatusIcon />
          ) : customType === 'instagram' ? (
            <InstagramIconButton />
          ) : customType === 'more' ? (
            <ActionPngIcon source={ASSETS.moreButton} />
          ) : customType === 'whatsapp' ? (
            <ActionPngIcon source={ASSETS.whatsappButton} />
          ) : Icon ? (
            <Icon height={size} width={size} />
          ) : null}
        </View>
        <Text
          style={[
            styles.actionLabel,
            {
              fontFamily: getGoogleSansFontFamily(
                !!fontsLoaded,
                fontsError,
                'regular',
              ),
            },
          ]}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

function ActionPngIcon({
  source,
  style,
}: {
  source: number;
  style?: object;
}) {
  return (
    <Image
      contentFit="contain"
      source={source}
      style={[styles.actionPngIcon, style]}
    />
  );
}

function InstagramIconButton() {
  return (
    <Image
      contentFit="contain"
      source={ASSETS.instagramButton}
      style={styles.instagramButtonImage}
    />
  );
}

function AuraControlRow({
  fontsError,
  fontsLoaded,
  label,
  max,
  min,
  onChange,
  step,
  value,
  valueLabel,
}: {
  fontsError?: Error | null;
  fontsLoaded?: boolean;
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  step: number;
  value: number;
  valueLabel: string;
}) {
  const segmentCount = 21;
  const decreaseDisabled = value <= min;
  const increaseDisabled = value >= max;

  return (
    <View style={styles.controlRow}>
      <View style={styles.controlRowHeader}>
        <Text
          style={[
            styles.controlLabel,
            {
              fontFamily: getGoogleSansFontFamily(
                !!fontsLoaded,
                fontsError,
                'medium',
              ),
            },
          ]}
        >
          {label}
        </Text>
        <Text
          style={[
            styles.controlValue,
            {
              fontFamily: getGoogleSansFontFamily(
                !!fontsLoaded,
                fontsError,
                'regular',
              ),
            },
          ]}
        >
          {valueLabel}
        </Text>
      </View>
      <View style={styles.controlRowBody}>
        <Pressable
          disabled={decreaseDisabled}
          onPress={() => onChange(value - step)}
          style={[
            styles.controlAdjustButton,
            decreaseDisabled && styles.controlAdjustButtonDisabled,
          ]}
        >
          <Ionicons color="#FFFFFF" name="remove" size={16} />
        </Pressable>
        <View style={styles.controlTrack}>
          {Array.from({ length: segmentCount }).map((_, index) => {
            const ratio = index / (segmentCount - 1);
            const segmentValue = min + (max - min) * ratio;
            const active = value >= segmentValue - step / 2;

            return (
              <Pressable
                key={`${label}-${index}`}
                onPress={() => onChange(segmentValue)}
                style={[
                  styles.controlTrackSegment,
                  active && styles.controlTrackSegmentActive,
                ]}
              />
            );
          })}
        </View>
        <Pressable
          disabled={increaseDisabled}
          onPress={() => onChange(value + step)}
          style={[
            styles.controlAdjustButton,
            increaseDisabled && styles.controlAdjustButtonDisabled,
          ]}
        >
          <Ionicons color="#FFFFFF" name="add" size={16} />
        </Pressable>
      </View>
    </View>
  );
}

function AuraControlPanel({
  auraParams,
  bottomOffset,
  fontsError,
  fontsLoaded,
  onClose,
  onReset,
  onUpdateParam,
}: {
  auraParams: AuraParams;
  bottomOffset: number;
  fontsError?: Error | null;
  fontsLoaded?: boolean;
  onClose: () => void;
  onReset: () => void;
  onUpdateParam: <K extends keyof AuraParams>(key: K, value: AuraParams[K]) => void;
}) {
  return (
    <View pointerEvents="box-none" style={styles.controlPanelRoot}>
      <Pressable onPress={onClose} style={styles.controlPanelBackdrop} />
      <View style={[styles.controlPanel, { bottom: bottomOffset }]}>
        <View style={styles.controlPanelHeader}>
          <View>
            <Text
              style={[
                styles.controlPanelEyebrow,
                {
                  fontFamily: getGoogleSansFontFamily(
                    !!fontsLoaded,
                    fontsError,
                    'medium',
                  ),
                },
              ]}
            >
              Poster Aura
            </Text>
            <Text
              style={[
                styles.controlPanelTitle,
                {
                  fontFamily: getGoogleSansFontFamily(
                    !!fontsLoaded,
                    fontsError,
                    'bold',
                  ),
                },
              ]}
            >
              Gradient Controls
            </Text>
          </View>
          <View style={styles.controlPanelActions}>
            <Pressable onPress={onReset} style={styles.controlPanelAction}>
              <Text
                style={[
                  styles.controlPanelActionText,
                  {
                    fontFamily: getGoogleSansFontFamily(
                      !!fontsLoaded,
                      fontsError,
                      'medium',
                    ),
                  },
                ]}
              >
                Reset
              </Text>
            </Pressable>
            <Pressable onPress={onClose} style={styles.controlPanelClose}>
              <Ionicons color="#FFFFFF" name="close" size={18} />
            </Pressable>
          </View>
        </View>
        <ScrollView
          contentContainerStyle={styles.controlPanelContent}
          showsVerticalScrollIndicator={false}
        >
          {AURA_CONTROL_SPECS.map((control) => (
            <AuraControlRow
              fontsError={fontsError}
              fontsLoaded={fontsLoaded}
              key={control.key}
              label={control.label}
              max={control.max}
              min={control.min}
              onChange={(nextValue) => {
                const steppedValue =
                  Math.round(nextValue / control.step) * control.step;

                onUpdateParam(
                  control.key,
                  clampNumber(steppedValue, control.min, control.max),
                );
              }}
              step={control.step}
              value={auraParams[control.key]}
              valueLabel={
                control.formatValue
                  ? control.formatValue(auraParams[control.key])
                  : `${auraParams[control.key]}`
              }
            />
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

function EditStatusIcon() {
  return (
    <View style={styles.editStatusIcon}>
      <View style={styles.editStatusCircle}>
        <View style={styles.editStatusAvatarFrame}>
          <Image
            contentFit="cover"
            contentPosition="center"
            source={ASSETS.editStatusAvatar}
            style={styles.editStatusAvatar}
          />
        </View>
        <View pointerEvents="none" style={styles.editStatusBorderOverlay} />
      </View>
      <View pointerEvents="none" style={styles.editStatusPencil}>
        <EditStatusPencil height={28} width={28} />
      </View>
    </View>
  );
}

function BottomNavItem({
  Icon,
}: {
  Icon: typeof BottomNav1;
}) {
  return (
    <Pressable style={styles.bottomNavItem}>
      <View style={styles.bottomNavIconWrap}>
        <Icon height={40} width={40} />
      </View>
    </Pressable>
  );
}

function ActionBarSpacer() {
  return <View style={styles.actionBarSpacer} />;
}

function normalizeFeedIndex(index: number) {
  return ((index % FEED_ITEMS.length) + FEED_ITEMS.length) % FEED_ITEMS.length;
}

function FeedScreen() {
  const [fontsLoaded, fontsError] = useFonts(GOOGLE_SANS_FONT_MAP);
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const feedListRef = useRef<FlatList<FeedItem>>(null);
  const chromeVisibility = useRef(new Animated.Value(1)).current;
  const activeFeedIndexRef = useRef(0);
  const isChromeVisibleRef = useRef(true);
  const lastScrollOffsetRef = useRef(0);
  const [filterWrapHeight, setFilterWrapHeight] = useState(0);
  const [activeFeedIndex, setActiveFeedIndex] = useState(0);
  const [auraParams, setAuraParams] = useState(DEFAULT_AURA_PARAMS);
  const [isControlPanelOpen, setIsControlPanelOpen] = useState(false);
  const resolvedHeaderHeight =
    insets.top + 8 + filterWrapHeight + HEADER_BOTTOM_PADDING;
  const resolvedBottomInset = Math.min(insets.bottom, MAX_BOTTOM_VISUAL_INSET);
  const resolvedBottomNavHeight = BOTTOM_NAV_HEIGHT + resolvedBottomInset;
  const resolvedActionBarHeight = ACTION_BAR_HEIGHT;
  const posterAreaHeight = height - resolvedHeaderHeight;
  const activeFeedItem = FEED_ITEMS[activeFeedIndex] ?? FEED_ITEMS[0];
  const posterBottomInset = chromeVisibility.interpolate({
    inputRange: [0, 1],
    outputRange: [
      resolvedActionBarHeight + resolvedBottomInset,
      resolvedActionBarHeight + resolvedBottomNavHeight,
    ],
  });
  const bottomChromeTranslateY = chromeVisibility.interpolate({
    inputRange: [0, 1],
    outputRange: [resolvedBottomNavHeight, 0],
  });
  const bottomChromeOpacity = chromeVisibility.interpolate({
    inputRange: [0, 1],
    outputRange: [0.92, 1],
  });
  const actionBarBottomOffset = chromeVisibility.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -resolvedBottomNavHeight],
  });
  const actionBarBottomPadding = chromeVisibility.interpolate({
    inputRange: [0, 1],
    outputRange: [resolvedBottomInset, 0],
  });

  useEffect(() => {
    if (width <= 0 || posterAreaHeight <= 0) {
      return;
    }

    const backdropHeight = resolvedHeaderHeight + posterAreaHeight;

    FEED_ITEMS.forEach((item) => {
      getAuraSpeckles(
        item.palette.dominantHex,
        item.palette.auraPalette,
        width,
        backdropHeight,
      );
    });
  }, [posterAreaHeight, resolvedHeaderHeight, width]);

  const commitActiveFeedIndex = (offsetY: number) => {
    const nextIndex = Math.round(offsetY / posterAreaHeight);
    const normalizedIndex = normalizeFeedIndex(nextIndex);

    if (normalizedIndex === activeFeedIndexRef.current) {
      return;
    }

    activeFeedIndexRef.current = normalizedIndex;
    setActiveFeedIndex(normalizedIndex);
  };

  const syncActiveFeedIndexWithDestination = (offsetY: number) => {
    if (posterAreaHeight <= 0) {
      return;
    }

    const normalizedIndex = normalizeFeedIndex(
      Math.round(offsetY / posterAreaHeight),
    );

    if (normalizedIndex === activeFeedIndexRef.current) {
      return;
    }

    activeFeedIndexRef.current = normalizedIndex;
    setActiveFeedIndex(normalizedIndex);
  };

  const setChromeVisible = (visible: boolean) => {
    if (isChromeVisibleRef.current === visible) {
      return;
    }

    isChromeVisibleRef.current = visible;
    Animated.timing(chromeVisibility, {
      duration: CHROME_ANIMATION_DURATION,
      easing: Easing.bezier(0.2, 0.8, 0.2, 1),
      toValue: visible ? 1 : 0,
      useNativeDriver: false,
    }).start();
  };

  const handleFeedScroll = ({
    nativeEvent,
  }: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = nativeEvent.contentOffset.y;
    const deltaY = offsetY - lastScrollOffsetRef.current;

    if (offsetY <= 0) {
      setChromeVisible(true);
    } else if (deltaY > SWIPE_DIRECTION_THRESHOLD) {
      setChromeVisible(false);
    } else if (deltaY < -SWIPE_DIRECTION_THRESHOLD) {
      setChromeVisible(true);
    }

    syncActiveFeedIndexWithDestination(offsetY);
    lastScrollOffsetRef.current = offsetY;
  };

  const handleFeedScrollEndDrag = ({
    nativeEvent,
  }: NativeSyntheticEvent<NativeScrollEvent>) => {
    const velocityY = nativeEvent.velocity?.y ?? 0;

    if (Math.abs(velocityY) > 0.05) {
      return;
    }

    commitActiveFeedIndex(nativeEvent.contentOffset.y);
  };

  const handleFeedMomentumEnd = ({
    nativeEvent,
  }: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = nativeEvent.contentOffset.y;
    const nextIndex = Math.round(offsetY / posterAreaHeight);

    commitActiveFeedIndex(offsetY);

    if (nextIndex !== LOOPED_FEED_ITEMS.length - 1) {
      return;
    }

    feedListRef.current?.scrollToOffset({ animated: false, offset: 0 });
    activeFeedIndexRef.current = 0;
    lastScrollOffsetRef.current = 0;
    setActiveFeedIndex(0);
  };

  const handleFilterWrapLayout = ({
    nativeEvent,
  }: LayoutChangeEvent) => {
    const nextHeight = Math.ceil(nativeEvent.layout.height);

    if (nextHeight === filterWrapHeight) {
      return;
    }

    setFilterWrapHeight(nextHeight);
  };

  const updateAuraParam = <K extends keyof AuraParams>(
    key: K,
    value: AuraParams[K],
  ) => {
    setAuraParams((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const openControlPanel = () => {
    setChromeVisible(true);
    setIsControlPanelOpen(true);
  };

  const closeControlPanel = () => {
    setIsControlPanelOpen(false);
  };

  return (
    <View style={styles.screen}>
      <StatusBar hidden={false} style="light" />

      <View style={styles.screenContent}>
        <PosterStageBackdrop
          auraParams={auraParams}
          auraPalette={activeFeedItem.palette.auraPalette}
          dominantHex={activeFeedItem.palette.dominantHex}
          height={resolvedHeaderHeight + posterAreaHeight}
          width={width}
        />
        <View
          style={[
            styles.header,
            {
              height: resolvedHeaderHeight,
              paddingTop: insets.top + 8,
            },
          ]}
        >
          <View onLayout={handleFilterWrapLayout} style={styles.filterWrap}>
            {TOP_FILTERS.map((filter) => (
              <FilterChip
                key={filter.label}
                {...filter}
                fontsError={fontsError}
                fontsLoaded={fontsLoaded}
              />
            ))}
          </View>
        </View>

        <View style={[styles.posterArea, { height: posterAreaHeight }]}>
          <FlatList
            data={LOOPED_FEED_ITEMS}
            decelerationRate="fast"
            getItemLayout={(_, index) => ({
              index,
              length: posterAreaHeight,
              offset: posterAreaHeight * index,
            })}
            keyExtractor={(item) => item.key}
            onMomentumScrollEnd={handleFeedMomentumEnd}
            onScroll={handleFeedScroll}
            onScrollBeginDrag={handleFeedScroll}
            onScrollEndDrag={handleFeedScrollEndDrag}
            pagingEnabled
            renderItem={({ item }) => (
              <View style={[styles.posterFrame, { height: posterAreaHeight, width }]}>
                <Animated.View
                  style={[
                    styles.posterContent,
                    {
                      paddingBottom: posterBottomInset,
                    },
                  ]}
                >
                  <Image
                    contentFit="contain"
                    source={item.source}
                    style={styles.posterImage}
                  />
                </Animated.View>
              </View>
            )}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
            snapToAlignment="start"
            snapToInterval={posterAreaHeight}
            style={styles.posterList}
            ref={feedListRef}
          />
        </View>
      </View>

      <Animated.View
        style={[
          styles.bottomNavContainer,
          {
            opacity: bottomChromeOpacity,
            transform: [{ translateY: bottomChromeTranslateY }],
          },
        ]}
      >
        <View style={[styles.bottomNavShell, { paddingBottom: resolvedBottomInset }]}>
          <View style={styles.bottomNav}>
            {NAV_ITEMS.map((item) => (
              <BottomNavItem key={item.key} Icon={item.Icon} />
            ))}
          </View>
        </View>
      </Animated.View>

      <Animated.View
        style={[
          styles.actionBarContainer,
          {
            paddingBottom: actionBarBottomPadding,
            transform: [{ translateY: actionBarBottomOffset }],
          },
        ]}
      >
        <FlatList
          automaticallyAdjustContentInsets={false}
          contentContainerStyle={styles.actionBarContent}
          contentInsetAdjustmentBehavior="never"
          data={ACTIONS}
          horizontal
          ItemSeparatorComponent={ActionBarSpacer}
          keyExtractor={(item) => item.label}
          renderItem={({ item: action }) => (
            <ActionButton
              {...action}
              fontsError={fontsError}
              fontsLoaded={fontsLoaded}
              onPress={action.label === 'More' ? openControlPanel : undefined}
            />
          )}
          showsHorizontalScrollIndicator={false}
          style={styles.actionBar}
        />
        <Animated.View
          pointerEvents="none"
          style={[styles.bottomNavSeparator, { opacity: chromeVisibility }]}
        />
      </Animated.View>

      {isControlPanelOpen ? (
        <AuraControlPanel
          auraParams={auraParams}
          bottomOffset={resolvedActionBarHeight + resolvedBottomNavHeight}
          fontsError={fontsError}
          fontsLoaded={fontsLoaded}
          onClose={closeControlPanel}
          onReset={() => setAuraParams(DEFAULT_AURA_PARAMS)}
          onUpdateParam={updateAuraParam}
        />
      ) : null}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <FeedScreen />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  actionBar: {
    backgroundColor: '#000000',
    height: ACTION_BAR_HEIGHT,
  },
  actionCircleBase: {
    alignItems: 'center',
    borderRadius: ACTION_BUTTON_SIZE / 2,
    height: ACTION_BUTTON_SIZE,
    justifyContent: 'center',
    overflow: 'hidden',
    width: ACTION_BUTTON_SIZE,
  },
  actionBarContent: {
    alignItems: 'center',
    paddingHorizontal: ACTION_BAR_HORIZONTAL_PADDING,
    paddingBottom: ACTION_BAR_VERTICAL_PADDING,
    paddingTop: ACTION_BAR_VERTICAL_PADDING,
  },
  actionBarSpacer: {
    width: ACTION_ITEM_GAP,
  },
  actionItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: ACTION_ITEM_WIDTH,
  },
  actionItemContent: {
    alignItems: 'center',
    gap: ACTION_LABEL_GAP,
    width: '100%',
  },
  actionIconWrap: {
    alignItems: 'center',
    height: ACTION_BUTTON_SIZE,
    justifyContent: 'center',
    overflow: 'visible',
    width: ACTION_BUTTON_SIZE,
  },
  actionLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: ACTION_LABEL_LINE_HEIGHT,
    textAlign: 'center',
  },
  actionPngIcon: {
    height: ACTION_BUTTON_SIZE,
    width: ACTION_BUTTON_SIZE,
  },
  editStatusAvatar: {
    height: '100%',
    width: '100%',
  },
  editStatusAvatarFrame: {
    borderRadius: 24,
    flex: 1,
    overflow: 'hidden',
  },
  editStatusBorderOverlay: {
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 22,
    borderWidth: 2,
    bottom: 1,
    left: 1,
    position: 'absolute',
    right: 1,
    top: 1,
  },
  editStatusCircle: {
    borderRadius: ACTION_BUTTON_SIZE / 2,
    height: ACTION_BUTTON_SIZE,
    overflow: 'hidden',
    width: ACTION_BUTTON_SIZE,
  },
  editStatusIcon: {
    height: ACTION_BUTTON_SIZE,
    overflow: 'visible',
    width: ACTION_BUTTON_SIZE,
  },
  editStatusPencil: {
    alignItems: 'center',
    bottom: -5,
    justifyContent: 'center',
    position: 'absolute',
    right: -8,
  },
  instagramBorder: {
    ...StyleSheet.absoluteFillObject,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: ACTION_BUTTON_SIZE / 2,
    borderWidth: 2,
  },
  instagramButton: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4.33 },
    shadowOpacity: 0.3,
    shadowRadius: 26,
  },
  instagramButtonImage: {
    height: ACTION_BUTTON_SIZE,
    width: ACTION_BUTTON_SIZE,
  },
  bottomNav: {
    flexDirection: 'row',
    height: BOTTOM_NAV_HEIGHT,
  },
  bottomNavIconWrap: {
    alignItems: 'center',
    height: BOTTOM_NAV_HEIGHT,
    justifyContent: 'center',
    width: 40,
  },
  bottomNavItem: {
    alignItems: 'center',
    flex: 1,
    height: BOTTOM_NAV_HEIGHT,
    justifyContent: 'center',
  },
  bottomNavShell: {
    backgroundColor: '#000000',
  },
  bottomNavSeparator: {
    backgroundColor: '#1A1A1A',
    height: 1,
  },
  controlAdjustButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  controlAdjustButtonDisabled: {
    opacity: 0.35,
  },
  controlLabel: {
    color: '#FFFFFF',
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
    paddingRight: 10,
  },
  controlPanel: {
    backgroundColor: 'rgba(12,12,14,0.98)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    left: 12,
    maxHeight: '62%',
    overflow: 'hidden',
    position: 'absolute',
    right: 12,
  },
  controlPanelAction: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  controlPanelActionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 16,
  },
  controlPanelActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  controlPanelBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.32)',
  },
  controlPanelClose: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  controlPanelContent: {
    gap: 14,
    paddingBottom: 28,
    paddingHorizontal: 18,
    paddingTop: 14,
  },
  controlPanelEyebrow: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    lineHeight: 14,
    textTransform: 'uppercase',
  },
  controlPanelHeader: {
    alignItems: 'center',
    borderBottomColor: 'rgba(255,255,255,0.08)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  controlPanelRoot: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  controlPanelTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
    marginTop: 4,
  },
  controlRow: {
    gap: 10,
  },
  controlRowBody: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  controlRowHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  controlTrack: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  controlTrackSegment: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
    flex: 1,
    height: 24,
  },
  controlTrackSegmentActive: {
    backgroundColor: '#FFFFFF',
  },
  controlValue: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontVariant: ['tabular-nums'],
    lineHeight: 18,
  },
  screenContent: {
    flex: 1,
  },
  filterChip: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 61,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    height: 28,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  filterChipActive: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderColor: 'rgba(255,255,255,0.16)',
  },
  filterChipInactive: {
    borderColor: 'rgba(255,255,255,0.14)',
  },
  filterChipText: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  filterChipTextInactive: {
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '400',
  },
  filterWrap: {
    columnGap: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    position: 'relative',
    rowGap: 8,
  },
  header: {
    overflow: 'hidden',
  },
  posterArea: {
    overflow: 'hidden',
  },
  posterFrame: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    width: '100%',
  },
  posterStageBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  posterStageBackdropSvg: {
    ...StyleSheet.absoluteFillObject,
  },
  posterContent: {
    flex: 1,
    position: 'relative',
    width: '100%',
  },
  posterList: {
    flex: 1,
  },
  posterImage: {
    flex: 1,
    width: '100%',
  },
  screen: {
    backgroundColor: '#000000',
    flex: 1,
  },
  actionBarContainer: {
    backgroundColor: '#000000',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  bottomNavContainer: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
  },
});
