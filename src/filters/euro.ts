import Vue from 'vue';
import localization from '../localization';

/*
 *  Filter to turn cents into euros
 */

Vue.filter('euro', (cents: number) => {
    const fullEuro = (cents / 100).toFixed(2);

    return `€${fullEuro}`;
});

const endZero = (num: number) => `${num}0`.slice(-2);