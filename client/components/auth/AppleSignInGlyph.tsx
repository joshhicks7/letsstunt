import Svg, { Path } from 'react-native-svg';

type Props = {
  size?: number;
  color?: string;
};

/** Apple logo glyph for Sign in with Apple (web / future native). */
export function AppleSignInGlyph({ size = 24, color = '#fff' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Path
        fill={color}
        d="M16.365 1.43c0 1.14-.467 2.22-1.247 3.04-.84.9-2.23 1.6-3.42 1.5-.15-1.1.45-2.28 1.24-3.1.85-.9 2.32-1.54 3.43-1.44zM20.5 17.07c-.9 2.1-2 4.17-3.66 4.2-1.63.03-2.15-1-4-1-1.85 0-2.43.97-3.97 1.03-1.6.06-2.82-2.2-3.74-4.3-1.92-4.3-.34-10.3 2.78-10.5 1.5-.08 2.9 1.04 3.8 1.04.9 0 2.57-1.28 4.34-1.1.74.03 2.8.3 4.12 2.24-3.6 1.97-3.01 7.14.33 8.39z"
      />
    </Svg>
  );
}
