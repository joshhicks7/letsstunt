import type { PositionType } from '@/types';

/** Display labels aligned with product spec */
export const POSITION_LABELS: Record<PositionType, string> = {
  'coed-base': 'Main base',
  'coed-flyer': 'Flyer (Co-ed)',
  'male-side-base': 'Side base',
  'female-side-base': 'Side base',
  'back-spot': 'Back spot',
  'front-spot': 'Front spot',
  'all-girl-base': 'All-girl base',
  'all-girl-flyer': 'Flyer (All-Girl)',
  'group-stunt': 'Group stunt',
  'basket-base': 'Basket base',
  'basket-tosser': 'Basket tosser',
  'basket-flyer': 'Basket flyer',
  other: 'Other',
};

export const POSITION_OPTIONS: { value: PositionType; label: string }[] = Object.entries(
  POSITION_LABELS
).map(([value, label]) => ({ value: value as PositionType, label }));

/** Primary role picker: one required role per spec */
export const PRIMARY_ROLE_OPTIONS: { value: PositionType; label: string }[] = [
  { value: 'all-girl-flyer', label: POSITION_LABELS['all-girl-flyer'] },
  { value: 'coed-flyer', label: POSITION_LABELS['coed-flyer'] },
  { value: 'coed-base', label: POSITION_LABELS['coed-base'] },
  { value: 'male-side-base', label: POSITION_LABELS['male-side-base'] },
  { value: 'back-spot', label: POSITION_LABELS['back-spot'] },
  { value: 'front-spot', label: POSITION_LABELS['front-spot'] },
];

export function mergePrimaryAndSecondary(
  primary: PositionType | null,
  secondary: PositionType[]
): PositionType[] {
  if (!primary) return [...new Set(secondary)];
  const rest = secondary.filter((p) => p !== primary);
  return [primary, ...rest];
}
