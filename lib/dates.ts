/** ISO date YYYY-MM-DD */
export function toISODateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseISODate(iso: string): Date | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const d = new Date(iso + 'T12:00:00');
  return isNaN(d.getTime()) ? null : d;
}

export function ageFromISOBirthday(birthday: string): number | null {
  const birth = parseISODate(birthday);
  if (!birth) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

/** Default date for picker (18 years ago) */
export function defaultBirthdayForPicker(): Date {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 22);
  return d;
}
