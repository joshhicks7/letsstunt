import type { StyleProp, ViewStyle } from 'react-native';

export type LoginWithAppleProps = {
  onComplete: (result: { onboardingComplete: boolean }) => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Icon-only circular control (e.g. beside Google). Web only; full-width bar when false. */
  compact?: boolean;
};
