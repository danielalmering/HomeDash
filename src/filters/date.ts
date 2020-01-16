export function basicDateTime(value: number){
    const date = new Date(value * 1000);

    return formatDate(date);
};


export function shortDate(value: number) {
    const date = new Date(value * 1000);

    return formatShortDate(date);
};

const leadingZero = (num: number) => `0${num}`.slice(-2);

function formatDate(date: Date): string {
    return `${leadingZero(date.getDate())}-${leadingZero(date.getMonth() + 1)}-${date.getFullYear()} | ${leadingZero(date.getHours())}:${leadingZero(date.getMinutes())}`;
}

function formatShortDate(date: Date): string {
    return `${leadingZero(date.getDate())}-${leadingZero(date.getMonth() + 1)}-${date.getFullYear()}`;
}
