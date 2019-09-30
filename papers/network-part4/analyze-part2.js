const _ = require('lodash')
const fs = require('fs')
const path = require('path')
const csvParse = require('csv-parse/lib/sync')
const network = require('./network')
const networkAuthors = require('./find-authors')

const authorsCsv = csvParse(fs.readFileSync(path.resolve(__dirname, '../data/authors.csv')), { columns: true })
const refereesCsv = csvParse(fs.readFileSync(path.resolve(__dirname, '../data/referee.csv')), { columns: true })

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

function isWP (url) {
  const wps = [ 'nbrnberwo', 'izaizadps', 'arxpapers', 'cprceprdp' ]
  for (const wp of wps) {
    if (url.startsWith(wp)) return true
  }
  return false
}

function is5Journals (url) {
  const fives = [ 'oupqjecon', 'aeaaecrev', 'ouprestud', 'ecmemetrp', 'wlyemetrp', 'ucpjpolec' ]
  for (const f of fives) {
    if (url.startsWith(f)) return true
  }
  return false
}

function getCoauthors (authorId, year) {
  return _.uniq(_.flatten(network.authors[authorId].papers
    .filter(paper => paper.year <= year)
    .map(paper => network.papers[paper.url].authors)))
}

function removeName (array, name) {
  return array.filter(a => a !== name)
}

for (let YEAR = 2007; YEAR <= 2018; ++YEAR) {
  console.log()
  console.log('=================================')
  console.log(`YEAR ${YEAR}`)

  const authors_ = _(authorsCsv).filter(row => row.year === String(YEAR)).map('author2').value()
  const referees = _(refereesCsv).filter(row => row.year === String(YEAR)).map('referee_name1').value()
  const authors = _.uniq([ ...authors_, ...referees ].sort())

  let data = toCsvRow([ 'author', 'published_papers', 'published_from_5', 'degree_1', 'degree_2', 'degree_1or2' ])

  let counter = 0
  for (const author of authors) {
    if (counter % 50 === 0) {
      console.log(`${counter}/${authors.length}`)
    }
    ++counter

    const authorId = networkAuthors[author].matches[0]
    if (!authorId) {
      data += toCsvRow([ author, '.', '.', '.', '.', '.' ])
    } else {
      const publishedPapers = network.authors[authorId].papers.filter(paper => {
        return !isWP(paper.url) && paper.year <= YEAR
      })

      const publishedFrom5 = network.authors[authorId].papers.filter(paper => {
        return is5Journals(paper.url) && paper.year <= YEAR
      })

      const coauthors = removeName(getCoauthors(authorId, YEAR), authorId)
      const cocoauthors = removeName(_.uniq(_.flatten(coauthors.map(auth => removeName(getCoauthors(auth, YEAR), auth)))), authorId)

      data += toCsvRow([ author, publishedPapers.length, publishedFrom5.length, coauthors.length, cocoauthors.length, _.uniq([...coauthors, ...cocoauthors]).length ])
    }
  }

  fs.writeFileSync(path.resolve(__dirname, `./data/${YEAR}-data.csv`), data)
}
