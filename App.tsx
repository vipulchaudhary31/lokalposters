import type { ComponentType } from 'react';
import { StatusBar } from 'expo-status-bar';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pen } from 'lucide-react-native';
import ActionBar1 from './assets/action-bar/1.svg';
import ActionBar2 from './assets/action-bar/2.svg';
import ActionBar4 from './assets/action-bar/4.svg';
import BottomNav1 from './assets/bottom-nav/1.svg';
import BottomNav2 from './assets/bottom-nav/2.svg';
import BottomNav3 from './assets/bottom-nav/3.svg';
import BottomNav4 from './assets/bottom-nav/4.svg';
import {
  FlatList,
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

const FEED_ITEMS = [
  { key: 'feed-1', source: ASSETS.feed1 },
  { key: 'feed-2', source: ASSETS.feed2 },
  { key: 'feed-3', source: ASSETS.feed3 },
  { key: 'feed-4', source: ASSETS.feed4 },
  { key: 'feed-5', source: ASSETS.feed5 },
];

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
      <View style={styles.editStatusPencil}>
        {[-1, 0, 1, 0].map((dx, index) => {
          const dy = [0, -1, 0, 1][index];

          return (
            <View
              key={`${dx}-${dy}`}
              pointerEvents="none"
              style={[
                styles.editStatusPencilOutline,
                { transform: [{ translateX: dx }, { translateY: dy }] },
              ]}
            >
              <Pen color="#000000" fill="#000000" size={25} strokeWidth={2.2} />
            </View>
          );
        })}
        <View pointerEvents="none" style={styles.editStatusPencilInner}>
          <Pen color="#F0F0F0" fill="#F0F0F0" size={21} strokeWidth={2.4} />
        </View>
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
  const resolvedHeaderHeight = HEADER_HEIGHT + insets.top;
  const resolvedBottomNavHeight = BOTTOM_NAV_HEIGHT + insets.bottom;
  const chromeHeight =
    resolvedHeaderHeight + ACTION_BAR_HEIGHT + resolvedBottomNavHeight;
  const posterAreaHeight = height - chromeHeight;

  return (
    <View style={styles.screen}>
      <StatusBar hidden={false} style="light" />

      <View style={[styles.header, { height: resolvedHeaderHeight, paddingTop: insets.top + 8 }]}>
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
          pagingEnabled
          renderItem={({ item }) => (
            <View style={[styles.posterFrame, { height: posterAreaHeight, width }]}>
              <Image contentFit="contain" source={item.source} style={styles.posterImage} />
            </View>
          )}
          showsVerticalScrollIndicator={false}
          snapToAlignment="start"
          snapToInterval={posterAreaHeight}
          style={styles.posterList}
        />
      </View>

      <View style={styles.actionBar}>
        {ACTIONS.map((action) => (
          <ActionButton key={action.label} {...action} />
        ))}
      </View>

      <View style={[styles.bottomNavShell, { paddingBottom: insets.bottom }]}>
        <View style={styles.bottomNav}>
          {NAV_ITEMS.map((item) => (
            <BottomNavItem key={item.key} Icon={item.Icon} />
          ))}
        </View>
      </View>
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
    paddingTop: 12,
    paddingBottom: 12,
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
    bottom: 8,
    justifyContent: 'center',
    position: 'absolute',
    right:6,
  },
  editStatusPencilInner: {
    position: 'absolute',
  },
  editStatusPencilOutline: {
    position: 'absolute',
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
    borderTopColor: 'rgba(255,255,255,0.1)',
    borderTopWidth: 1,
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
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderColor: 'rgba(255,255,255,0.12)',
  },
  filterChipInactive: {
    borderColor: 'rgba(255,255,255,0.12)',
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
    rowGap: 8,
  },
  header: {
    backgroundColor: '#2E3435',
    height: HEADER_HEIGHT,
  },
  posterArea: {
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
  posterFrame: {
    alignItems: 'center',
    backgroundColor: '#000000',
    justifyContent: 'center',
    width: '100%',
  },
  posterList: {
    flex: 1,
  },
  posterImage: {
    height: '100%',
    width: '100%',
  },
  screen: {
    backgroundColor: '#000000',
    flex: 1,
  },
});
