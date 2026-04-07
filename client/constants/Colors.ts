const purplePrimary = '#5B4B8A';
const purpleAccent = '#7C6BA8';
const grey900 = '#1a1a1a';
const grey600 = '#4a4a4a';
const grey400 = '#888888';
const grey200 = '#e0e0e0';
const grey100 = '#f0f0f0';
const grey50 = '#f7f7f7';
const white = '#ffffff';
const black = '#0d0d0d';

export default {
  light: {
    text: grey900,
    background: grey50,
    /** Section panels — close to background, slightly blocky without harsh contrast */
    surfaceSubtle: '#efeff1',
    tint: purplePrimary,
    tabIconDefault: grey400,
    card: white,
    border: grey200,
    secondary: grey600,
  },
  dark: {
    text: grey100,
    background: black,
    surfaceSubtle: '#141414',
    tint: purpleAccent,
    tabIconDefault: grey400,
    card: '#2d2d2d',
    border: grey600,
    secondary: grey200,
  },
};
