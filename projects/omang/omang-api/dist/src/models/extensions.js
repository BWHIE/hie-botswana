"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
String.prototype.splitCsv = function (nullOrWhitespaceInputReturnsNull = false) {
    if (!this.trim()) {
        return nullOrWhitespaceInputReturnsNull ? null : [];
    }
    return this.trim()
        .replace(/,$/, '')
        .split(',')
        .map(s => s.trim());
};
String.prototype.isNullOrWhitespace = function () {
    return /^\s*$/.test(this);
};
//# sourceMappingURL=extensions.js.map