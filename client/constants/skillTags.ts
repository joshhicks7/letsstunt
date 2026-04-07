import type { SkillTag } from '@/types';

export const SKILL_TAG_LABELS: Record<SkillTag, string> = {
  basket_toss: 'Basket toss',
  cupie: 'Cupie',
  coed_stunting: 'Coed stunting',
  coed_double_up: 'double up',
  coed_full_up: 'Full up',
  coed_front_handspring_up: 'Front handspring up',
  coed_back_handspring_up: 'Back handspring up',
  coed_rewind: 'Rewind',
  coed_one_to_one: 'One to one',
  coed_lib: 'Toss lib',
  group_double_up: 'Double up',
  group_full_up: 'Full up',
  group_front_handspring_up: 'Front handspring up',
  group_back_handspring_up: 'Back handspring up',
  group_rewind: 'Rewind',
  group_tick_tock: 'Tick tock',
  group_lib: 'Toss lib',
  group_full_down: 'Full down',
  group_double_down: 'Double down',
  coed_platform: 'Toss platform',
  coed_toss_hands: 'Toss hands',
  coed_toss_extension: 'Toss extension',
  group_prep: 'Prep',
};

export type SkillTagSection = {
  title: string;
  tags: readonly SkillTag[];
};

/** Skill highlights grouped for coed vs group vs shared skills. */
export const SKILL_TAG_SECTIONS: readonly SkillTagSection[] = [
  {
    title: 'Coed stunts',
    tags: [
      'coed_stunting',
      'coed_double_up',
      'coed_full_up',
      'coed_front_handspring_up',
      'coed_back_handspring_up',
      'cupie',
      'coed_rewind',
      'coed_one_to_one',
      'coed_lib',
      'coed_platform',
      'coed_toss_hands',
      'coed_toss_extension',
    ],
  },
  {
    title: 'Group stunts',
    tags: [
      'basket_toss',
      'group_double_up',
      'group_full_up',
      'group_front_handspring_up',
      'group_back_handspring_up',
      'group_rewind',
      'group_lib',
      'group_full_down',
      'group_double_down',
      'group_prep',
    ],
  }
];

export const SKILL_TAG_OPTIONS: { value: SkillTag; label: string }[] = SKILL_TAG_SECTIONS.flatMap((section) =>
  section.tags.map((value) => ({ value, label: SKILL_TAG_LABELS[value] })),
);
