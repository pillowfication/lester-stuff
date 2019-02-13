const data = require('../data/data-no-url.json')
const { getNameRep } = require('./get-name-rep')

const authors = {}

for (const journal of data) {
  for (const volumeName of Object.keys(journal.contents)) {
    const volume = journal.contents[volumeName]
    for (const issueName of Object.keys(volume)) {
      const issue = volume[issueName]
      for (const paper of issue.papers) {
        const paperInfo = {
          id: `${journal.id}|${volumeName}|${issueName}|${paper.title}`,
          year: issue.year
        }
        for (const authorName of paper.authors) {
          const repName = getNameRep(authorName)
          let author = authors[repName]
          if (!author) {
            author = authors[repName] = {
              name: repName,
              papers: [],
              neighbors: {}
            }
          }
          author.papers.push({
            info: paperInfo,
            as: authorName
          })
          for (const coauthorName of paper.authors) {
            const repCoName = getNameRep(coauthorName)
            if (repCoName !== repName) {
              let neighbor = author.neighbors[repCoName]
              if (!neighbor) {
                neighbor = author.neighbors[repCoName] = []
              }
              neighbor.push(paperInfo)
            }
          }
        }
      }
    }
  }
}

module.exports = authors
