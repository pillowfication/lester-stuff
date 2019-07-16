const fs = require('fs')
const path = require('path')

const authors = {}
const papers = {}

function getResearch (author) {
  const papers = []
  for (const paper of author.research.papers || []) {
    papers.push(paper)
    if (paper.publishedas) papers.push(paper.publishedas)
    if (paper.otherversion) papers.push(paper.otherversion)
  }
  return [].concat(...papers, author.research.articles || [], author.research.chapters || [])
}

for (const i of [ 0, 1, 2, 3, 4, 5 ]) {
  console.log(`Building chunk ${i}...`)
  let dataChunk = fs.readFileSync(path.resolve(__dirname, `./data/network-${i}.json`))
    .toString()
    .split('\n')
  dataChunk.pop()
  dataChunk = dataChunk.map(line => JSON.parse(line))

  for (const author of dataChunk) {
    const authorDatum = (authors[author.url] = {
      name: author.name,
      papers: {}
    })

    for (const paper of getResearch(author)) {
      const paperDatum = papers[paper.url] || (papers[paper.url] = {
        reference: paper.reference,
        authors: {}
      })
      paperDatum.authors[author.url] = authorDatum
      authorDatum.papers[paper.url] = paperDatum
    }
  }
}

function getTree (authorUrl, maxDepth, filter) {
  const found = { [authorUrl]: { name: authors[authorUrl].name, depth: 0 } }
  let queue = { [authorUrl]: authors[authorUrl] }
  let depth = 0

  while (Object.keys(queue).length > 0 && ++depth <= maxDepth) {
    const newQueue = {}
    for (const author of Object.values(queue)) {
      for (const paper of Object.values(author.papers).filter(filter)) {
        for (const authorUrl in paper.authors) {
          if (!found[authorUrl]) {
            found[authorUrl] = { name: paper.authors[authorUrl].name, depth }
            newQueue[authorUrl] = authors[authorUrl]
          }
        }
      }
    }
    queue = newQueue
  }

  return found
}

function findAuthorUrl (name) {
  for (const authorUrl in authors) {
    if (authors[authorUrl].name === name) {
      return authorUrl
    }
  }
}

module.exports = { authors, papers, getTree, findAuthorUrl }
