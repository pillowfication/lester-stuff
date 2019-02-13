const fs = require('fs')
const path = require('path')
const network = require('./network-with-name-stuff')
const nameMatches = require('../name-matches')
const csvEscape = require('./csv-escape')

const csvParse = require('csv-parse/lib/sync')
const authorsCsv = csvParse(fs.readFileSync(path.resolve(__dirname, '../data/authors.csv')), { columns: true })
const refereesCsv = csvParse(fs.readFileSync(path.resolve(__dirname, '../data/referee.csv')), { columns: true })

const authors = authorsCsv.map(a => a.author2)
const referees = refereesCsv.map(r => r.name_referee)
const OUTPUT = path.resolve(__dirname, './pairs2.csv')

console.log('Count: ' + authors.length)
let count = 1
let startTime = Date.now()

const authorNameCache = {}
for (const author of authors) {
  console.log(`${count} | ${Math.floor((Date.now() - startTime) / count)} | ${Math.floor((authors.length - count) * (Math.floor((Date.now() - startTime) / count)) / 1000)}`)
  for (const repName of Object.keys(network)) {
    if (nameMatches(author, repName)) {
      if (authorNameCache[repName]) {
        console.log(`ERROR authors: ${authorNameCache[repName]} | ${author}`)
      } else {
        authorNameCache[repName] = author
      }
    }
  }
  ++count
}

const pairs = []
const MAX_DEPTH = 7

console.log()
console.log(`Start writing to ${OUTPUT}`)
fs.writeFileSync(OUTPUT, 'author,referee,distance\n')

console.log('Count: ' + referees.length)
count = 1
startTime = Date.now()

for (const referee of referees) {
  console.log(`${count} | ${Math.floor((Date.now() - startTime) / count)} | ${Math.floor((referees.length - count) * (Math.floor((Date.now() - startTime) / count)) / 1000)}`)

  let foundRep
  for (const repName of Object.keys(network)) {
    if (nameMatches(referee, repName)) {
      if (foundRep) {
        console.log(`ERROR referees: ${referee} | ${foundRep} | ${repName}`)
      } else {
        foundRep = repName
        grow(referee, 1, [ network[repName] ], { [repName]: true })
      }
    }
  }

  ++count
}

function grow (rootName, depth, boundary, seenNames) {
  if (depth > MAX_DEPTH) return

  const newBoundary = []
  for (const node of boundary) {
    for (const neighbor of Object.keys(node.neighbors)) {
      if (!seenNames[neighbor]) {
        seenNames[neighbor] = true
        if (authorNameCache[neighbor]) {
          pairs.push({
            author: authorNameCache[neighbor],
            referee: rootName,
            distance: depth
          })
          fs.appendFileSync(OUTPUT,
            [ authorNameCache[neighbor], rootName, depth ].map(csvEscape).join(',') + '\n'
          )
        }
        newBoundary.push(network[neighbor])
      }
    }
  }

  grow(rootName, depth + 1, newBoundary, seenNames)
}

module.exports = pairs
