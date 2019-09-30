const _ = require('lodash')
const fs = require('fs')
const path = require('path')
const csvParse = require('csv-parse/lib/sync')
const network = require('./network')
const networkAuthors = require('./find-authors')

const authorsCsv = csvParse(fs.readFileSync(path.resolve(__dirname, '../data/authors.csv')), { columns: true })
const refereesCsv = csvParse(fs.readFileSync(path.resolve(__dirname, '../data/referee.csv')), { columns: true })

const MAX_DEPTH = 7

const regex = /[,\n"]/
function csvEscape (value) {
  let escaped = String(value).replace('"', '""')
  if (regex.test(escaped)) {
    escaped = '"' + escaped + '"'
  }
  return escaped
}

function toCsvRow (row) {
  return row.map(datum => csvEscape(datum)).join(',') + '\n'
}

function getTree (authorId, maxDepth, paperFilter) {
  const distances = { [ authorId ]: 0 }
  let boundary = [ authorId ]
  let depth = 1

  while (depth <= maxDepth) {
    const newBoundary = []
    for (const id of boundary) {
      for (const paper of network.authors[id].papers.filter(paperFilter)) {
        for (const neighbor of network.papers[paper.url].authors) {
          if (distances[neighbor] === undefined) {
            distances[neighbor] = depth
            newBoundary.push(neighbor)
          }
        }
      }
    }
    boundary = newBoundary
    ++depth
  }

  return distances
}

for (let YEAR = 2007; YEAR <= 2018; ++YEAR) {
  console.log()
  console.log('=================================')
  console.log(`YEAR ${YEAR}`)

  const authors = _(authorsCsv).filter(row => row.year === String(YEAR)).map('author2').value()
  const referees = _(refereesCsv).filter(row => row.year === String(YEAR)).map('referee_name1').value()
  const output = path.resolve(__dirname, `./data/${YEAR}-pairs.csv`)
  fs.writeFileSync(output, 'author,referee,distance\n')

  let counter = 0
  for (const author of authors) {
    if (counter % 50 === 0) {
      console.log(`${counter}/${authors.length}`)
    }
    ++counter

    const authorId = networkAuthors[author].matches[0]
    if (!authorId) continue
    // if (!network.authors[authorId]) console.log(authorId)
    const distances = getTree(authorId, MAX_DEPTH, paper => paper.year && paper.year < YEAR)
    for (const referee of referees) {
      const refereeId = networkAuthors[referee].matches[0]
      if (!refereeId) continue
      fs.appendFileSync(output, toCsvRow([ author, referee, distances[refereeId] || (MAX_DEPTH + 1) ]))
    }
  }

  console.log('Adding missing...')
  for (const author of authors) {
    for (const referee of referees) {
      if (!networkAuthors[author].matches[0] || !networkAuthors[referee].matches[0]) {
        fs.appendFileSync(output, toCsvRow([ author, referee, '.' ]))
      }
    }
  }
}
