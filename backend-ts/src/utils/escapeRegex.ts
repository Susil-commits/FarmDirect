/**
 * Escapes special regular expression characters in a string
 * to prevent regex injection, unintended wildcards, and regex syntax crashes.
 */
export function escapeRegex(string: string): string {
  if (typeof string !== 'string') return '';
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default escapeRegex;
