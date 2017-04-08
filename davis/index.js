const fs = require('fs');
const path = require('path');
const async = require('async');
const request = require('request');
const cheerio = require('cheerio');

const BASE_URL = 'http://directory.ucdavis.edu/search/directory_results.shtml?id=';
const OUT = path.join(__dirname, 'data.json');

function getPage(id) {
  return new Promise((resolve, reject) => {
    request(
      {url: `${BASE_URL}${id}`},
      (error, response, body) =>
        error ? reject(error) : resolve(body)
    );
  });
}

function getTable(html) {
  const $ = cheerio.load(html);
  const table = $('#directory_results_wrapper > table').first();
  if (table.get().length === 0)
    return null;

  const data = {};
  table.find('tr').each((index, row) => {
    const first = $(row).children().first();
    data[first.text()] = first.next().text();
  });
  return data;
}

function getId(id, cb) {
  id = ('00000000' + id).slice(-8);
  getPage(id)
    .then(html => {
      const table = getTable(html);
      return table ? cb(null, table) : cb(null, null);
    })
    .catch(error =>
      cb(error)
    );
}

function writeChunk(id, count, cb) {
  console.log(`GETTING ${id}-${id+count-1}`);
  async.times(count,
    (n, next) =>
      getId(id + n, next),
    (err, results) => {
      if (err)
        return cb(err);
      results.forEach(user => {
        if (user)
          fs.appendFileSync(OUT, JSON.stringify(user)+'\n');
      });
      cb(null);
    }
  );
}

function scrape(start = 0, end = 99999999, step = 20) {
  let index = start;
  const now = Date.now();
  async.whilst(
    () => { return index < end; },
    (next) => {
      console.log(`TIME: ${Date.now() - now}`);
      writeChunk(index, step, next);
      index += step;
    },
    console.log.bind(console)
  )
}

scrape();
