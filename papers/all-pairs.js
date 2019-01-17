const fs = require('fs')
const path = require('path')
const network = require('./network')

const csvParse = require('csv-parse/lib/sync')
const authorsCsv = csvParse(fs.readFileSync(path.resolve(__dirname, './data/authors.csv')), { columns: true })
const refereesCsv = csvParse(fs.readFileSync(path.resolve(__dirname, './data/referee.csv')), { columns: true })

// const names = authors.map(a => {
//   return a.author2.trim()
// }).concat(referees.map(a => {
//   return a.name_referee.trim()
// }))
//
// for (const name of names) {
//   if (!network.authors[name]) {
//     console.log(`${name} : ${network.suggest(name).join(', ')}`)
//   }
// }

const authors = authorsCsv.map(a => a.author2)
const referees = refereesCsv.map(r => r.name_referee)

const authorsSet = {}
for (const author of authors) {
  authorsSet[author] = true
}

const pairs = {}
const notFound = []

console.log('Count: ' + referees.length)
let count = 1
const startTime = Date.now()

for (const referee of referees) {
  console.log(`${count} | ${Math.floor((Date.now() - startTime) / count)}`)
  const tree = network.getFullTree(referee, 3)
  if (!tree) {
    const suggestions = network.suggest(referee, 3)
    notFound.push({
      name: referee,
      suggestions
    })
    console.log(`NOT FOUND: \`${referee}\` | ${suggestions.join(', ')}`)
    ++count
    continue
  }

  let boundary = [ tree ]
  let depth = 1

  while (boundary.length) {
    const newBoundary = []
    for (const node of boundary) {
      for (const child of node.children) {
        const pairId = `${referee}|${child.authorName}`
        if (authorsSet[child.authorName] && pairs[pairId] === undefined) {
          pairs[pairId] = depth
        }
        newBoundary.push(child)
      }
    }
    boundary = newBoundary
    ++depth
  }
  ++count
}

console.log('DONE')
fs.writeFileSync(path.resolve(__dirname, './tempFile.json'), JSON.stringify(pairs, null, 2))
fs.writeFileSync(path.resolve(__dirname, './tempFileNotFound.json'), JSON.stringify(notFound, null, 2))
console.log('wrote to tempFile')
