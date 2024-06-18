import { createHash } from 'crypto';

export function calculateMD5Hash(input: string): string {
  const md5 = createHash('md5');
  md5.update(input);
  return md5.digest('hex');
}
