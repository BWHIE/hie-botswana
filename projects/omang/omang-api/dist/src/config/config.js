"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const nconf = require("nconf");
exports.config = nconf;
const env = process.env.NODE_ENV || 'ci';
nconf.argv().env().file(`${__dirname}/../app-settings.json`);
exports.default = nconf;
//# sourceMappingURL=config.js.map