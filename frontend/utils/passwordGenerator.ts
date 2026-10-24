// Secure password suggestion and strength evaluation (no dependency, browser crypto only).

// Look-alike characters (0/O, 1/l/I) are left out so a suggested password can be read and typed without mistakes.
const LOWER = 'abcdefghijkmnopqrstuvwxyz';
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const DIGITS = '23456789';
const SPECIAL = '!@#$%&*?-_+=';
const ALL = LOWER + UPPER + DIGITS + SPECIAL;

/** Unbiased random integer in [0, max) from the cryptographic generator (rejection sampling). */
const randomInt = (max: number): number => {
  const limit = Math.floor(0x100000000 / max) * max;
  const buffer = new Uint32Array(1);
  let value: number;
  do {
    crypto.getRandomValues(buffer);
    value = buffer[0];
  } while (value >= limit);
  return value % max;
};

const pick = (alphabet: string): string => alphabet[randomInt(alphabet.length)];

/**
 * Generates a password that always contains at least one lowercase letter, one uppercase letter, one digit and one
 * special character, in a random order.
 */
export const generateSecurePassword = (length = 16): string => {
  const size = Math.max(12, length);
  const chars = [pick(LOWER), pick(UPPER), pick(DIGITS), pick(SPECIAL)];
  while (chars.length < size) {
    chars.push(pick(ALL));
  }
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
};
