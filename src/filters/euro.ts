/*
 *  Filter to turn cents into euros
 */

export function euroFilter(cents: number) {
    const fullEuro = (cents / 100).toFixed(2);

    return `€${fullEuro}`;
}

const endZero = (num: number) => `${num}0`.slice(-2);