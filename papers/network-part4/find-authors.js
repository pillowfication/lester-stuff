const _ = require('lodash')
const fs = require('fs')
const path = require('path')
const csvParse = require('csv-parse/lib/sync')
const nameMatches = require('./name-matches')

const authorsCsv = csvParse(fs.readFileSync(path.resolve(__dirname, '../data/authors.csv')), { columns: true })
const refereesCsv = csvParse(fs.readFileSync(path.resolve(__dirname, '../data/referee.csv')), { columns: true })

function mapify (matches) {
  const map = {}
  for (const match of matches) {
    map[match.name] = { matches: match.matches }
  }
  return map
}

const authorsOutput = path.resolve(__dirname, './data/network-authors-alt.json')
try {
  fs.accessSync(authorsOutput)
  console.log('Names file found...')
  module.exports = mapify(require(authorsOutput))
} catch (err) {
  const network = require('./network')
  console.log('Matching names...')
  const names = _.uniq([ ..._.map(authorsCsv, 'author2'), ..._.map(refereesCsv, 'referee_name1') ])
  const authorKeys = Object.keys(network.authors).sort()
  const matches = []

  for (let i = 0; i < names.length; ++i) {
    if (i % 100 === 0) {
      console.log(`${i}/${names.length}`)
    }

    const name = names[i]
    matches.push({
      name,
      matches: authorKeys.filter(authorId =>
        nameMatches(name, network.authors[authorId].aliases[0])
      )
    })
  }
  fs.writeFileSync(authorsOutput, JSON.stringify(matches))

  module.exports = mapify(matches)
}
