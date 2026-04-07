import { StyleSheet } from 'react-native';
import { SPACING, FONT_SIZE, FONT_WEIGHT, RADIUS } from '@/constants/Theme';

export const HERO_IMAGE = require('@/assets/images/main2.png');
export const MAX_CONTENT_WIDTH_WEB = 440;
export const WEB_LANDING_MAX_WIDTH = 560;
export const MIN_TOP_PADDING_WEB = SPACING.xxl;

export const welcomeStyles = StyleSheet.create({
  outer: {
    flex: 1,
    width: '100%',
  },
  mobileRoot: {
    flex: 1,
  },
  heroWrap: {
    flex: 1,
    minHeight: 280,
    width: '100%',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  mobileBottom: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
  },
  webScroll: {
    flex: 1,
    width: '100%',
  },
  webScrollContent: {
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  webInner: {
    width: '100%',
    alignItems: 'center',
  },
  webHeroWrap: {
    width: '100%',
    aspectRatio: 4 / 5,
    maxHeight: 420,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.xl,
    borderWidth: StyleSheet.hairlineWidth,
  },
  webHeroImage: {
    width: '100%',
    height: '100%',
  },
  brand: {
    fontSize: FONT_SIZE.hero,
    fontWeight: FONT_WEIGHT.bold,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  tagline: {
    fontSize: FONT_SIZE.lg,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.md,
    lineHeight: 26,
  },
  actions: {
    width: '100%',
    gap: SPACING.sm,
  },
  primaryBtn: {
    width: '100%',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold },
  secondaryBtn: {
    width: '100%',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  secondaryBtnText: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  legalLink: { fontSize: FONT_SIZE.xs, textDecorationLine: 'underline' },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginVertical: SPACING.sm,
  },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth },
  dividerText: { fontSize: FONT_SIZE.xs },
});
