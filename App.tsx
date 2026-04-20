import { useRef, useState } from 'react';
import type { ComponentType } from 'react';
import { StatusBar } from 'expo-status-bar';
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
import ActionBar1 from './assets/action-bar/1.svg';
import ActionBar2 from './assets/action-bar/2.svg';
import ActionBar4 from './assets/action-bar/4.svg';
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
  editStatusAvatar: require('./assets/action-bar/sample-photo-bg.png'),
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
};

const ACTION_BAR_HEIGHT = 96;
const BOTTOM_NAV_HEIGHT = 48;
const MAX_BOTTOM_VISUAL_INSET = 16;
const SWIPE_DIRECTION_THRESHOLD = 6;
const CHROME_ANIMATION_DURATION = 280;
const HEADER_BOTTOM_PADDING = 12;

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
  { label: 'Devotional' },
  { label: 'Good Morning' },
  { chevron: true, label: 'More' },
];

const ACTIONS: Array<{
  customType?: 'edit-status';
  Icon?: ComponentType<{ height?: number; width?: number }>;
  label: string;
  size: 48 | 56;
}> = [
  {
    Icon: ActionBar1,
    label: 'Share',
    size: 48,
  },
  {
    Icon: ActionBar2,
    label: 'Download',
    size: 48,
  },
  {
    customType: 'edit-status',
    label: 'Edit Status',
    size: 48,
  },
  {
    Icon: ActionBar4,
    label: 'More',
    size: 48,
  },
];

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
  dominantHex: string;
};

type FeedItem = {
  key: string;
  palette: PosterStagePalette;
  source: number;
};

interface AuraParams {
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

const AURA_INTENSITY = 0.6;
const AURA_PARAMS: AuraParams = {
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

const FEED_ITEMS: FeedItem[] = [
  {
    key: 'feed-1',
    palette: {
      dominantHex: '#E5E4DE',
    },
    source: ASSETS.feed1,
  },
  {
    key: 'feed-2',
    palette: {
      dominantHex: '#621C4D',
    },
    source: ASSETS.feed2,
  },
  {
    key: 'feed-3',
    palette: {
      dominantHex: '#6E1B56',
    },
    source: ASSETS.feed3,
  },
  {
    key: 'feed-4',
    palette: {
      dominantHex: '#E4DFC9',
    },
    source: ASSETS.feed4,
  },
  {
    key: 'feed-5',
    palette: {
      dominantHex: '#432918',
    },
    source: ASSETS.feed5,
  },
  {
    key: 'feed-6',
    palette: {
      dominantHex: '#834E07',
    },
    source: ASSETS.feed6,
  },
  {
    key: 'feed-7',
    palette: {
      dominantHex: '#F8DEBC',
    },
    source: ASSETS.feed7,
  },
  {
    key: 'feed-8',
    palette: {
      dominantHex: '#02234E',
    },
    source: ASSETS.feed8,
  },
  {
    key: 'feed-9',
    palette: {
      dominantHex: '#EDDFD0',
    },
    source: ASSETS.feed9,
  },
  {
    key: 'feed-10',
    palette: {
      dominantHex: '#E3D6BA',
    },
    source: ASSETS.feed10,
  },
];

const firstFeedItem = FEED_ITEMS[0];
const LOOPED_FEED_ITEMS = firstFeedItem
  ? [...FEED_ITEMS, { ...firstFeedItem, key: `${firstFeedItem.key}-loop` }]
  : FEED_ITEMS;

function PosterStageBackdrop({
  dominantHex,
  height,
  width,
}: {
  dominantHex: string;
  height: number;
  width: number;
}) {
  const palette = buildAuraPalette(dominantHex);
  const baseColor = hexToRgb(mixHex(dominantHex, '#120D14', 0.26));
  const topShadeColor = hexToRgb(mixHex(dominantHex, '#17111A', 0.3));
  const edgeShadeColor = hexToRgb(mixHex(dominantHex, '#0B0810', 0.16));
  const bottomLiftColor = hexToRgb(mixHex(dominantHex, '#2A1E2F', 0.42));
  const speckles = buildAuraSpeckles(
    dominantHex,
    palette,
    width,
    height,
  );
  const idBase = `poster-stage-aura-${dominantHex.replace('#', '')}`;
  const centerGlowRadius = Math.max(width * 0.84, height * 0.48);
  const topBlobRadius = Math.max(width * 0.74, height * 0.34);
  const bottomBlobRadius = Math.max(width * 0.66, height * 0.28);
  const sideGlowRadius = Math.max(width * 0.7, height * 0.36);
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
              offset={`${AURA_PARAMS.gradientMidPoint}%`}
              stopColor={rgb(baseColor)}
              stopOpacity={AURA_PARAMS.gradientMidOpacity}
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
              stopOpacity={AURA_PARAMS.glowOpacity}
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
              stopOpacity={AURA_PARAMS.accentBlobOpacity}
            />
            <Stop
              offset="54%"
              stopColor={rgb(palette.vibrant)}
              stopOpacity={AURA_PARAMS.accentBlobOpacity * 0.24}
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
              stopOpacity={AURA_PARAMS.accentBlobOpacity * 0.6}
            />
            <Stop
              offset="56%"
              stopColor={rgb(palette.dominant)}
              stopOpacity={AURA_PARAMS.accentBlobOpacity * 0.18}
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
              stopOpacity={AURA_PARAMS.vignetteOpacity}
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
            opacity={speckle.opacity}
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
  icon,
  label,
}: {
  active?: boolean;
  chevron?: boolean;
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
      <Text style={[styles.filterChipText, active ? styles.filterChipTextActive : styles.filterChipTextInactive]}>
        {label}
      </Text>
      {chevron ? <Ionicons color="rgba(255,255,255,0.75)" name="chevron-down" size={12} /> : null}
    </Pressable>
  );
}

function ActionButton({
  customType,
  Icon,
  label,
  size,
}: {
  customType?: 'edit-status';
  Icon?: ComponentType<{ height?: number; width?: number }>;
  label: string;
  size: 48 | 56;
}) {
  return (
    <Pressable style={styles.actionItem}>
      <View
        style={[
          styles.actionIconWrap,
          { height: size, width: size },
        ]}
      >
        {customType === 'edit-status' ? (
          <EditStatusIcon />
        ) : Icon ? (
          <Icon height={size} width={size} />
        ) : null}
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
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

function FeedScreen() {
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

  const syncActiveFeedIndex = (offsetY: number) => {
    const nextIndex = Math.round(offsetY / posterAreaHeight);
    const normalizedIndex =
      ((nextIndex % FEED_ITEMS.length) + FEED_ITEMS.length) % FEED_ITEMS.length;

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

    syncActiveFeedIndex(offsetY);
    lastScrollOffsetRef.current = offsetY;
  };

  const handleFeedMomentumEnd = ({
    nativeEvent,
  }: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(nativeEvent.contentOffset.y / posterAreaHeight);

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

  return (
    <View style={styles.screen}>
      <StatusBar hidden={false} style="light" />

      <View style={styles.screenContent}>
        <PosterStageBackdrop
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
              <FilterChip key={filter.label} {...filter} />
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
            pagingEnabled
            renderItem={({ item }) => (
              <View style={[styles.posterFrame, { height: posterAreaHeight, width }]}>
                <Animated.View
                  style={[styles.posterContent, { paddingBottom: posterBottomInset }]}
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
        <View style={styles.actionBar}>
          {ACTIONS.map((action) => (
            <ActionButton key={action.label} {...action} />
          ))}
        </View>
        <Animated.View
          pointerEvents="none"
          style={[styles.bottomNavSeparator, { opacity: chromeVisibility }]}
        />
      </Animated.View>
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
    alignItems: 'center',
    backgroundColor: '#000000',
    flexDirection: 'row',
    height: ACTION_BAR_HEIGHT,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    paddingTop: 12,
  },
  actionItem: {
    alignItems: 'center',
    gap: 8,
    width: 72,
  },
  actionIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  actionLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    textAlign: 'center',
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
    borderRadius: 24,
    height: 48,
    overflow: 'hidden',
    width: 48,
  },
  editStatusIcon: {
    height: 48,
    overflow: 'visible',
    width: 48,
  },
  editStatusPencil: {
    alignItems: 'center',
    bottom: -5,
    justifyContent: 'center',
    position: 'absolute',
    right: -8,
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
