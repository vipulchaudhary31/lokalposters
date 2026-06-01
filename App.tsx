import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentType } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import ProfilePrototypeScreen from './screens/ProfilePrototypeScreen';
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
  ActionSheetIOS,
  Animated,
  Alert,
  Easing,
  FlatList,
  Image as RNImage,
  LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Platform,
  Pressable,
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
  feedStart: require('./assets/feed/start.png'),
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
  feedVideo1: require('./assets/feed/video-1.mp4'),
  feedVideo2: require('./assets/feed/video-2.mp4'),
  feedVideo3: require('./assets/feed/video-3.mp4'),
  instagramButton: require('./assets/action-bar/insta.png'),
  moreButton: require('./assets/action-bar/more.png'),
  whatsappButton: require('./assets/action-bar/whatsapp.png'),
};

const STATUS_ASSETS = {
  edit: require('./assets/status feed/generated/edit-tight.png'),
  more: require('./assets/status feed/generated/more-tight.png'),
  profileButton: require('./assets/status feed/profile.png'),
  statusBadge: require('./assets/status feed/logo.png'),
  whatsappGlyph: require('./assets/status feed/generated/whatsapp-tight.png'),
};

const FIGMA_ASSETS = {
  birthday: 'https://www.figma.com/api/mcp/asset/afec2932-17e1-4696-a98a-060db56e0b3f',
  caretDown: 'https://www.figma.com/api/mcp/asset/6e89297b-5a77-412a-8e08-e643a41aa41e',
  edit: 'https://www.figma.com/api/mcp/asset/9f3a2195-97ef-404d-8004-cba0f9d754f6',
  more: 'https://www.figma.com/api/mcp/asset/a0eea421-1c18-4d93-a4a1-3349b1b7023f',
  profileButton: 'https://www.figma.com/api/mcp/asset/3cf8fab1-970d-4e3e-b334-ae5e111b7dab',
  statusBadge: 'https://www.figma.com/api/mcp/asset/5f841310-fa35-4982-b5c0-fa291043a749',
  trending: 'https://www.figma.com/api/mcp/asset/4c1f935d-f2c0-4824-bf8b-946db1915956',
  whatsappGlyph: 'https://www.figma.com/api/mcp/asset/7b524113-060d-4e44-93e0-727f485e2c54',
};

const ACTION_BUTTON_SIZE = 56;
const ACTION_ICON_BUTTON_SIZE = 44;
const ACTION_ITEM_GAP = 6;
const ACTION_ITEM_WIDTH = 76;
const ACTION_BAR_HORIZONTAL_PADDING = 12;
const ACTION_BAR_VERTICAL_PADDING = 12;
const ACTION_LABEL_GAP = 8;
const ACTION_LABEL_LINE_HEIGHT = 16;
const ACTION_BAR_HEIGHT =
  ACTION_BAR_VERTICAL_PADDING * 2 +
  ACTION_BUTTON_SIZE +
  ACTION_LABEL_GAP +
  ACTION_LABEL_LINE_HEIGHT;
const ACTION_ROW_HEIGHT = 72;
const BOTTOM_NAV_HEIGHT = 48;
const MAX_BOTTOM_VISUAL_INSET = 16;
const SWIPE_DIRECTION_THRESHOLD = 6;
const CHROME_ANIMATION_DURATION = 280;
const HEADER_BOTTOM_PADDING = 12;
const HEADER_TITLE_ROW_HEIGHT = 40;
const FONT_FAMILY_REGULAR = 'GoogleSans-Regular';
const FONT_FAMILY_MEDIUM = 'GoogleSans-Medium';
const FONT_FAMILY_BOLD = 'GoogleSans-Bold';
const ANDROID_FEED_DECELERATION_RATE = 0.998;
const FEED_IMAGE_PRELOAD_AHEAD_COUNT = 3;
const FEED_IMAGE_PRELOAD_BEHIND_COUNT = 1;

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

const LEGACY_TOP_FILTERS: Array<{
  active?: boolean;
  chevron?: boolean;
  icon?: 'birthday' | 'trending';
  label: string;
}> = [
  { active: true, label: 'For you' },
  { label: "Today's special" },
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

const STATUS_TOP_FILTERS: Array<{
  active?: boolean;
  chevron?: boolean;
  icon?: 'birthday' | 'trending';
  label: string;
}> = LEGACY_TOP_FILTERS.filter(
  (filter) =>
    filter.label !== 'Motivation' &&
    filter.label !== 'Festival' &&
    filter.label !== 'Good Morning',
);

const NAV_ITEMS: Array<{
  Icon: typeof BottomNav1;
  key: string;
}> = [
  { Icon: BottomNav1, key: 'news' },
  { Icon: BottomNav2, key: 'posters' },
  { Icon: BottomNav3, key: 'alerts' },
  { Icon: BottomNav4, key: 'profile' },
];

const HYBRID_NAV_ITEMS = [NAV_ITEMS[1], NAV_ITEMS[0], NAV_ITEMS[2], NAV_ITEMS[3]];

const LEGACY_ACTIONS: Array<{
  customType?: 'download' | 'edit-status' | 'instagram' | 'more' | 'whatsapp';
  Icon?: ComponentType<{ height?: number; width?: number }>;
  label: string;
  size: number;
}> = [
  { customType: 'download', label: 'Download', size: ACTION_BUTTON_SIZE },
  { customType: 'whatsapp', label: 'Whatsapp', size: ACTION_BUTTON_SIZE },
  { customType: 'instagram', label: 'Instagram', size: ACTION_BUTTON_SIZE },
  { customType: 'edit-status', label: 'Edit', size: ACTION_BUTTON_SIZE },
  { customType: 'more', label: 'More', size: ACTION_BUTTON_SIZE },
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

type FeedVariant = 'hybrid' | 'legacy' | 'status';

const DEFAULT_FEED_VARIANT: FeedVariant = 'status';
const FEED_VARIANT_OPTIONS: FeedVariant[] = ['legacy', 'status', 'hybrid'];
const FEED_VARIANT_LABELS: Record<FeedVariant, string> = {
  hybrid: 'Hybrid Feed',
  legacy: 'Legacy Feed',
  status: 'Status Feed',
};

type AppScreen = 'feed' | 'profile';

type PosterStagePalette = {
  auraPalette: AuraPalette;
  dominantHex: string;
};

type FeedItem = {
  key: string;
  mediaType: 'image' | 'video';
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

interface PosterBackdropModel {
  baseColor: [number, number, number];
  bottomLiftColor: [number, number, number];
  centerGlowRadius: number;
  edgeShadeColor: [number, number, number];
  idBase: string;
  sideGlowRadius: number;
  speckles: AuraSpeckle[];
  topBlobRadius: number;
  topShadeColor: [number, number, number];
  vignetteRadius: number;
  bottomBlobRadius: number;
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
const FEED_WINDOW_SIZE = 3;
const FEED_BATCH_RENDER_COUNT = 2;

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
const posterBackdropModelCache = new Map<string, PosterBackdropModel>();
const feedImageWarmCache = new Set<string>();

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

function getAuraParamsCacheKey(auraParams: AuraParams) {
  return [
    auraParams.intensity,
    auraParams.gradientMidOpacity,
    auraParams.gradientMidPoint,
    auraParams.glowOpacity,
    auraParams.accentBlobOpacity,
    auraParams.accentBlobBlur,
    auraParams.vignetteOpacity,
    auraParams.shadowY,
    auraParams.shadowBlur,
    auraParams.shadowOpacity,
    auraParams.shadowColorMatch,
  ].join(':');
}

function getPosterBackdropModel(
  dominantHex: string,
  palette: AuraPalette,
  width: number,
  height: number,
  auraParams: AuraParams,
) {
  const cacheKey = `${dominantHex}-${Math.round(width)}x${Math.round(height)}-${getAuraParamsCacheKey(auraParams)}`;
  const cachedModel = posterBackdropModelCache.get(cacheKey);

  if (cachedModel) {
    return cachedModel;
  }

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
  const intensityScale = DEFAULT_AURA_PARAMS.intensity
    ? auraParams.intensity / DEFAULT_AURA_PARAMS.intensity
    : 1;
  const blobSpreadScale = DEFAULT_AURA_PARAMS.accentBlobBlur
    ? auraParams.accentBlobBlur / DEFAULT_AURA_PARAMS.accentBlobBlur
    : 1;
  const nextModel = {
    baseColor,
    bottomBlobRadius:
      Math.max(width * 0.66, height * 0.28) * blobSpreadScale,
    bottomLiftColor,
    centerGlowRadius:
      Math.max(width * 0.84, height * 0.48) * (0.92 + intensityScale * 0.08),
    edgeShadeColor,
    idBase: `poster-stage-aura-${dominantHex.replace('#', '')}`,
    sideGlowRadius:
      Math.max(width * 0.7, height * 0.36) * (0.94 + blobSpreadScale * 0.06),
    speckles,
    topBlobRadius:
      Math.max(width * 0.74, height * 0.34) * blobSpreadScale,
    topShadeColor,
    vignetteRadius: Math.max(width * 1.02, height * 0.8),
  } satisfies PosterBackdropModel;

  posterBackdropModelCache.set(cacheKey, nextModel);

  return nextModel;
}

function createFeedItem(
  key: string,
  dominantHex: string,
  source: number,
  options?: Partial<Pick<FeedItem, 'mediaType'>>,
): FeedItem {
  return {
    ...options,
    key,
    mediaType: options?.mediaType ?? 'image',
    palette: {
      auraPalette: getAuraPalette(dominantHex),
      dominantHex,
    },
    source,
  };
}

const STATUS_FEED_ITEMS: FeedItem[] = [
  createFeedItem('feed-1', '#E5E4DE', ASSETS.feed1),
  createFeedItem('feed-video-1', '#A67558', ASSETS.feedVideo1, {
    mediaType: 'video',
  }),
  createFeedItem('feed-video-2', '#AF7C61', ASSETS.feedVideo2, {
    mediaType: 'video',
  }),
  createFeedItem('feed-video-3', '#58543A', ASSETS.feedVideo3, {
    mediaType: 'video',
  }),
  createFeedItem('feed-2', '#621C4D', ASSETS.feed2),
  createFeedItem('feed-3', '#6E1B56', ASSETS.feed3),
  createFeedItem('feed-4', '#74BABE', ASSETS.feed4),
  createFeedItem('feed-5', '#432918', ASSETS.feed5),
  createFeedItem('feed-8', '#02234E', ASSETS.feed8),
];

function getLoopedFeedItems(items: FeedItem[]) {
  const firstFeedItem = items[0];
  return firstFeedItem
    ? [...items, { ...firstFeedItem, key: `${firstFeedItem.key}-loop` }]
    : items;
}

const PosterStageBackdrop = memo(function PosterStageBackdrop({
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
  const {
    baseColor,
    bottomBlobRadius,
    bottomLiftColor,
    centerGlowRadius,
    edgeShadeColor,
    idBase,
    sideGlowRadius,
    speckles,
    topBlobRadius,
    topShadeColor,
    vignetteRadius,
  } = getPosterBackdropModel(
    dominantHex,
    palette,
    width,
    height,
    auraParams,
  );
  const intensityScale = DEFAULT_AURA_PARAMS.intensity
    ? auraParams.intensity / DEFAULT_AURA_PARAMS.intensity
    : 1;

  return (
    <View
      pointerEvents="none"
      renderToHardwareTextureAndroid
      shouldRasterizeIOS
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
});

const FilterChip = memo(function FilterChip({
  active = false,
  chevron = false,
  fontsError,
  fontsLoaded,
  icon,
  label,
  variant = 'status',
}: {
  active?: boolean;
  chevron?: boolean;
  fontsError?: Error | null;
  fontsLoaded?: boolean;
  icon?: 'birthday' | 'trending';
  label: string;
  variant?: FeedVariant;
}) {
  return (
    <Pressable
      style={[
        styles.filterChip,
        active ? styles.filterChipActive : styles.filterChipInactive,
      ]}
    >
      {icon === 'trending'
        ? <Ionicons color="rgba(255,255,255,0.75)" name="flame-outline" size={16} />
        : null}
      {icon === 'birthday'
        ? <FontAwesome5 color="rgba(255,255,255,0.75)" name="birthday-cake" size={14} />
        : null}
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
      {chevron
        ? <Ionicons color="rgba(255,255,255,0.75)" name="chevron-down" size={12} />
        : null}
    </Pressable>
  );
});

function RemoteIcon({
  source,
  style,
}: {
  source: string | number;
  style?: object;
}) {
  return (
    <Image
      cachePolicy="memory-disk"
      contentFit="contain"
      source={typeof source === 'string' ? { uri: source } : source}
      style={style}
    />
  );
}

function LocalIcon({
  source,
  style,
}: {
  source: number;
  style?: object;
}) {
  return <RNImage resizeMode="contain" source={source} style={style} />;
}

const ActionButton = memo(function ActionButton({
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
        <View style={[styles.actionIconWrap, { height: size, width: size }]}>
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
});

function ActionPngIcon({
  source,
  style,
}: {
  source: number;
  style?: object;
}) {
  return (
    <Image contentFit="contain" source={source} style={[styles.actionPngIcon, style]} />
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

const BottomNavItem = memo(function BottomNavItem({
  Icon,
  onPress,
}: {
  Icon: typeof BottomNav1;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.bottomNavItem}>
      <View style={styles.bottomNavIconWrap}>
        <Icon height={40} width={40} />
      </View>
    </Pressable>
  );
});

function ActionBarSpacer() {
  return <View style={styles.actionBarSpacer} />;
}

function normalizeFeedIndex(index: number, itemCount: number) {
  return ((index % itemCount) + itemCount) % itemCount;
}

async function warmFeedImage(item: FeedItem) {
  if (item.mediaType !== 'image') {
    return;
  }

  if (feedImageWarmCache.has(item.key)) {
    return;
  }

  feedImageWarmCache.add(item.key);

  try {
    await Image.loadAsync(item.source);
  } catch {
    feedImageWarmCache.delete(item.key);
  }
}

const FeedVideo = memo(function FeedVideo({
  isActive,
  source,
}: {
  isActive: boolean;
  source: number;
}) {
  const player = useVideoPlayer(source, (nextPlayer) => {
    nextPlayer.loop = true;
    nextPlayer.muted = false;
    nextPlayer.volume = 1;
    nextPlayer.audioMixingMode = 'doNotMix';
  });

  useEffect(() => {
    if (isActive) {
      player.currentTime = 0;
      player.play();
      return;
    }

    player.pause();
    player.currentTime = 0;
  }, [isActive, player]);

  return (
    <VideoView
      allowsPictureInPicture={false}
      contentFit="contain"
      fullscreenOptions={{ enable: false }}
      nativeControls={false}
      player={player}
      showsTimecodes={false}
      style={styles.posterImage}
    />
  );
});

const PosterCard = memo(function PosterCard({
  isActive,
  item,
  posterAreaHeight,
  posterBottomInset,
  width,
}: {
  isActive: boolean;
  item: FeedItem;
  posterAreaHeight: number;
  posterBottomInset: Animated.AnimatedInterpolation<string | number> | number;
  width: number;
}) {
  return (
    <View style={[styles.posterFrame, { height: posterAreaHeight, width }]}>
      <Animated.View
        style={[
          styles.posterContent,
          {
            paddingBottom: posterBottomInset,
          },
        ]}
      >
        {item.mediaType === 'video' ? (
          <FeedVideo isActive={isActive} source={item.source} />
        ) : (
          <Image
            cachePolicy="memory-disk"
            contentFit="contain"
            recyclingKey={item.key}
            source={item.source}
            style={styles.posterImage}
          />
        )}
      </Animated.View>
    </View>
  );
});

function FeedScreen({
  onOpenFeedVariantMenu,
  onOpenProfile,
  variant,
}: {
  onOpenFeedVariantMenu: () => void;
  onOpenProfile: () => void;
  variant: FeedVariant;
}) {
  const isHybridVariant = variant === 'hybrid';
  const isLegacyVariant = variant === 'legacy';
  const isStatusVariant = variant === 'status';
  const feedItems = STATUS_FEED_ITEMS;
  const loopedFeedItems = useMemo(() => getLoopedFeedItems(feedItems), [feedItems]);
  const topFilters = isStatusVariant ? STATUS_TOP_FILTERS : LEGACY_TOP_FILTERS;
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
  const resolvedHeaderHeight =
    insets.top +
    8 +
    (isStatusVariant ? HEADER_TITLE_ROW_HEIGHT : 0) +
    filterWrapHeight +
    HEADER_BOTTOM_PADDING;
  const resolvedBottomInset = Math.min(insets.bottom, MAX_BOTTOM_VISUAL_INSET);
  const resolvedBottomNavHeight = BOTTOM_NAV_HEIGHT + resolvedBottomInset;
  const resolvedDockHeight = ACTION_ROW_HEIGHT;
  const resolvedActionBarHeight = isStatusVariant
    ? resolvedDockHeight + resolvedBottomInset
    : isHybridVariant
      ? resolvedDockHeight
      : ACTION_BAR_HEIGHT;
  const posterAreaHeight = height - resolvedHeaderHeight;
  const activeFeedItem = feedItems[activeFeedIndex] ?? feedItems[0];
  const auraParams = DEFAULT_AURA_PARAMS;
  const posterBottomInset = useMemo(
    () =>
      isStatusVariant
        ? resolvedActionBarHeight
        : isHybridVariant
          ? resolvedDockHeight + resolvedBottomNavHeight
        : chromeVisibility.interpolate({
            inputRange: [0, 1],
            outputRange: [
              resolvedActionBarHeight + resolvedBottomInset,
              resolvedActionBarHeight + resolvedBottomNavHeight,
            ],
          }),
    [
      chromeVisibility,
      isHybridVariant,
      isStatusVariant,
      resolvedActionBarHeight,
      resolvedDockHeight,
      resolvedBottomInset,
      resolvedBottomNavHeight,
    ],
  );
  const bottomChromeTranslateY = useMemo(
    () =>
      chromeVisibility.interpolate({
        inputRange: [0, 1],
        outputRange: [resolvedBottomNavHeight, 0],
      }),
    [chromeVisibility, resolvedBottomNavHeight],
  );
  const bottomChromeOpacity = useMemo(
    () =>
      chromeVisibility.interpolate({
        inputRange: [0, 1],
        outputRange: [0.92, 1],
      }),
    [chromeVisibility],
  );
  const actionBarBottomOffset = useMemo(
    () =>
      chromeVisibility.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -resolvedBottomNavHeight],
      }),
    [chromeVisibility, resolvedBottomNavHeight],
  );
  const actionBarBottomPadding = useMemo(
    () =>
      chromeVisibility.interpolate({
        inputRange: [0, 1],
        outputRange: [resolvedBottomInset, 0],
      }),
    [chromeVisibility, resolvedBottomInset],
  );

  useEffect(() => {
    if (width <= 0 || posterAreaHeight <= 0) {
      return;
    }

    const backdropHeight = resolvedHeaderHeight + posterAreaHeight;

    feedItems.forEach((item) => {
      getPosterBackdropModel(
        item.palette.dominantHex,
        item.palette.auraPalette,
        width,
        backdropHeight,
        auraParams,
      );
    });
  }, [auraParams, feedItems, posterAreaHeight, resolvedHeaderHeight, width]);

  useEffect(() => {
    const itemsToWarm = new Set<FeedItem>();

    for (
      let offset = -FEED_IMAGE_PRELOAD_BEHIND_COUNT;
      offset <= FEED_IMAGE_PRELOAD_AHEAD_COUNT;
      offset += 1
    ) {
      const item = feedItems[normalizeFeedIndex(activeFeedIndex + offset, feedItems.length)];

      if (item) {
        itemsToWarm.add(item);
      }
    }

    itemsToWarm.forEach((item) => {
      void warmFeedImage(item);
    });
  }, [activeFeedIndex, feedItems]);

  useEffect(() => {
    feedListRef.current?.scrollToOffset({ animated: false, offset: 0 });
    activeFeedIndexRef.current = 0;
    lastScrollOffsetRef.current = 0;
    setActiveFeedIndex(0);
    chromeVisibility.setValue(1);
    isChromeVisibleRef.current = true;
  }, [chromeVisibility, variant]);

  const commitActiveFeedIndex = (offsetY: number) => {
    const nextIndex = Math.round(offsetY / posterAreaHeight);
    const normalizedIndex = normalizeFeedIndex(nextIndex, feedItems.length);

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
      feedItems.length,
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
    if (isLegacyVariant) {
      const deltaY = offsetY - lastScrollOffsetRef.current;

      if (offsetY <= 0) {
        setChromeVisible(true);
      } else if (deltaY > SWIPE_DIRECTION_THRESHOLD) {
        setChromeVisible(false);
      } else if (deltaY < -SWIPE_DIRECTION_THRESHOLD) {
        setChromeVisible(true);
      }
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

    if (nextIndex !== loopedFeedItems.length - 1) {
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

  const renderPosterItem = useCallback(
    ({ index, item }: { index: number; item: FeedItem }) => (
      <PosterCard
        isActive={normalizeFeedIndex(index, feedItems.length) === activeFeedIndex}
        item={item}
        posterAreaHeight={posterAreaHeight}
        posterBottomInset={posterBottomInset}
        width={width}
      />
    ),
    [activeFeedIndex, feedItems.length, posterAreaHeight, posterBottomInset, width],
  );

  const renderActionItem = useCallback(
    ({ item: action }: { item: (typeof LEGACY_ACTIONS)[number] }) => (
      <ActionButton
        {...action}
        fontsError={fontsError}
        fontsLoaded={fontsLoaded}
        onPress={action.customType === 'more' ? onOpenFeedVariantMenu : undefined}
      />
    ),
    [fontsError, fontsLoaded, onOpenFeedVariantMenu],
  );

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
          {isStatusVariant ? (
            <View style={styles.topBar}>
              <View style={styles.topBarBrand}>
                <LocalIcon source={STATUS_ASSETS.statusBadge} style={styles.topBarBadge} />
              </View>
              <Pressable onPress={onOpenProfile} style={styles.topBarProfileButton}>
                <Image
                  contentFit="cover"
                  source={STATUS_ASSETS.profileButton}
                  style={styles.topBarProfileImage}
                />
              </Pressable>
            </View>
          ) : null}
          <View onLayout={handleFilterWrapLayout} style={styles.filterWrap}>
            {topFilters.map((filter) => (
              <FilterChip
                key={filter.label}
                {...filter}
                fontsError={fontsError}
                fontsLoaded={fontsLoaded}
                variant={variant}
              />
            ))}
          </View>
        </View>

        <View style={[styles.posterArea, { height: posterAreaHeight }]}>
          <FlatList
            data={loopedFeedItems}
            decelerationRate={
              Platform.OS === 'android'
                ? ANDROID_FEED_DECELERATION_RATE
                : 'fast'
            }
            disableIntervalMomentum
            getItemLayout={(_, index) => ({
              index,
              length: posterAreaHeight,
              offset: posterAreaHeight * index,
            })}
            initialNumToRender={FEED_BATCH_RENDER_COUNT}
            keyExtractor={(item) => item.key}
            maxToRenderPerBatch={FEED_BATCH_RENDER_COUNT}
            onMomentumScrollEnd={handleFeedMomentumEnd}
            onScroll={handleFeedScroll}
            onScrollBeginDrag={handleFeedScroll}
            onScrollEndDrag={handleFeedScrollEndDrag}
            removeClippedSubviews={Platform.OS === 'android'}
            renderItem={renderPosterItem}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
            snapToAlignment="start"
            snapToInterval={posterAreaHeight}
            style={styles.posterList}
            extraData={activeFeedIndex}
            ref={feedListRef}
            updateCellsBatchingPeriod={16}
            windowSize={FEED_WINDOW_SIZE}
          />
        </View>
      </View>

      {isStatusVariant ? (
        <View
          style={[
            styles.actionBarContainer,
            {
              paddingBottom: resolvedBottomInset,
            },
          ]}
        >
            <View style={styles.actionBar}>
              <Pressable style={styles.shareButton}>
                <View style={styles.shareButtonIconWrap}>
                  <LocalIcon source={STATUS_ASSETS.whatsappGlyph} style={styles.shareButtonIcon} />
                </View>
                <Text
                  style={[
                    styles.shareButtonLabel,
                  {
                    fontFamily: getGoogleSansFontFamily(
                      !!fontsLoaded,
                      fontsError,
                      'medium',
                    ),
                  },
                ]}
              >
                Share
              </Text>
            </Pressable>
            <Pressable style={styles.actionIconButton}>
              <LocalIcon source={STATUS_ASSETS.edit} style={styles.actionEditGlyph} />
            </Pressable>
            <Pressable onPress={onOpenFeedVariantMenu} style={styles.actionIconButton}>
              <LocalIcon source={STATUS_ASSETS.more} style={styles.actionMoreGlyph} />
            </Pressable>
          </View>
        </View>
      ) : isHybridVariant ? (
        <>
          <View
            style={[
              styles.hybridDockContainer,
              {
                bottom: resolvedBottomNavHeight,
              },
            ]}
          >
            <View style={styles.actionBar}>
              <Pressable style={styles.shareButton}>
                <View style={styles.shareButtonIconWrap}>
                  <LocalIcon source={STATUS_ASSETS.whatsappGlyph} style={styles.shareButtonIcon} />
                </View>
                <Text
                  style={[
                    styles.shareButtonLabel,
                    {
                      fontFamily: getGoogleSansFontFamily(
                        !!fontsLoaded,
                        fontsError,
                        'medium',
                      ),
                    },
                  ]}
                >
                  Share
                </Text>
              </Pressable>
              <Pressable style={styles.actionIconButton}>
                <LocalIcon source={STATUS_ASSETS.edit} style={styles.actionEditGlyph} />
              </Pressable>
              <Pressable onPress={onOpenFeedVariantMenu} style={styles.actionIconButton}>
                <LocalIcon source={STATUS_ASSETS.more} style={styles.actionMoreGlyph} />
              </Pressable>
            </View>
          </View>

          <View style={styles.bottomNavContainer}>
            <View style={[styles.bottomNavShell, { paddingBottom: resolvedBottomInset }]}>
              <View style={styles.bottomNav}>
                {HYBRID_NAV_ITEMS.map((item) => (
                  <BottomNavItem
                    key={item.key}
                    Icon={item.Icon}
                    onPress={item.key === 'profile' ? onOpenProfile : undefined}
                  />
                ))}
              </View>
            </View>
          </View>
        </>
      ) : (
        <>
          <Animated.View
            renderToHardwareTextureAndroid
            shouldRasterizeIOS
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
                  <BottomNavItem
                    key={item.key}
                    Icon={item.Icon}
                    onPress={item.key === 'profile' ? onOpenProfile : undefined}
                  />
                ))}
              </View>
            </View>
          </Animated.View>

          <Animated.View
            renderToHardwareTextureAndroid
            shouldRasterizeIOS
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
              data={LEGACY_ACTIONS}
              horizontal
              ItemSeparatorComponent={ActionBarSpacer}
              keyExtractor={(item) => item.label}
              renderItem={renderActionItem}
              showsHorizontalScrollIndicator={false}
              style={styles.legacyActionBar}
            />
            <Animated.View
              pointerEvents="none"
              style={[styles.bottomNavSeparator, { opacity: chromeVisibility }]}
            />
          </Animated.View>
        </>
      )}
    </View>
  );
}

export default function App() {
  const [activeScreen, setActiveScreen] = useState<AppScreen>('feed');
  const [feedVariant, setFeedVariant] = useState<FeedVariant>(DEFAULT_FEED_VARIANT);

  const openFeedVariantMenu = useCallback(() => {
    const optionLabels = FEED_VARIANT_OPTIONS.map((option) => FEED_VARIANT_LABELS[option]);

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          cancelButtonIndex: optionLabels.length,
          options: [...optionLabels, 'Cancel'],
          title: 'Switch Feed Design',
        },
        (selectedIndex) => {
          if (selectedIndex >= 0 && selectedIndex < FEED_VARIANT_OPTIONS.length) {
            setFeedVariant(FEED_VARIANT_OPTIONS[selectedIndex]);
          }
        },
      );

      return;
    }

    Alert.alert(
      'Switch Feed Design',
      undefined,
      [
        ...FEED_VARIANT_OPTIONS.map((option) => ({
          onPress: () => setFeedVariant(option),
          text: FEED_VARIANT_LABELS[option],
        })),
        { style: 'cancel' as const, text: 'Cancel' },
      ],
      { cancelable: true },
    );
  }, []);

  return (
    <SafeAreaProvider>
      {activeScreen === 'profile' ? (
        <ProfilePrototypeScreen onBack={() => setActiveScreen('feed')} />
      ) : (
        <FeedScreen
          onOpenFeedVariantMenu={openFeedVariantMenu}
          onOpenProfile={() => setActiveScreen('profile')}
          variant={feedVariant}
        />
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  actionBar: {
    alignItems: 'center',
    backgroundColor: '#000000',
    flexDirection: 'row',
    gap: 12,
    height: ACTION_ROW_HEIGHT,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  actionIconButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: ACTION_ICON_BUTTON_SIZE / 2,
    borderWidth: 1.1,
    height: ACTION_ICON_BUTTON_SIZE,
    justifyContent: 'center',
    width: ACTION_ICON_BUTTON_SIZE,
  },
  actionEditGlyph: {
    height: 18,
    width: 18,
  },
  actionMoreGlyph: {
    height: 22,
    width: 22,
  },
  actionBarContent: {
    alignItems: 'center',
    paddingBottom: ACTION_BAR_VERTICAL_PADDING,
    paddingHorizontal: ACTION_BAR_HORIZONTAL_PADDING,
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
  bottomNav: {
    flexDirection: 'row',
    height: BOTTOM_NAV_HEIGHT,
  },
  bottomNavContainer: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
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
  bottomNavSeparator: {
    backgroundColor: '#1A1A1A',
    height: 1,
  },
  bottomNavShell: {
    backgroundColor: '#000000',
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
    borderColor: 'rgba(255,255,255,0.12)',
  },
  filterChipInactive: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(255,255,255,0.12)',
  },
  filterChipChevron: {
    height: 12,
    opacity: 0.75,
    width: 12,
  },
  filterChipIcon: {
    height: 16,
    opacity: 0.75,
    width: 16,
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
    paddingTop: 12,
    rowGap: 8,
  },
  header: {
    overflow: 'hidden',
  },
  hybridDockContainer: {
    backgroundColor: '#000000',
    left: 0,
    position: 'absolute',
    right: 0,
  },
  instagramButtonImage: {
    height: ACTION_BUTTON_SIZE,
    width: ACTION_BUTTON_SIZE,
  },
  legacyActionBar: {
    backgroundColor: '#000000',
    height: ACTION_BAR_HEIGHT,
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
  shareButton: {
    alignItems: 'center',
    backgroundColor: '#113529',
    borderColor: '#25473E',
    borderRadius: 100,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 4,
    height: ACTION_ICON_BUTTON_SIZE,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  shareButtonIcon: {
    height: 18,
    width: 18,
  },
  shareButtonIconWrap: {
    alignItems: 'center',
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  shareButtonLabel: {
    color: '#EDFFEB',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
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
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    height: HEADER_TITLE_ROW_HEIGHT,
    justifyContent: 'space-between',
    paddingLeft: 18,
    paddingRight: 16,
  },
  topBarBadge: {
    height: 22,
    width: 81,
  },
  topBarBrand: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  topBarProfileButton: {
    borderRadius: 18,
    borderWidth: 0,
    height: 36,
    overflow: 'hidden',
    width: 36,
  },
  topBarProfileImage: {
    height: '100%',
    width: '100%',
  },
});
