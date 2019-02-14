const name = 'Emek Basker'
const network = require('./network-with-name-stuff')
const nameMatches = require('../name-matches')

for (const author of Object.keys(network)) {
  if (nameMatches(name, author)) {
    console.log(author)
  }
}
