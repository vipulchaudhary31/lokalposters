import { useRef, useState } from 'react';
import type { ComponentType } from 'react';
import { StatusBar } from 'expo-status-bar';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
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
  editStatusAvatar: require('./assets/action-bar/3-avatar.png'),
  feed1: require('./assets/feed/image 60763.png'),
  feed2: require('./assets/feed/image 60764.png'),
  feed3: require('./assets/feed/image 60765.png'),
  feed4: require('./assets/feed/image 60768.png'),
  feed5: require('./assets/feed/image 60769.png'),
};

const HEADER_HEIGHT = 82;
const ACTION_BAR_HEIGHT = 96;
const BOTTOM_NAV_HEIGHT = 48;
const MAX_BOTTOM_VISUAL_INSET = 16;
const SWIPE_DIRECTION_THRESHOLD = 6;
const CHROME_ANIMATION_DURATION = 280;

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
  base: string;
  bloom: string;
  bloomSecondary: string;
  dominantHex: string;
  washFrom: string;
  washTo: string;
};

function mixHexOverBlack(hex: string, opacity: number) {
  const normalizedHex = hex.replace('#', '');

  if (!/^[0-9A-Fa-f]{6}$/.test(normalizedHex)) {
    return '#000000';
  }

  const alpha = Math.max(0, Math.min(1, opacity));
  const red = Math.round(parseInt(normalizedHex.slice(0, 2), 16) * alpha);
  const green = Math.round(parseInt(normalizedHex.slice(2, 4), 16) * alpha);
  const blue = Math.round(parseInt(normalizedHex.slice(4, 6), 16) * alpha);

  return `#${[red, green, blue]
    .map((channel) => channel.toString(16).padStart(2, '0'))
    .join('')}`;
}

const FEED_ITEMS: Array<{
  key: string;
  palette: PosterStagePalette;
  source: number;
}> = [
  {
    key: 'feed-1',
    palette: {
      base: '#F2EDE7',
      bloom: 'rgba(248, 212, 158, 0.22)',
      bloomSecondary: 'rgba(255, 255, 255, 0.16)',
      dominantHex: '#90857B',
      washFrom: 'rgba(255, 255, 255, 0.06)',
      washTo: 'rgba(222, 191, 148, 0.16)',
    },
    source: ASSETS.feed1,
  },
  {
    key: 'feed-2',
    palette: {
      base: '#F4E1EC',
      bloom: 'rgba(238, 184, 220, 0.22)',
      bloomSecondary: 'rgba(255, 244, 250, 0.14)',
      dominantHex: '#6A4D63',
      washFrom: 'rgba(255, 255, 255, 0.05)',
      washTo: 'rgba(221, 159, 201, 0.16)',
    },
    source: ASSETS.feed2,
  },
  {
    key: 'feed-3',
    palette: {
      base: '#F3E9DB',
      bloom: 'rgba(219, 191, 132, 0.16)',
      bloomSecondary: 'rgba(245, 236, 217, 0.12)',
      dominantHex: '#9B8767',
      washFrom: 'rgba(255, 255, 255, 0.04)',
      washTo: 'rgba(214, 186, 136, 0.12)',
    },
    source: ASSETS.feed3,
  },
  {
    key: 'feed-4',
    palette: {
      base: '#B1AAC2',
      bloom: 'rgba(149, 133, 210, 0.18)',
      bloomSecondary: 'rgba(232, 218, 255, 0.12)',
      dominantHex: '#223C66',
      washFrom: 'rgba(255, 255, 255, 0.03)',
      washTo: 'rgba(126, 113, 178, 0.16)',
    },
    source: ASSETS.feed4,
  },
  {
    key: 'feed-5',
    palette: {
      base: '#F4EBDD',
      bloom: 'rgba(208, 182, 118, 0.15)',
      bloomSecondary: 'rgba(250, 242, 225, 0.12)',
      dominantHex: '#9A8A63',
      washFrom: 'rgba(255, 255, 255, 0.04)',
      washTo: 'rgba(203, 182, 136, 0.1)',
    },
    source: ASSETS.feed5,
  },
];

function PosterStageBackdrop() {
  return (
    <View
      pointerEvents="none"
      style={[styles.posterStageBackdrop, { backgroundColor: '#000000' }]}
    />
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
        <Image
          contentFit="cover"
          source={ASSETS.editStatusAvatar}
          style={styles.editStatusAvatar}
        />
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
  const chromeVisibility = useRef(new Animated.Value(1)).current;
  const activeFeedIndexRef = useRef(0);
  const isChromeVisibleRef = useRef(true);
  const lastScrollOffsetRef = useRef(0);
  const [activeFeedIndex, setActiveFeedIndex] = useState(0);
  const resolvedHeaderHeight = HEADER_HEIGHT + insets.top;
  const resolvedBottomInset = Math.min(insets.bottom, MAX_BOTTOM_VISUAL_INSET);
  const resolvedBottomNavHeight = BOTTOM_NAV_HEIGHT + resolvedBottomInset;
  const resolvedActionBarHeight = ACTION_BAR_HEIGHT;
  const posterAreaHeight = height - resolvedHeaderHeight;
  const activeFeedItem = FEED_ITEMS[activeFeedIndex] ?? FEED_ITEMS[0];
  const headerBackgroundColor = mixHexOverBlack(
    activeFeedItem.palette.dominantHex,
    0.56,
  );
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
    const clampedIndex = Math.max(0, Math.min(FEED_ITEMS.length - 1, nextIndex));

    if (clampedIndex === activeFeedIndexRef.current) {
      return;
    }

    activeFeedIndexRef.current = clampedIndex;
    setActiveFeedIndex(clampedIndex);
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

  return (
    <View style={styles.screen}>
      <StatusBar hidden={false} style="light" />

      <View style={styles.screenContent}>
        <View
          style={[
            styles.header,
            {
              backgroundColor: headerBackgroundColor,
              height: resolvedHeaderHeight,
              paddingTop: insets.top + 8,
            },
          ]}
        >
          <View style={styles.filterWrap}>
            {TOP_FILTERS.map((filter) => (
              <FilterChip key={filter.label} {...filter} />
            ))}
          </View>
        </View>

        <View style={[styles.posterArea, { height: posterAreaHeight }]}>
          <FlatList
            data={FEED_ITEMS}
            decelerationRate="fast"
            getItemLayout={(_, index) => ({
              index,
              length: posterAreaHeight,
              offset: posterAreaHeight * index,
            })}
            keyExtractor={(item) => item.key}
            onScroll={handleFeedScroll}
            onScrollBeginDrag={handleFeedScroll}
            pagingEnabled
            renderItem={({ item }) => (
              <View style={[styles.posterFrame, { height: posterAreaHeight, width }]}>
                <PosterStageBackdrop />
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
    height: 60.16,
    left: -25.52,
    position: 'absolute',
    top: -4.22,
    width: 90.24,
  },
  editStatusCircle: {
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 24,
    borderWidth: 2,
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
    height: HEADER_HEIGHT,
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
