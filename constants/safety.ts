/**
 * Safety constants for age gating, reporting, and community safety.
 */

/** LetsStunt is 18+ only */
export const MIN_AGE = 18;

export const UNDERAGE_MESSAGE = 'You must be 18 or older to use LetsStunt.';

/** Age under which users are considered minors for future role-based safeguards */
export const MINOR_AGE_CUTOFF = 18;

export const REPORT_REASONS = [
  { value: 'harassment', label: 'Harassment or bullying' },
  { value: 'inappropriate', label: 'Inappropriate content or behavior' },
  { value: 'underage', label: 'Underage or suspected minor' },
  { value: 'fake', label: 'Fake profile or impersonation' },
  { value: 'scam', label: 'Scam or spam' },
  { value: 'hate', label: 'Hate speech or discrimination' },
  { value: 'violence', label: 'Threats or violence' },
  { value: 'other', label: 'Other' },
] as const;

export type ReportReasonValue = (typeof REPORT_REASONS)[number]['value'];

export const SAFETY_TIPS = [
  'Never share passwords, full name, address, or school with someone you don’t know in person.',
  'Meet stunt partners in public places (gym, practice facility) and tell someone where you’re going.',
  'If someone asks for inappropriate photos or makes you uncomfortable, block and report them.',
  'LetsStunt is for athletes 18 and older. Report anyone you suspect is underage.',
  'We take reports seriously. False reports may result in account action.',
];

export const REPORT_EMAIL = 'safety@letsstunt.example.com';
