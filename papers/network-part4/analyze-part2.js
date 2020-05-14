const _ = require('lodash')
const fs = require('fs')
const path = require('path')
const csvParse = require('csv-parse/lib/sync')
const network = require('./network')
const networkAuthors = require('./find-authors')
const nameMatches = require('./name-matches')

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

function is5JournalsNoPP (url) {
  const fives = [ 'oupqjecon', 'aeaaecrev', 'ouprestud', 'ecmemetrp', 'wlyemetrp', 'ucpjpolec' ]
  for (const f of fives) {
    if (url.startsWith(f)) return !isAERPP(url)
  }
  return false
}

const AERPP2 = require('./data/WOW-aeaaecrev.json')
const blehMap = {}
for (const paper of AERPP2.papers) {
  blehMap[paper.url] = { year: paper.year, issue: +paper.issue }
}
function isAERPP (url) {
  if (!url.startsWith('aeaaecrev')) return false
  const url2 = url.substring(10)
  if (blehMap[url2] && AERPPmap[blehMap[url2].year] !== undefined && blehMap[url2].issue === AERPPmap[blehMap[url2].year]) return true
  return false
}
const AERPPmap = { 2019: undefined, 2018: undefined, 2017: 5, 2016: 5, 2015: 5, 2014: 5, 2013: 3, 2012: 3, 2011: 3, 2010: 2, 2009: 2, 2008: 2, 2007: 2, 2006: 2, 2005: 2, 2004: 2, 2003: 2, 2002: 2, 2001: 2, 2000: 2, 1999: 2, 1998: 2, 1997: 2, 1996: 2, 1995: 2, 1994: 2, 1993: 2, 1992: 2, 1991: 2, 1990: 2, 1989: 2, 1988: 2, 1987: 2, 1986: 2, 1985: 2, 1984: 2, 1983: 2, 1982: 2, 1981: 2, 1980: 2, 1979: 2, 1978: 2, 1977: 2, 1976: 2, 1975: 2, 1974: 2, 1973: 2, 1972: 2, 1971: 2, 1970: 2, 1969: 2, 1968: 2, 1967: 2, 1966: undefined, 1965: undefined, 1964: 3, 1963: 2, 1962: 2, 1961: 2, 1960: 2 }

const nber = require('./data/nber.json')
function getNBERYear (name) {
  for (const key of Object.keys(nber)) {
    if (nameMatches(key, name)) {
      return nber[key]
    }
  }
  return null
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

  let data = toCsvRow([ 'author', 'published_papers', 'published_from_5', 'published_from_5_no_pp', 'is_nber', 'is_nber_lagged', 'ever_nber', 'degree_1', 'degree_2', 'degree_1or2' ])

  let counter = 0
  for (const author of authors) {
    if (counter % 50 === 0) {
      console.log(`${counter}/${authors.length}`)
    }
    ++counter

    const authorId = networkAuthors[author].matches[0]
    const NBERYear = getNBERYear(author)
    const isNBER = NBERYear === null ? false : YEAR >= NBERYear
    const isNBERLagged = NBERYear === null ? false : YEAR >= NBERYear - 1
    const everNBER = NBERYear !== null

    if (!authorId) {
      data += toCsvRow([ author, '.', '.', '.', isNBER ? 1 : 0, isNBERLagged ? 1 : 0, everNBER ? 1 : 0, '.', '.', '.' ])
    } else {
      const publishedPapers = network.authors[authorId].papers.filter(paper => {
        return !isWP(paper.url) && paper.year <= YEAR
      })

      const publishedFrom5 = network.authors[authorId].papers.filter(paper => {
        return is5Journals(paper.url) && paper.year <= YEAR
      })

      const publishedFrom5NoPP = network.authors[authorId].papers.filter(paper => {
        return is5JournalsNoPP(paper.url) && paper.year <= YEAR
      })

      const coauthors = removeName(getCoauthors(authorId, YEAR), authorId)
      const cocoauthors = removeName(_.uniq(_.flatten(coauthors.map(auth => removeName(getCoauthors(auth, YEAR), auth)))), authorId)

      data += toCsvRow([ author, publishedPapers.length, publishedFrom5.length, publishedFrom5NoPP.length, isNBER ? 1 : 0, isNBERLagged ? 1 : 0, everNBER ? 1 : 0, coauthors.length, cocoauthors.length, _.uniq([...coauthors, ...cocoauthors]).length ])
    }
  }

  fs.writeFileSync(path.resolve(__dirname, `./data/${YEAR}-data.csv`), data)
}
