const fs = require('fs')
const path = require('path')
const network = require('./network')
const nameMatches = require('./name-matches')

const csvParse = require('csv-parse/lib/sync')
const authorsCsv = csvParse(fs.readFileSync(path.resolve(__dirname, './data/authors.csv')), { columns: true })
const refereesCsv = csvParse(fs.readFileSync(path.resolve(__dirname, './data/referee.csv')), { columns: true })

const betterNames = authorsCsv.map(a => a.author2).concat(refereesCsv.map(a => a.name_referee))
const names = authorsCsv.map(a => a.author).concat(refereesCsv.map(a => a.name_referee))
const authors = Object.keys(network.authors).filter(authorName => {
  try {
    nameMatches('', authorName)
    return true
  } catch (e) {
    return false
  }
})

const start = Date.now()
let i = 0
console.log(names.length)
const results = names.map((name, index) => {
  console.log(++i, Math.round((Date.now() - start) / i), Math.round((names.length - i) * ((Date.now() - start) / i) / 1000 / 60))
  const matches = authors.filter(authorName => {
    return nameMatches(name, authorName)
  })
  return {
    name,
    matches,
    nearMatches: matches.length ? [] : network.suggest(betterNames[index])
  }
})

fs.writeFileSync(path.resolve(__dirname, './name-checking.json'), JSON.stringify(results, null, 2))
console.log('done')
