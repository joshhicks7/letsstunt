import type { SkillTag } from '@/types';

export const SKILL_TAG_LABELS: Record<SkillTag, string> = {
  'basket-toss': 'Basket toss',
  lib: 'Lib',
  rewind: 'Rewind',
  twisting: 'Twisting',
  tumbling: 'Tumbling',
  'full-up': 'Full up',
  cupie: 'Cupie',
  'coed-stunting': 'Coed stunting',
  'all-girl': 'All-girl',
};

export const SKILL_TAG_OPTIONS: { value: SkillTag; label: string }[] = (
  Object.entries(SKILL_TAG_LABELS) as [SkillTag, string][]
).map(([value, label]) => ({ value, label }));
