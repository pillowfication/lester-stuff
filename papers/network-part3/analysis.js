const _ = require('lodash')
const fs = require('fs')
const path = require('path')
const network = require('./network')
const nameMatches = require('../name-matches')

const csvParse = require('csv-parse/lib/sync')
const authorsCsv = csvParse(fs.readFileSync(path.resolve(__dirname, '../data/authors.csv')), { columns: true })
const refereesCsv = csvParse(fs.readFileSync(path.resolve(__dirname, '../data/referee.csv')), { columns: true })

const shanAuthors = csvParse(fs.readFileSync(path.resolve(__dirname, './data/sh_authors.csv')), { columns: true })
const shanReferees = csvParse(fs.readFileSync(path.resolve(__dirname, './data/sh_referees.csv')), { columns: true })

const ROOT_URL = 'https://ideas.repec.org'
function shrinkUrl (url) {
  return url.startsWith(ROOT_URL) ? url.substr(ROOT_URL.length) : url
}

/**/
/* eslint-disable indent,no-inner-declarations,brace-style */
for (let YEAR = 2008; YEAR <= 2019; ++YEAR) { console.log(`YEAR ${YEAR}`)
/**/

const authors = filterCsv(authorsCsv, 'author2')
const referees = filterCsv(refereesCsv, 'name_referee')
const OUTPUT = path.resolve(__dirname, `./${YEAR}-pairs.csv`)
const OUTPUT_AUTHORS = path.resolve(__dirname, `./${YEAR}-authors.csv`)
const OUTPUT_REFEREES = path.resolve(__dirname, `./${YEAR}-referees.csv`)

const YEAR_REGEX = /, (\d{4}|"undated")\./
function getYear (paper) {
  const match = paper.reference.match(YEAR_REGEX)
  // if (!match) console.log('!!!COULD NOT PARSE YEAR!!!', paper)
  return match ? match[1] === '"undated"' ? 'UNDATED' : +match[1] : undefined
}

const regex = /[,\n"]/
function csvEscape (value) {
  let escaped = String(value).replace('"', '""')
  if (regex.test(escaped)) {
    escaped = '"' + escaped + '"'
  }
  return escaped
}

function filterCsv (csv, col) {
  return _(csv)
    .filter(row => row.year === String(YEAR))
    // .sortBy(row => -row.year)
    .map(col)
    // .uniqWith(nameMatches)
    .value()
}

function toCsvRow (row) {
  return row.map(datum => csvEscape(datum)).join(',') + '\n'
}

console.log('Authors Count: ' + authors.length)
let count = 1
let startTime = Date.now()
fs.writeFileSync(OUTPUT_AUTHORS, 'author,found_name,found_from,url\n')

const authorToRep = {}
const repToAuthor = {}
for (const author of authors) {
  if (count % 10 === 0) {
    const average = Math.floor((Date.now() - startTime) / count)
    console.log(`${count} | ${average} | ${Math.floor((authors.length - count) * average / 1000)}`)
  }
  for (const repName of Object.values(network.authors).map(a => a.name)) {
    if (nameMatches(author, repName)) {
      authorToRep[author] = repName
      repToAuthor[repName] = author
      fs.appendFileSync(OUTPUT_AUTHORS, toCsvRow([ author, repName, 'match', network.findAuthorUrl(repName) ]))
      break
    }
  }
  if (!authorToRep[author]) {
    for (const row of shanAuthors) {
      if (author.trim() === row.author.trim()) {
        if (row.url !== '.') {
          const repp = network.authors[shrinkUrl(row.url)]
          if (repp) {
            authorToRep[author] = repp.name
            repToAuthor[repp.name] = author
            fs.appendFileSync(OUTPUT_AUTHORS, toCsvRow([ author, repp.name, 'shan', shrinkUrl(row.url) ]))
          } else {
            console.log(`Shan found "${row.found_name}" at ${shrinkUrl(row.url)}`)
          }
        }
        break
      }
    }
  }
  if (!authorToRep[author]) {
    fs.appendFileSync(OUTPUT_AUTHORS, toCsvRow([ author, '.', '.', '.' ]))
  }
  ++count
}

console.log('Referees Count: ' + referees.length)
count = 1
startTime = Date.now()
fs.writeFileSync(OUTPUT_REFEREES, 'referee,found_name,found_from,url\n')

const refereeToRep = {}
const repToReferee = {}
for (const referee of referees) {
  if (count % 10 === 0) {
    const average = Math.floor((Date.now() - startTime) / count)
    console.log(`${count} | ${average} | ${Math.floor((referees.length - count) * average / 1000)}`)
  }
  for (const repName of Object.values(network.authors).map(a => a.name)) {
    if (nameMatches(referee, repName)) {
      refereeToRep[referee] = repName
      repToReferee[repName] = referee
      fs.appendFileSync(OUTPUT_REFEREES, toCsvRow([ referee, repName, 'match', network.findAuthorUrl(repName) ]))
      break
    }
  }
  if (!refereeToRep[referee]) {
    for (const row of shanReferees) {
      if (referee.trim() === row.referee.trim()) {
        if (row.url !== '.') {
          const repp = network.authors[shrinkUrl(row.url)]
          if (repp) {
            refereeToRep[referee] = repp.name
            repToReferee[repp.name] = referee
            fs.appendFileSync(OUTPUT_REFEREES, toCsvRow([ referee, repp.name, 'shan', shrinkUrl(row.url) ]))
          } else {
            console.log(`Shan found "${row.found_name}" at ${shrinkUrl(row.url)}`)
          }
        }
        break
      }
    }
  }
  if (!refereeToRep[referee]) {
    fs.appendFileSync(OUTPUT_REFEREES, toCsvRow([ referee, '.', '.', '.' ]))
  }
  ++count
}

/*
 *
 */

const MAX_DEPTH = 7

console.log()
console.log(`Start writing to ${OUTPUT}`)
fs.writeFileSync(OUTPUT, 'author,referee,distance\n')

console.log('Count: ' + referees.length)
count = 1
startTime = Date.now()

for (const referee of referees) {
  if (count % 10 === 0) {
    const average = Math.floor((Date.now() - startTime) / count)
    console.log(`${count} | ${average} | ${Math.floor((referees.length - count) * average / 1000)}`)
  }

  const found = {}
  const repName = refereeToRep[referee]
  if (!repName) { ++count; continue }

  const tree = network.getTree(
    network.findAuthorUrl(repName),
    MAX_DEPTH,
    paper => { const year = getYear(paper); return typeof year === 'number' && year <= YEAR }
  )
  for (const aaa of Object.values(tree)) {
    if (repToAuthor[aaa.name]) {
      found[repToAuthor[aaa.name]] = true
      fs.appendFileSync(OUTPUT, toCsvRow([ repToAuthor[aaa.name], referee, aaa.depth ]))
    }
  }

  for (const author of authors) {
    const repName = authorToRep[author]
    if (repName && !found[author]) {
      fs.appendFileSync(OUTPUT, toCsvRow([ author, referee, MAX_DEPTH + 1 ]))
    }
  }

  ++count
}

console.log('Adding missing pairs...')
for (const referee of referees) {
  for (const author of authors) {
    if (!refereeToRep[referee] || !authorToRep[author]) {
      fs.appendFileSync(OUTPUT, toCsvRow([ author, referee, '.' ]))
    }
  }
}

/**/
}
/**/
