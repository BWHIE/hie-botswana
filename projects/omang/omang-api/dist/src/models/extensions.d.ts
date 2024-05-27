export {};
declare global {
    interface String {
        splitCsv(nullOrWhitespaceInputReturnsNull?: boolean): string[];
        isNullOrWhitespace(): boolean;
    }
}
