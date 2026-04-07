import type { StyleProp, ViewStyle } from 'react-native';

export type LoginWithGoogleProps = {
  onComplete: (result: { onboardingComplete: boolean }) => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};
