const fs = require('fs');
const path = require('path');
const readline = require('readline');
const csvStringify = require('csv-stringify');

const INPUT = 'data.json';
const OUTPUT = 'data.csv';

function toCsv(input = INPUT, output = OUTPUT) {
  input = path.join(__dirname, input);
  output = path.join(__dirname, output);

  const lineReader = readline.createInterface({
    input: fs.createReadStream(input)
  });

  const columns = {id: 'id'};
  const csv = [];

  lineReader.on('line', line => {
    const obj = JSON.parse(line);
    for (const key in obj)
      !columns[key] && (columns[key] = key);
    csv.push(obj);
  });

  lineReader.on('close', () => {
    csvStringify(csv, {header: true, columns}, (error, csv) => {
      if (error)
        throw error;
      fs.writeFileSync(output, csv);
    });
  });
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const input = process.argv[2];
  const output = process.argv[3];
  toCsv(input, output);
}

module.exports = {
  toCsv
};
