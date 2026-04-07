import { SPACING } from '@/constants/Theme';

/** Floating pass / like on Discover (keep in sync with card overlays) */
export const DISCOVER_ACTION_BTN_SIZE = 52;
export const DISCOVER_ACTION_ICON_SIZE = 22;

/**
 * Space above card bottom so overlay text clears pass/like.
 * ≈ button + typical safe-area padding on the action row + small gap (see discover `actionsBottomPad`).
 */
export const DISCOVER_CARD_OVERLAY_BOTTOM_PAD =
  DISCOVER_ACTION_BTN_SIZE + SPACING.lg + SPACING.md + SPACING.sm;
