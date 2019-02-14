const _ = require('lodash')
const fs = require('fs')
const path = require('path')
const network = require('./network-with-name-stuff')
const nameMatches = require('../name-matches')
const csvEscape = require('./csv-escape')

const csvParse = require('csv-parse/lib/sync')
const authorsCsv = csvParse(fs.readFileSync(path.resolve(__dirname, '../data/authors.csv')), { columns: true })
const refereesCsv = csvParse(fs.readFileSync(path.resolve(__dirname, '../data/referee.csv')), { columns: true })

const YEAR = process.argv[2] || 9999
const authors = filterCsv(authorsCsv, 'author')
const referees = filterCsv(refereesCsv, 'name_referee')
const OUTPUT = path.resolve(__dirname, `./${YEAR}-pairs.csv`)
const OUTPUT_AUTHORS = path.resolve(__dirname, `./${YEAR}-authors.csv`)
const OUTPUT_REFEREES = path.resolve(__dirname, `./${YEAR}-referees.csv`)

function filterCsv (csv, col) {
  return _(csv)
    .filter(row => row.year <= YEAR)
    .map(col)
    .uniqWith(nameMatches)
    .value()
}

function toCsvRow (row) {
  return row.map(datum => csvEscape(datum)).join(',') + '\n'
}

console.log('Authors Count: ' + authors.length)
let count = 1
let startTime = Date.now()
fs.writeFileSync(OUTPUT_AUTHORS, 'author,found\n')

const authorToRep = {}
const repToAuthor = {}
for (const author of authors) {
  if (count % 10 === 0) {
    const average = Math.floor((Date.now() - startTime) / count)
    console.log(`${count} | ${average} | ${Math.floor((authors.length - count) * average / 1000)}`)
  }
  for (const repName of Object.keys(network)) {
    if (nameMatches(author, repName)) {
      authorToRep[author] = repName
      repToAuthor[repName] = author
      fs.appendFileSync(OUTPUT_AUTHORS, toCsvRow([ author, 1 ]))
      break
    }
  }
  if (!authorToRep[author]) {
    fs.appendFileSync(OUTPUT_AUTHORS, toCsvRow([ author, 0 ]))
  }
  ++count
}

console.log('Referees Count: ' + referees.length)
count = 1
startTime = Date.now()
fs.writeFileSync(OUTPUT_REFEREES, 'referee,found\n')

const refereeToRep = {}
const repToReferee = {}
for (const referee of referees) {
  if (count % 10 === 0) {
    const average = Math.floor((Date.now() - startTime) / count)
    console.log(`${count} | ${average} | ${Math.floor((referees.length - count) * average / 1000)}`)
  }
  for (const repName of Object.keys(network)) {
    if (nameMatches(referee, repName)) {
      refereeToRep[referee] = repName
      repToReferee[repName] = referee
      fs.appendFileSync(OUTPUT_REFEREES, toCsvRow([ referee, 1 ]))
      break
    }
  }
  if (!refereeToRep[referee]) {
    fs.appendFileSync(OUTPUT_REFEREES, toCsvRow([ referee, 0 ]))
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

  const repName = refereeToRep[referee]
  if (repName) {
    grow(referee, 1, [ { neighbors: { [repName]: [ { year: -1 } ] } } ], {})
  }

  ++count
}

function grow (rootName, depth, boundary, seenNames) {
  if (depth > MAX_DEPTH) {
    for (const author of authors) {
      const repName = authorToRep[author]
      if (repName && !seenNames[repName]) {
        fs.appendFileSync(OUTPUT, toCsvRow([ author, rootName, depth ]))
      }
    }
    return
  }

  const newBoundary = []
  for (const node of boundary) {
    for (const neighbor of Object.keys(node.neighbors)) {
      if (!_.some(node.neighbors[neighbor], paper => paper.year <= YEAR)) {
        continue
      }
      if (!seenNames[neighbor]) {
        seenNames[neighbor] = true
        if (repToAuthor[neighbor]) {
          fs.appendFileSync(OUTPUT,
            [ repToAuthor[neighbor], rootName, depth ].map(csvEscape).join(',') + '\n'
          )
        }
        newBoundary.push(network[neighbor])
      }
    }
  }

  grow(rootName, depth + 1, newBoundary, seenNames)
}

console.log('Adding missing pairs...')
for (const referee of referees) {
  for (const author of authors) {
    if (!refereeToRep[referee] || !authorToRep[author]) {
      fs.appendFileSync(OUTPUT, toCsvRow([ author, referee, '.' ]))
    }
  }
}
