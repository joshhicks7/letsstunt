import type { AvailabilityType } from '@/types';

export const AVAILABILITY_LABELS: Record<AvailabilityType, string> = {
  weekdays: 'Weekdays',
  weekends: 'Weekends',
  events: 'Local events',
  competitions: 'Competitions',
};

export const AVAILABILITY_OPTIONS: { value: AvailabilityType; label: string }[] = (
  Object.entries(AVAILABILITY_LABELS) as [AvailabilityType, string][]
).map(([value, label]) => ({ value, label }));
