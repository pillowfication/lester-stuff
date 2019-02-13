const network = require('./network')
const nameMatches = require('./name-matches')

const seenNames = {}

const authorNames = Object.keys(network.authors)
for (let index = 0; index < authorNames.length; ++index) {
  console.log(index, index / authorNames.length)
  const authorName = authorNames[index]
  let found = false
  for (const seenName in seenNames) {
    if (nameMatches(authorName, seenName)) {
      seenNames[seenName].push(authorName)
      found = true
      break
    }
  }
  if (!found) {
    seenNames[authorName] = [ authorName ]
  }
}

module.exports = seenNames
