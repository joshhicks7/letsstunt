import type { PositionType } from '@/types';

/** Labels for cards, matches, and profile lines (side bases disambiguated). */
export const POSITION_LABELS: Record<PositionType, string> = {
  'coed-base': 'Coed base',
  'coed-flyer': 'Coed flyer',
  'side-base': 'Side base',
  'main-base': 'Main base',
  'back-spot': 'Back spot',
  'front-spot': 'Front base',
  'all-girl-base': 'All girl base',
  'all-girl-flyer': 'All girl flyer',
  'group-flyer': 'Group flyer',
};

export type RoleSection = {
  title: string;
  positions: readonly { value: PositionType; label: string }[];
};

/** Primary + secondary picker: Coed vs group stunt roles. */
export const ROLE_SECTIONS: readonly RoleSection[] = [
  {
    title: 'Coed',
    positions: [
      { value: 'coed-flyer', label: 'Coed flyer' },
      { value: 'coed-base', label: 'Coed base' },
    ],
  },
  {
    title: 'Group stunts',
    positions: [
      { value: 'all-girl-flyer', label: 'All girl flyer' },
      { value: 'all-girl-base', label: 'All girl base' },
      { value: 'side-base', label: 'Side base' },
      { value: 'main-base', label: 'Main base' },
      { value: 'back-spot', label: 'Back spot' },
      { value: 'front-spot', label: 'Front spot' },
    ],
  },
];

export const POSITION_OPTIONS: { value: PositionType; label: string }[] = (
  Object.entries(POSITION_LABELS) as [PositionType, string][]
).map(([value, label]) => ({ value, label }));

/** Flat list of core roles (Coed + group), in section order. */
export const PRIMARY_ROLE_OPTIONS: { value: PositionType; label: string }[] = ROLE_SECTIONS.flatMap((s) => [
  ...s.positions,
]);

export function mergePrimaryAndSecondary(
  primary: PositionType | null,
  secondary: PositionType[],
): PositionType[] {
  if (!primary) return [...new Set(secondary)];
  const rest = secondary.filter((p) => p !== primary);
  return [primary, ...rest];
}
