const fs = require('fs')
const path = require('path')
const network = require('./network-with-name-stuff')
const nameMatches = require('../name-matches')

const csvParse = require('csv-parse/lib/sync')
const authorsCsv = csvParse(fs.readFileSync(path.resolve(__dirname, '../data/authors.csv')), { columns: true })
const refereesCsv = csvParse(fs.readFileSync(path.resolve(__dirname, '../data/referee.csv')), { columns: true })

const authors = authorsCsv.map(a => a.author)
const referees = refereesCsv.map(r => r.name_referee)

// for (let i = 0; i < authors.length; ++i) {
//   const a1 = authors[i]
//   for (let j = i; j < authors.length; ++j) {
//     const a2 = authors[j]
//     if (nameMatches(a1, a2)) {
//       console.log(`MATCH: ${a1} | ${a2}`)
//     }
//   }
// }

for (const author of authors) {
  let found
  for (const repName of Object.keys(network)) {
    if (nameMatches(author, repName)) {
      if (!found) {
        found = repName
      } else {
        console.log(`DUPE FOR ${author}: ${found} | ${repName}`)
      }
    }
  }
  if (!found) {
    console.log(`NO MATCH: ${author}`)
  }
}
