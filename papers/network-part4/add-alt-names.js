const fs = require('fs')
const path = require('path')
const csvParse = require('csv-parse/lib/sync')
const altNames = csvParse(fs.readFileSync(path.resolve(__dirname, './data/Alternate names - Sheet1.csv')), { columns: true })

const network = require('./network.js')
const nameMatches = require('./name-matches')
const networkAuthors = require('./data/network-authors-shan.json')

function findInNet (foo) { for (const au of Object.keys(network.authors)) { if (nameMatches(foo, network.authors[au].aliases[0])) return au } }

function findInAlts (foo) { for (const au of altNames) { if (nameMatches(foo, au['JHR name'])) return au } }

for (const author of networkAuthors) {
  if (author.matches.length === 0) {
    const inAlt = findInAlts(author.name)
    if (!inAlt) continue

    const alt1 = inAlt['Alternate name']
    const alt2 = inAlt['Alternate name 2']
    const find1 = alt1 && alt1 !== '.' && findInNet(alt1)
    const find2 = find1 || (alt2 && alt2 !== '.' && findInNet(alt2))

    if (find2) {
      console.log(author.name, find2)
      author.matches.push(find2)
    }
  }
}

fs.writeFileSync(path.resolve(__dirname, './data/network-authors-alt.json'), JSON.stringify(networkAuthors))
