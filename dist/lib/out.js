"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let isMuted = false;
function mute() {
    isMuted = true;
}
exports.mute = mute;
function unmute() {
    isMuted = false;
}
exports.unmute = unmute;
function writeln(output = '') {
    if (!isMuted) {
        (console.log)(`${output}`);
    }
}
exports.writeln = writeln;
