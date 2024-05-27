export {};

declare global {
  interface String {
    splitCsv(nullOrWhitespaceInputReturnsNull?: boolean): string[];
    isNullOrWhitespace(): boolean;
  }
}

String.prototype.splitCsv = function(nullOrWhitespaceInputReturnsNull: boolean = false): string[] {
  if (!this.trim()) {
    return nullOrWhitespaceInputReturnsNull ? null : [];
  }

  return this.trim()
    .replace(/,$/, '') // Remove trailing comma
    .split(',')
    .map(s => s.trim());
};

String.prototype.isNullOrWhitespace = function(): boolean {
  return /^\s*$/.test(this);
};