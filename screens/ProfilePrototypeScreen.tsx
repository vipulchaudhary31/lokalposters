import { useFonts } from 'expo-font';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import {
  Animated,
  Pressable,
  ScrollView,
  Easing,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useRef, useState } from 'react';

type ProfilePrototypeScreenProps = {
  onBack: () => void;
};

type LoginSlide = {
  bg: number;
  card: number;
  key: string;
  ratio: number;
};

const BOTTOM_PANEL_HEIGHT = 322;
const TOP_SECTION_HORIZONTAL_PADDING = 24;
const TOP_SECTION_BOTTOM_PADDING = 40;
const CARD_TOP_CLEARANCE = 0;
const CARD_SHADOW_ALLOWANCE = 0;
const AUTO_SCROLL_INTERVAL_MS = 2500;
const REPEATED_SLIDE_SETS = 5;

const LOGIN_SLIDES: LoginSlide[] = [
  {
    bg: require('../assets/login/bg1.png'),
    card: require('../assets/login/card1.png'),
    key: 'slide-1',
    ratio: 1008 / 816,
  },
  {
    bg: require('../assets/login/bg2.png'),
    card: require('../assets/login/card 2.png'),
    key: 'slide-2',
    ratio: 1008 / 816,
  },
  {
    bg: require('../assets/login/bg3.png'),
    card: require('../assets/login/card 3.png'),
    key: 'slide-3',
    ratio: 960 / 640,
  },
];

const PAGER_SLIDES: LoginSlide[] = Array.from(
  { length: REPEATED_SLIDE_SETS },
  (_, setIndex) =>
    LOGIN_SLIDES.map((slide, slideIndex) => ({
      ...slide,
      key: `${slide.key}-set-${setIndex}-item-${slideIndex}`,
    })),
).flat();

const MIDDLE_SET_START_INDEX =
  LOGIN_SLIDES.length * Math.floor(REPEATED_SLIDE_SETS / 2);
const RESET_THRESHOLD = LOGIN_SLIDES.length;

export default function ProfilePrototypeScreen({
  onBack,
}: ProfilePrototypeScreenProps) {
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const scrollX = useRef(
    new Animated.Value(width * MIDDLE_SET_START_INDEX),
  ).current;
  const autoScrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const indicatorValuesRef = useRef(
    LOGIN_SLIDES.map((_, index) => new Animated.Value(index === 0 ? 1 : 0)),
  );
  const currentPageRef = useRef(MIDDLE_SET_START_INDEX);
  const isDraggingRef = useRef(false);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [fontsLoaded, fontsError] = useFonts({
    'GoogleSans-Bold': {
      uri: 'https://fonts.gstatic.com/s/googlesans/v67/4Ua_rENHsxJlGDuGo1OIlJfC6l_24rlCK1Yo_Iqcsih3SAyH6cAwhX9RFD48TE63OOYKtrzjJ6li.ttf',
    },
    'GoogleSans-Regular': {
      uri: 'https://fonts.gstatic.com/s/googlesans/v67/4Ua_rENHsxJlGDuGo1OIlJfC6l_24rlCK1Yo_Iqcsih3SAyH6cAwhX9RFD48TE63OOYKtrwEIKli.ttf',
    },
    'GoogleSans-SemiBold': {
      uri: 'https://fonts.gstatic.com/s/googlesans/v67/4Ua_rENHsxJlGDuGo1OIlJfC6l_24rlCK1Yo_Iqcsih3SAyH6cAwhX9RFD48TE63OOYKtrw2IKli.ttf',
    },
  });

  const regularFontFamily =
    fontsLoaded && !fontsError ? 'GoogleSans-Regular' : undefined;
  const semiBoldFontFamily =
    fontsLoaded && !fontsError ? 'GoogleSans-SemiBold' : undefined;
  const topSectionHeight = Math.max(0, height - BOTTOM_PANEL_HEIGHT);
  const navBlockHeight = insets.top + 48;
  const indicatorBottom = 12;
  const availableCardHeight = Math.max(
    0,
    topSectionHeight -
      navBlockHeight -
      CARD_TOP_CLEARANCE -
      TOP_SECTION_BOTTOM_PADDING -
      CARD_SHADOW_ALLOWANCE -
      indicatorBottom -
      10,
  );
  const maxCardWidthByScreen =
    width - TOP_SECTION_HORIZONTAL_PADDING * 2 - CARD_SHADOW_ALLOWANCE;

  const clearAutoScroll = () => {
    if (autoScrollTimerRef.current) {
      clearTimeout(autoScrollTimerRef.current);
      autoScrollTimerRef.current = null;
    }
  };

  const scrollToPage = (page: number, animated: boolean) => {
    scrollRef.current?.scrollTo({
      animated,
      x: page * width,
    });
  };

  const scheduleAutoScroll = () => {
    clearAutoScroll();

    autoScrollTimerRef.current = setTimeout(() => {
      if (isDraggingRef.current) {
        return;
      }

      const nextPage = currentPageRef.current + 1;
      scrollToPage(nextPage, true);
    }, AUTO_SCROLL_INTERVAL_MS);
  };

  useEffect(() => {
    currentPageRef.current = MIDDLE_SET_START_INDEX;
    scrollX.setValue(width * MIDDLE_SET_START_INDEX);
    scrollToPage(MIDDLE_SET_START_INDEX, false);
    scheduleAutoScroll();

    return () => {
      clearAutoScroll();
    };
  }, [width]);

  useEffect(() => {
    Animated.parallel(
      indicatorValuesRef.current.map((value, index) =>
        Animated.timing(value, {
          duration: 220,
          easing: Easing.out(Easing.cubic),
          toValue: index === activeSlideIndex ? 1 : 0,
          useNativeDriver: true,
        }),
      ),
    ).start();
  }, [activeSlideIndex, indicatorValuesRef]);

  const handleCarouselMomentumEnd = ({
    nativeEvent,
  }: NativeSyntheticEvent<NativeScrollEvent>) => {
    const page = Math.round(nativeEvent.contentOffset.x / width);
    currentPageRef.current = page;
    const normalizedSlideIndex =
      ((page % LOGIN_SLIDES.length) + LOGIN_SLIDES.length) % LOGIN_SLIDES.length;
    setActiveSlideIndex(normalizedSlideIndex);

    if (
      page < RESET_THRESHOLD ||
      page >= PAGER_SLIDES.length - RESET_THRESHOLD
    ) {
      const resetPage = MIDDLE_SET_START_INDEX + normalizedSlideIndex;
      requestAnimationFrame(() => {
        currentPageRef.current = resetPage;
        scrollToPage(resetPage, false);
        scrollX.setValue(resetPage * width);
        scheduleAutoScroll();
      });
      return;
    }

    scheduleAutoScroll();
  };

  const handleCarouselBeginDrag = ({
  }: NativeSyntheticEvent<NativeScrollEvent>) => {
    isDraggingRef.current = true;
    clearAutoScroll();
  };

  const handleCarouselEndDrag = () => {
    isDraggingRef.current = false;
  };

  const renderCarouselSlide = ({
    item,
    pagerIndex,
  }: {
    item: LoginSlide;
    pagerIndex: number;
  }) => {
    const maxCardWidthByHeight = availableCardHeight / item.ratio;
    const preferredCardWidth = width;
    const cardWidth = Math.max(
      220,
      Math.min(preferredCardWidth, maxCardWidthByScreen, maxCardWidthByHeight),
    );
    const cardHeight = cardWidth * item.ratio;
    const inputRange = [
      (pagerIndex - 1) * width,
      pagerIndex * width,
      (pagerIndex + 1) * width,
    ];
    const backgroundTranslateX = scrollX.interpolate({
      inputRange,
      outputRange: [-18, 0, 18],
      extrapolate: 'clamp',
    });
    const posterTranslateX = scrollX.interpolate({
      inputRange,
      outputRange: [22, 0, -22],
      extrapolate: 'clamp',
    });
    const posterScale = scrollX.interpolate({
      inputRange,
      outputRange: [0.94, 1, 0.94],
      extrapolate: 'clamp',
    });
    const posterOpacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.9, 1, 0.9],
      extrapolate: 'clamp',
    });

    return (
      <View style={[styles.carouselSlide, { height: topSectionHeight, width }]}>
        <Animated.View
          style={[
            styles.heroBackgroundMotion,
            {
              transform: [{ translateX: backgroundTranslateX }],
            },
          ]}
        >
          <Image contentFit="cover" source={item.bg} style={styles.heroBackground} />
        </Animated.View>
        <View style={styles.posterWrap}>
          <Animated.View
            style={{
              opacity: posterOpacity,
              transform: [{ translateX: posterTranslateX }, { scale: posterScale }],
            }}
          >
            <Image
              contentFit="contain"
              source={item.card}
              style={[
                styles.posterImage,
                {
                  height: cardHeight,
                  width: cardWidth,
                },
              ]}
            />
          </Animated.View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar hidden={false} style="light" />
      <View
        style={[
          styles.topSection,
          {
            height: topSectionHeight,
          },
        ]}
      >
        <Animated.ScrollView
          bounces={false}
          contentOffset={{ x: width * MIDDLE_SET_START_INDEX, y: 0 }}
          decelerationRate="fast"
          disableIntervalMomentum
          directionalLockEnabled
          horizontal
          onScrollBeginDrag={handleCarouselBeginDrag}
          onScrollEndDrag={handleCarouselEndDrag}
          onMomentumScrollEnd={handleCarouselMomentumEnd}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: true },
          )}
          ref={scrollRef}
          scrollEventThrottle={16}
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          style={styles.carousel}
        >
          {PAGER_SLIDES.map((item, index) => (
            <View key={item.key}>
              {renderCarouselSlide({ item, pagerIndex: index })}
            </View>
          ))}
        </Animated.ScrollView>

        <View
          style={[
            styles.header,
            {
              paddingTop: insets.top + 8,
            },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back to feed"
            hitSlop={8}
            onPress={onBack}
            style={styles.backButton}
          >
            <Ionicons color="#FFFFFF" name="chevron-back" size={21} />
            <Text
              style={[styles.backLabel, { fontFamily: regularFontFamily }]}
            >
              Back
            </Text>
          </Pressable>
        </View>

        <View style={[styles.carouselIndicatorWrap, { bottom: indicatorBottom }]}>
          <View style={styles.carouselIndicator}>
            {LOGIN_SLIDES.map((slide, index) => {
              const dotScale = indicatorValuesRef.current[index].interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1],
              });
              const dotOpacity = indicatorValuesRef.current[index].interpolate({
                inputRange: [0, 1],
                outputRange: [0.35, 1],
              });

              return (
                <Animated.View
                key={slide.key}
                style={[
                  styles.carouselDot,
                    {
                      opacity: dotOpacity,
                      transform: [{ scale: dotScale }],
                    },
                ]}
                />
              );
            })}
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <View
          style={[
            styles.bottomSheet,
            {
              height: BOTTOM_PANEL_HEIGHT,
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          <View style={styles.progressBar}>
            <View style={[styles.progressSegment, styles.progressSegmentYellow]} />
            <View style={[styles.progressSegment, styles.progressSegmentOrange]} />
            <View style={[styles.progressSegment, styles.progressSegmentPink]} />
            <View style={[styles.progressSegment, styles.progressSegmentPurple]} />
          </View>

          <View style={styles.bottomSheetContent}>
            <View style={styles.sheetBody}>
              <View style={styles.titleBlock}>
                <Text style={[styles.title, { fontFamily: semiBoldFontFamily }]}>
                  Log in to share Status with your Name & Photo.
                </Text>
              </View>

              <View style={styles.fieldBlock}>
                <View style={styles.input}>
                  <Text
                    style={[
                      styles.inputPlaceholder,
                      { fontFamily: regularFontFamily },
                    ]}
                  >
                    Enter phone number
                  </Text>
                </View>
                <View style={styles.supportingTextSpacer} />
              </View>
            </View>

            <View style={styles.footer}>
              <Pressable accessibilityRole="button" style={styles.continueButton}>
                <Text
                  style={[
                    styles.continueLabel,
                    { fontFamily: semiBoldFontFamily },
                  ]}
                >
                  Continue
                </Text>
              </Pressable>

              <Text style={[styles.legalCopy, { fontFamily: regularFontFamily }]}>
                <Text>By continuing, you agree to our </Text>
                <Text style={styles.legalLink}>Terms & Conditions</Text>
                <Text> and </Text>
                <Text style={styles.legalLink}>Privacy Policy.</Text>
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    flexDirection: 'row',
    alignSelf: 'flex-start',
    justifyContent: 'flex-start',
    minHeight: 40,
    marginLeft: 16,
    paddingHorizontal: 0,
  },
  backLabel: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '400',
    lineHeight: 22,
    marginLeft: 4,
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    width: '100%',
  },
  bottomSheetContent: {
    flex: 1,
  },
  carousel: {
    flex: 1,
  },
  carouselDot: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    height: 6,
    width: 6,
  },
  carouselIndicator: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
    height: 6,
  },
  carouselIndicatorWrap: {
    alignItems: 'center',
    alignSelf: 'center',
    position: 'absolute',
  },
  carouselSlide: {
    overflow: 'hidden',
  },
  content: {
    width: '100%',
  },
  continueButton: {
    alignItems: 'center',
    backgroundColor: '#171717',
    borderCurve: 'continuous',
    borderRadius: 100,
    height: 48,
    justifyContent: 'center',
    width: '100%',
  },
  continueLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 24,
    textAlign: 'center',
  },
  fieldBlock: {
    gap: 8,
    width: '100%',
  },
  footer: {
    gap: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 2,
  },
  heroBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  heroBackgroundMotion: {
    ...StyleSheet.absoluteFillObject,
  },
  posterImage: {
    maxWidth: '100%',
  },
  posterWrap: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: TOP_SECTION_BOTTOM_PADDING,
    paddingHorizontal: TOP_SECTION_HORIZONTAL_PADDING,
    paddingTop: CARD_TOP_CLEARANCE,
  },
  input: {
    alignItems: 'flex-start',
    backgroundColor: '#F0F0F0',
    borderCurve: 'continuous',
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: 16,
    width: '100%',
  },
  inputPlaceholder: {
    color: 'rgba(23,23,23,0.45)',
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  legalCopy: {
    alignSelf: 'center',
    color: 'rgba(23,23,23,0.65)',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 18,
    maxWidth: 328,
    textAlign: 'center',
  },
  legalLink: {
    color: '#175BCC',
    textDecorationLine: 'underline',
  },
  progressBar: {
    flexDirection: 'row',
    height: 3,
    width: '100%',
  },
  progressSegment: {
    height: '100%',
  },
  progressSegmentOrange: {
    backgroundColor: '#FD5C05',
    width: '25%',
  },
  progressSegmentPink: {
    backgroundColor: '#CB005B',
    width: '23.4603%',
  },
  progressSegmentPurple: {
    backgroundColor: '#6500AA',
    width: '26.1697%',
  },
  progressSegmentYellow: {
    backgroundColor: '#FDB100',
    width: '25.3692%',
  },
  screen: {
    backgroundColor: '#000000',
    flex: 1,
  },
  sheetBody: {
    gap: 16,
    paddingHorizontal: 16,
    paddingTop: 24,
    width: '100%',
  },
  supportingTextSpacer: {
    height: 18,
    width: '100%',
  },
  title: {
    color: '#171717',
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 31,
  },
  titleBlock: {
    width: '100%',
  },
  topSection: {
    overflow: 'hidden',
  },
});
