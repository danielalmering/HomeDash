import Vue from 'vue';

Vue.filter('date', function(value: number){
    const date = new Date(value * 1000);

    return formatDate(date);
});

const leadingZero = (num: number) => `0${num}`.slice(-2);

function formatDate(date: Date): string {
    return `${leadingZero(date.getDate())}-${leadingZero(date.getMonth())}-${date.getFullYear()} | ${leadingZero(date.getHours())}:${leadingZero(date.getMinutes())}`
}
