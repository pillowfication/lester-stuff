const fs = require('fs');
const path = require('path');
const dataPath = path.join(__dirname, 'data.json');
const data2Path = path.join(__dirname, 'data2.json');
const lineReader = require('readline').createInterface({
  input: fs.createReadStream(dataPath)
});

const _keys = {};
function addKey(k, p) {
  let sub = _keys[p];
  if (!sub) {
    sub = new Set();
    _keys[p] = sub;
  }
  sub.add(k);
}

const all = {};

lineReader.on('line', line => {
  const obj = JSON.parse(line);
  const par = {};
  for (const key in obj) {
    if (key === 'id')
      continue;

    const pk = key.toLowerCase().replace(/[^a-z]/g, '');
    addKey(key, pk);
    par[pk] = obj[key];
  }
  all[obj.id] = par;
});

lineReader.on('close', () => {
  fs.writeFileSync(data2Path, '{\n');
  const foo = Object.keys(all).map(id =>
    `  "${id}": ${JSON.stringify(all[id])}`
  ).join(', \n');
  fs.appendFileSync(data2Path, foo);
  fs.appendFileSync(data2Path, '\n}\n');
  console.log(_keys);
});
