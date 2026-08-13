const fs = require('fs');

const path = 'src/lib/datasetDictionary.ts';
let content = fs.readFileSync(path, 'utf-8');

// Fix Sun
content = content.replace(/"word":\s*"Sun",([\s\S]*?)"emoji":\s*"🙌"/g, '"word": "Sun",$1"emoji": "☀️"');

// Fix Moon
content = content.replace(/"word":\s*"Moon",([\s\S]*?)"emoji":\s*"🙌"/g, '"word": "Moon",$1"emoji": "🌙"');

fs.writeFileSync(path, content);
console.log('Fixed emojis');
