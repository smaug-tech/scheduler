"use strict";
// The same Promise API, everywhere.
Object.defineProperty(exports, "__esModule", { value: true });
const Bluebird = require("bluebird");
const g = typeof global !== 'undefined' && global ||
    typeof window !== 'undefined' && window;
g.Promise = Bluebird;
