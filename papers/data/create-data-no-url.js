const fs = require('fs')
const path = require('path')
const data = require('./data.json')

for (const journal of data) {
  for (const volumeName of Object.keys(journal.contents)) {
    const volume = journal.contents[volumeName]
    for (const issueName of Object.keys(volume)) {
      const issue = volume[issueName]
      for (const paper of issue.papers) {
        delete paper.url
      }
    }
  }
}

fs.writeFileSync(path.resolve(__dirname, './data-no-url.json'), JSON.stringify(data))
