import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Image } from 'expo-image';
import React from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { ProfileRemoteImage } from '@/components/ProfileRemoteImage';
import Colors from '@/constants/Colors';
import { SPACING } from '@/constants/Theme';
import { getProfileImageDisplayUri } from '@/lib/profileMediaDisplay';
import type { ProfileMediaItem } from '@/types';

type Props = {
  /** When this identity changes, carousel resets to first photo */
  mediaOwnerKey?: string;
  imageMedia: ProfileMediaItem[];
  /**
   * Legacy: used when not filling a parent (detail screens). Ignored for multi-photo navigation
   * (tap halves only); kept so call sites don’t need churn.
   */
  carouselWidth: number;
  colors: (typeof Colors)['light'];
  /** Fixed strip height (profile / discover detail). Omit when `fillContainer` */
  height?: number;
  placeholderIconSize?: number;
  /** Placeholder background uses `tint + suffix` — card uses stronger tint */
  placeholderTintSuffix?: string;
  /** default true — SwipeCard sets false and draws dots above the name */
  showDots?: boolean;
  /** Discover swipe card: `StyleSheet.absoluteFillObject` behavior inside the card */
  fillContainer?: boolean;
  style?: StyleProp<ViewStyle>;
  /** e.g. SwipeCard keeps dots above the name in sync with tap navigation */
  onPageChange?: (index: number) => void;
};

export function ProfileCoverCarousel({
  mediaOwnerKey,
  imageMedia,
  carouselWidth: _carouselWidth,
  colors,
  height = 240,
  placeholderIconSize,
  placeholderTintSuffix = '18',
  showDots = true,
  fillContainer = false,
  style,
  onPageChange,
}: Props) {
  const onPageChangeRef = React.useRef(onPageChange);
  onPageChangeRef.current = onPageChange;

  const displayUris = React.useMemo(
    () => imageMedia.map((m) => getProfileImageDisplayUri(m)),
    [imageMedia],
  );

  const iconSize = placeholderIconSize ?? Math.min(72, Math.round(height * 0.32));
  const [page, setPage] = React.useState(0);
  const mediaKey = `${mediaOwnerKey ?? ''}|${imageMedia.map((m) => m.id).join('|')}`;
  React.useEffect(() => {
    setPage(0);
    onPageChangeRef.current?.(0);
  }, [mediaKey]);

  React.useEffect(() => {
    onPageChangeRef.current?.(page);
  }, [page]);

  const n = imageMedia.length;
  const goPrev = React.useCallback(() => {
    setPage((i) => (n <= 1 ? 0 : (i - 1 + n) % n));
  }, [n]);
  const goNext = React.useCallback(() => {
    setPage((i) => (n <= 1 ? 0 : (i + 1) % n));
  }, [n]);

  const currentMedia = n > 0 ? imageMedia[page] : null;

  /** Light prefetch of prev/next slide display URIs for smoother taps. */
  React.useEffect(() => {
    if (n <= 1) return;
    const urls = new Set<string>();
    const addAt = (idx: number) => {
      const u = displayUris[idx];
      if (u) urls.add(u);
    };
    addAt((page - 1 + n) % n);
    addAt((page + 1) % n);
    urls.forEach((u) => void Image.prefetch(u, 'memory-disk'));
  }, [page, n, displayUris, mediaKey]);

  const wrapStyle: StyleProp<ViewStyle> = fillContainer
    ? [styles.coverFill, style]
    : [styles.coverWrap, { height }, style];

  if (n === 0) {
    return (
      <View style={wrapStyle}>
        <View
          style={[
            styles.placeholderFill,
            { backgroundColor: colors.tint + placeholderTintSuffix },
            !fillContainer && { minHeight: height },
          ]}
        >
          <FontAwesome name="user" size={iconSize} color={colors.tint} />
        </View>
      </View>
    );
  }

  if (n === 1) {
    return (
      <View style={wrapStyle}>
        <ProfileRemoteImage
          media={imageMedia[0]}
          style={fillContainer ? styles.coverImageFill : styles.coverImage}
          contentFit="cover"
          transition={200}
        />
      </View>
    );
  }

  return (
    <View style={wrapStyle}>
      {currentMedia ? (
        <ProfileRemoteImage
          media={currentMedia}
          style={fillContainer ? styles.coverImageFill : styles.coverImage}
          contentFit="cover"
          transition={200}
        />
      ) : null}

      <View style={styles.tapZones}>
        <Pressable
          style={styles.tapHalf}
          onPress={goPrev}
          accessibilityLabel="Previous photo"
          accessibilityRole="button"
        />
        <Pressable
          style={styles.tapHalf}
          onPress={goNext}
          accessibilityLabel="Next photo"
          accessibilityRole="button"
        />
      </View>

      {showDots ? (
        <View style={styles.dotsRow}>
          {imageMedia.map((m, i) => (
            <View key={m.id} style={[styles.dot, i === page ? styles.dotActive : null]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  coverWrap: {
    width: '100%',
    backgroundColor: 'transparent',
    position: 'relative',
    overflow: 'hidden',
  },
  coverFill: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  coverImage: { width: '100%', height: '100%' },
  coverImageFill: { ...StyleSheet.absoluteFillObject },
  placeholderFill: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapZones: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    zIndex: 1,
    pointerEvents: 'box-none',
  },
  tapHalf: {
    flex: 1,
  },
  dotsRow: {
    position: 'absolute',
    bottom: SPACING.sm,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    zIndex: 2,
    pointerEvents: 'none',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  dotActive: {
    backgroundColor: '#fff',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
