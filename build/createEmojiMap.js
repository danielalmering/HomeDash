const fs = require('fs');

const emojiMap = fs.readFileSync('../src/styles/_emoticons.map.scss', 'utf-8');
const jsonMap = JSON.parse(fs.readFileSync('../src/components/layout/Emoticons.data.json', 'utf-8'));

const splitMap = emojiMap.split('\n');
splitMap.shift();
splitMap.pop();

const emojiSorted = splitMap.map(str => {
    const code = str.split(`": "`)[0].split(`"`)[1];
    const name = str.split(`": "`)[1].split(`"`)[0];

    return {
        code,
        name
    };
});

const result = {};

for(category in jsonMap){
    result[category] = jsonMap[category].map(code => {
        return emojiSorted.find(s => s.code === code).name;
    });
}

fs.writeFileSync('../result.json', JSON.stringify(result), 'utf-8');