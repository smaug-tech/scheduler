"use strict";
// tslint:disable:no-bitwise
let x;
let y;
let z;
let n;
// -----------------------------------------------------------------------------
// Pseudo-Random Number Generator
/**
 * @returns A pseudo-random floating-point number `n` where `0 <= n < 1` with an
 *     approximately uniform distribution.
 */
function random() {
    let t = x;
    t ^= t << 11;
    t ^= t >> 8;
    x = y;
    y = z;
    z = n;
    n ^= n >> 19;
    n ^= t;
    return n / 2147483648; // max: 2147483647 / 2147483648 = 0.9999999995343387
}
/** Specifies the initial seed `value` for the generation algorithm. */
random.seed = (value) => {
    x = 0;
    y = 2;
    z = 3;
    n = 5;
    random();
    x ^= value >> x;
    y ^= value << y;
    z ^= value >> z;
    random();
    x ^= value << x;
    y ^= value >> y;
    z ^= value << z;
    random();
    x ^= value >> x;
    y ^= value << y;
    z ^= value >> z;
    random();
    x ^= value << x;
    y ^= value >> y;
    z ^= value << z;
    random();
};
// -----------------------------------------------------------------------------
// Numbers
/** @returns A pseudo-random integer `n` where `min <= n <= max`. */
random.int = (min, max) => {
    return Math.floor(random() * (max - min + 1) + min);
};
/** @returns A pseudo-random floating-point `n` where `min <= n <= max`. */
random.number = (min, max) => {
    return random() * (max - min) + min;
};
// -----------------------------------------------------------------------------
// Arrays
/** @returns A shuffled index into `input`. */
random.index = (input) => {
    let i = input.length;
    const output = new Array(i);
    for (; i-- > 0;) {
        output[i] = i;
    }
    return random.shuffle(output);
};
/** @returns A randomly selected value from `input`. */
random.item = (input) => {
    return input[random.int(0, input.length - 1)];
};
/** @returns `input` after shuffling it in place. */
random.shuffle = (input) => {
    for (let i = 0, ni = input.length; i < ni; ++i) {
        const r = random.int(0, input.length - 1);
        const item = input[r];
        input[r] = input[i];
        input[i] = item;
    }
    return input;
};
// -----------------------------------------------------------------------------
random.seed(Date.now());
module.exports = random;
