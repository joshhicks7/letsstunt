import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  runOnUI,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

export type SwipeableDiscoverCardRef = {
  swipeLeft: () => void;
  swipeRight: () => void;
};

type Props = {
  cardKey: string;
  children: React.ReactNode;
  onSwipeComplete: (direction: 'left' | 'right') => void;
  likeColor: string;
};

export const SwipeableDiscoverCard = forwardRef<SwipeableDiscoverCardRef, Props>(function SwipeableDiscoverCard(
  { cardKey, children, onSwipeComplete, likeColor },
  ref
) {
  const { width: W } = useWindowDimensions();
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const widthSV = useSharedValue(W);

  const onCompleteRef = useRef(onSwipeComplete);
  onCompleteRef.current = onSwipeComplete;

  const finish = useCallback((direction: 'left' | 'right') => {
    onCompleteRef.current(direction);
  }, []);

  useEffect(() => {
    widthSV.value = W;
  }, [W, widthSV]);

  useEffect(() => {
    translateX.value = 0;
    translateY.value = 0;
  }, [cardKey]);

  /** Must run on UI thread so pass/like buttons get the same fling as a full swipe */
  const programmaticFling = useCallback(
    (direction: 'left' | 'right') => {
      runOnUI((dir: 'left' | 'right') => {
        'worklet';
        const w = widthSV.value;
        const target = dir === 'right' ? w * 1.35 : -w * 1.35;
        translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
        translateX.value = withTiming(target, { duration: 280 }, (finished) => {
          if (finished) runOnJS(finish)(dir);
        });
      })(direction);
    },
    [finish, translateX, translateY, widthSV]
  );

  const programmaticRef = useRef(programmaticFling);
  programmaticRef.current = programmaticFling;

  useImperativeHandle(
    ref,
    () => ({
      swipeLeft: () => programmaticRef.current('left'),
      swipeRight: () => programmaticRef.current('right'),
    }),
    []
  );

  const pan = useMemo(
    () =>
      Gesture.Pan()
        /** Require a deliberate horizontal drag so half-screen taps can change photos without moving the card. */
        .activeOffsetX([-52, 52])
        .failOffsetY([-24, 24])
        .onUpdate((e) => {
          translateX.value = e.translationX;
          translateY.value = e.translationY * 0.28;
        })
        .onEnd((e) => {
          const threshold = W * 0.22;
          if (translateX.value > threshold || e.velocityX > 620) {
            translateX.value = withTiming(W * 1.35, { duration: 260 }, (done) => {
              if (done) runOnJS(finish)('right');
            });
          } else if (translateX.value < -threshold || e.velocityX < -620) {
            translateX.value = withTiming(-W * 1.35, { duration: 260 }, (done) => {
              if (done) runOnJS(finish)('left');
            });
          } else {
            translateX.value = withSpring(0, { damping: 17, stiffness: 210 });
            translateY.value = withSpring(0, { damping: 17, stiffness: 210 });
          }
        }),
    [W, finish, translateX, translateY]
  );

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      {
        rotate: `${interpolate(translateX.value, [-W / 2, 0, W / 2], [-13, 0, 13], Extrapolation.CLAMP)}deg`,
      },
    ],
  }));

  const likeStampStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [12, W * 0.12], [0, 1], Extrapolation.CLAMP),
    transform: [
      {
        scale: interpolate(translateX.value, [0, W * 0.18], [0.82, 1], Extrapolation.CLAMP),
      },
    ],
  }));

  const nopeStampStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-W * 0.12, -12], [1, 0], Extrapolation.CLAMP),
    transform: [
      {
        scale: interpolate(translateX.value, [-W * 0.18, 0], [1, 0.82], Extrapolation.CLAMP),
      },
    ],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.wrap, cardStyle]}>
        <View style={styles.stamps}>
          <Animated.View style={[styles.stampNopeWrap, nopeStampStyle]}>
            <Text style={styles.stampNopeText}>NOPE</Text>
          </Animated.View>
          <Animated.View style={[styles.stampLikeWrap, likeStampStyle]}>
            <Text style={[styles.stampLikeText, { color: likeColor, borderColor: likeColor }]}>LIKE</Text>
          </Animated.View>
        </View>
        <View style={styles.child}>{children}</View>
      </Animated.View>
    </GestureDetector>
  );
});

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    width: '100%',
  },
  child: { flex: 1 },
  stamps: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
    pointerEvents: 'none',
  },
  stampLikeWrap: {
    position: 'absolute',
    top: '18%',
    right: '8%',
    transform: [{ rotate: '18deg' }],
  },
  stampLikeText: {
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: 2,
    borderWidth: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  stampNopeWrap: {
    position: 'absolute',
    top: '18%',
    left: '8%',
    transform: [{ rotate: '-18deg' }],
  },
  stampNopeText: {
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#ff4458',
    borderWidth: 4,
    borderColor: '#ff4458',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
});
