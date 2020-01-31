/*
 *  Filter to turn credits into the current currency, based on the country of the interface
 */

import config from '../config';

export function currencyFilter(credits: number) {
    switch(config.Country){
        // case "uk":
        //     return `£${ ( credits / 115 ).toFixed(2) }`
        default:
            return `€${ (credits / 100).toFixed(2)}`
    }
}

const endZero = (num: number) => `${num}0`.slice(-2);