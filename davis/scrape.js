const fs = require('fs');
const path = require('path');
const request = require('request');
const cheerio = require('cheerio');

const BASE_URL = 'http://directory.ucdavis.edu/search/directory_results.shtml';
const OUTPUT = 'data.json';

function pad(id) {
  return ('00000000' + id).slice(-8);
}

function getPage(id) {
  return new Promise((resolve, reject) => {
    request(
      {url: `${BASE_URL}?id=${pad(id)}`},
      (error, response, body) =>
        error || !body
          ? reject(error || new Error('Could not load page.'))
          : resolve(body)
    );
  });
}

function getTable(html) {
  return new Promise((resolve, reject) => {
    try {
      const $ = cheerio.load(html);
      const table = $('#directory_results_wrapper > table').first();
      if (table.get().length === 0)
        return resolve(null);

      const data = {};
      table.find('tr').each((index, row) => {
        const first = $(row).children().first();
        data[first.text()] = first.next().text();
      });
      resolve(data);
    } catch (error) {
      reject(error);
    }
  });
}

function getIds(start, count) {
  return new Promise((resolve, reject) => {
    const results = [];
    let finished = 0;

    for (let index = 0; index < count; ++index)
      getPage(start + index)
        .then(getTable)
        .then(data => {
          results[index] = data;
          if (++finished === count)
            resolve(results);
        })
        .catch(reject);
  });
}

function scrape(start = 0, end = 99999999, chunk = 20, output = OUTPUT) {
  output = path.join(__dirname, output);

  const keys = {};
  function cleanData(id, data) {
    const clean = {id};
    for (const key in data) {
      const cleanKey = key.toLowerCase().replace(/[^a-z]+/g, '');
      (keys[cleanKey] || (keys[cleanKey] = new Set())).add(key);
      clean[cleanKey] = data[key];
    }
    return clean;
  }

  (function _scrape(curr) {
    if (curr > end) {
      console.log('All done here!');
      console.log(keys);
      return;
    }

    let _chunk = Math.max(1, Math.min(chunk, end - curr));
    console.log(`Getting: ${pad(curr)} - ${pad(curr + _chunk - 1)}`);

    getIds(curr, _chunk)
      .then(results => {
        let found = [];
        for (let index = 0; index < _chunk; ++index) {
          const data = results[index];
          if (data)
            found.push(cleanData(curr + index, data));
        }
        console.log(found.length
          ? `Found ids: ${found.map(data => data.id).join(', ')}`
          : `Found ids: (none)`
        );

        fs.appendFileSync(output,
          found.map(data => JSON.stringify(data) + '\n').join('')
        );

        _scrape(curr + _chunk);
      })
      .catch(error => {
        console.log(error);
        _scrape(curr);
      });
  })(start);
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const start = process.argv[2] && +process.argv[2];
  const end = process.argv[3] && +process.argv[3];
  const chunk = process.argv[4] && +process.argv[4];
  const output = process.argv[5];
  scrape(start, end, chunk, output);
}

module.exports = {
  getPage, getTable, getIds, scrape
};
