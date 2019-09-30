const fs = require('fs')
const path = require('path')
const network = require('./network')
const csvParse = require('csv-parse/lib/sync')
const altNames = csvParse(fs.readFileSync(path.resolve(__dirname, './data/Alternate names - Sheet1.csv')), { columns: true })
const shanAuthors = csvParse(fs.readFileSync(path.resolve(__dirname, './data/sh_authors.csv')), { columns: true })
const shanReferees = csvParse(fs.readFileSync(path.resolve(__dirname, './data/sh_referees.csv')), { columns: true })
const nameMatches = require('./name-matches')

const foundNameMap = {}
for (const row of altNames) {
  foundNameMap[row['JHR name']] = row['Alternate Name']
}
// for (const row of shanAuthors) {
//   foundNameMap[row.author] = row.found_name
// }
// for (const row of shanReferees) {
//   foundNameMap[row.referee] = row.found_name
// }
const mapKeys = Object.keys(foundNameMap)

function getMapKey (name) {
  for (const key of mapKeys) {
    if (nameMatches(name, key)) {
      return key
    }
  }
}

const networkAuthors = require('./data/network-authors-shan.json')

const networkKeys = Object.keys(network.authors)
function getAuthId (name) {
  for (const key of networkKeys) {
    if (nameMatches(name, network.authors[key].aliases[0])) {
      return key
    }
  }
}

let counter = 0
for (const auth of networkAuthors) {
  if (counter % 100 === 0) {
    console.log(counter, networkAuthors.length)
  }
  ++counter

  if (auth.matches.length === 0) {
    const foundShan = getMapKey(auth.name)
    if (foundShan) {
      const newNetworkKey = getAuthId(foundNameMap[foundShan])
      if (newNetworkKey) {
        console.log(auth.name, newNetworkKey)
        auth.matches = [ newNetworkKey ]
      }
    }
  }
}

fs.writeFileSync(path.resolve(__dirname, './data/network-authors-shan2.json'), JSON.stringify(networkAuthors))
