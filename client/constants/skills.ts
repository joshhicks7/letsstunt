import type { SkillLevel } from '@/types';

export const SKILL_LEVEL_LABELS: Record<SkillLevel, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  elite: 'Elite',
};

export const SKILL_LEVEL_OPTIONS: { value: SkillLevel; label: string }[] = Object.entries(
  SKILL_LEVEL_LABELS
).map(([value, label]) => ({ value: value as SkillLevel, label }));
