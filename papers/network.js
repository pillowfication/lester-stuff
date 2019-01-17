const data = require('./data/data-no-url.json')

/*
data = [
  Journal: {
    "id": String,
    "title": String,
    "contents": {
      <volumeName>: Volume: {
        <issueName>: Issue: {
          "year": String,
          "papers": [ Paper: {
            "title": String,
            "url": String,
            "authors": [ String ]
          } ]
        }
        ...
      }
      ...
    }
  }
]
*/

class Author {
  constructor (name, paperInfo) {
    this.papers = [ paperInfo ]
    this.name = name
    this.neighbors = {}
  }
}

const authors = {}

function getAuthor (authorName, paperInfo) {
  let author = authors[authorName]
  if (author) {
    author.papers.push(paperInfo)
    return author
  } else {
    author = new Author(authorName, paperInfo)
    authors[authorName] = author
    return author
  }
}
function getNeighbor (author, neighborName) {
  return author.neighbors[neighborName] || (author.neighbors[neighborName] = [])
}

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
          const author = getAuthor(authorName, paperInfo)
          for (const coauthorName of paper.authors) {
            if (authorName !== coauthorName) {
              getNeighbor(author, coauthorName).push(paperInfo)
            }
          }
        }
      }
    }
  }
}

function findPaths (authorName, coauthorName, paperFilter = () => true) {
  const author = authors[authorName]
  const coauthor = authors[coauthorName]
  if (!author || !coauthor) {
    return null
  }
  if (authorName === coauthorName) {
    return []
  }

  const tree = {
    authorName,
    from: [],
    children: []
  }
  let boundary = [ tree ]
  let foundCoauthor = false
  let seenPapers = {}
  let seenOnBoundary = []

  function growChildren () {
    const newBoundary = []
    for (const node of boundary) {
      const author = authors[node.authorName]
      for (const neighborName of Object.keys(author.neighbors)) {
        let inPath = false
        for (let curr = node; curr; curr = curr.parent) {
          if (curr.authorName === neighborName) {
            inPath = true
            break
          }
        }
        if (inPath) {
          continue
        }
        if (neighborName === coauthorName) {
          foundCoauthor = true
        }
        const filteredPapers = author.neighbors[neighborName].filter(paper => {
          if (!paperFilter(paper) || seenPapers[paper.id]) {
            return false
          }
          seenOnBoundary.push(paper.id)
          return true
        })
        if (filteredPapers.length) {
          const childNode = {
            authorName: neighborName,
            parent: node,
            from: filteredPapers,
            children: []
          }
          node.children.push(childNode)
          newBoundary.push(childNode)
        }
      }
    }
    boundary = newBoundary
    for (const paper of seenOnBoundary) {
      seenPapers[paper] = true
    }
    seenOnBoundary = []
  }

  let depth = 0
  while (!foundCoauthor && boundary.length && depth < 10) {
    growChildren()
    ++depth
  }

  if (!foundCoauthor) {
    return { tree: null, depth }
  }

  function pruneNode (node) {
    if (node.children.length) {
      node.children.forEach(child => {
        pruneNode(child)
        delete child.parent
      })
    }
    node.children = node.children.filter(node =>
      node.authorName === coauthorName || node.children.length
    )
  }

  pruneNode(tree)
  return { tree, depth }
}

function getFullTree (authorName, maxDepth = 10, paperFilter = () => true) {
  const author = authors[authorName]
  if (!author) {
    return null
  }

  const tree = {
    authorName,
    from: [],
    children: []
  }
  let boundary = [ tree ]
  let seenPapers = {}
  let seenOnBoundary = []

  function growChildren () {
    const newBoundary = []
    for (const node of boundary) {
      const author = authors[node.authorName]
      for (const neighborName of Object.keys(author.neighbors)) {
        let inPath = false
        for (let curr = node; curr; curr = curr.parent) {
          if (curr.authorName === neighborName) {
            inPath = true
            break
          }
        }
        if (inPath) {
          continue
        }
        const filteredPapers = author.neighbors[neighborName].filter(paper => {
          if (!paperFilter(paper) || seenPapers[paper.id]) {
            return false
          }
          seenOnBoundary.push(paper.id)
          return true
        })
        if (filteredPapers.length) {
          const childNode = {
            authorName: neighborName,
            parent: node,
            from: filteredPapers,
            children: []
          }
          node.children.push(childNode)
          newBoundary.push(childNode)
        }
      }
    }
    boundary = newBoundary
    for (const paper of seenOnBoundary) {
      seenPapers[paper] = true
    }
    seenOnBoundary = []
  }

  let depth = 0
  while (depth < maxDepth) {
    growChildren()
    ++depth
  }

  return tree
}

function enumeratePaths (node) {
  const currPath = {
    authorName: node.authorName,
    from: node.from.map(paper => paper.id)
  }

  if (!node.children.length) {
    return [ [ currPath ] ]
  }

  let childPaths = [].concat(...node.children.map(enumeratePaths))
  return childPaths.map(path => [ currPath ].concat(path))
}

const dictionary = Object.keys(authors)

const trie = {}
for (const word of dictionary) {
  let node = trie
  for (const letter of word) {
    let nextNode = node[letter]
    if (!nextNode) {
      nextNode = node[letter] = {}
    }
    node = nextNode
  }
  node._ = true
}

function suggest1 (string, distance = 2) {
  if (typeof string !== 'string') {
    return []
  }

  string = string.toUpperCase()
  const baseLength = string.length
  const results = []

  const initColumn = []
  for (let i = 0; i < baseLength; ++i) {
    initColumn.push(i + 1)
  }

  function getNextColumn (currColumn, column, node) {
    const nextColumn = []
    let above = column + 1
    let diag = column
    let minDist = -1

    for (let row = 0; row < baseLength; ++row) {
      const cost = (node === string[row].toUpperCase() || node === string[row].toLowerCase()) ? 0 : 1
      const left = currColumn[row]
      const currDist = Math.min(
        above + 1, // Deletion
        left + 1, // Insertion
        diag + cost // Substitution
      )

      above = currDist
      diag = left
      nextColumn[row] = currDist

      if (minDist === -1 || currDist < minDist) {
        minDist = currDist
      }
    }

    return minDist > distance ? undefined : nextColumn
  }

  function check (node, currColumn, column, path) {
    for (const subNode in node) {
      if (subNode === '_' && currColumn[baseLength - 1] <= distance) {
        results.push(path)
      } else {
        const nextColumn = getNextColumn(currColumn, column, subNode)
        if (nextColumn) {
          check(node[subNode], nextColumn, column + 1, path + subNode)
        }
      }
    }
  }

  check(trie, initColumn, 0, '')
  return results.sort()
}

function suggest (string, max = 6) {
  if (authors[string]) {
    return [ string ]
  }
  for (let dist = 1; dist <= max; ++dist) {
    const suggestions = suggest1(string, dist)
    if (suggestions.length) {
      return suggestions
    }
  }
  return []
}

module.exports = {
  authors,
  findPaths,
  getFullTree,
  enumeratePaths,
  suggest,
  suggest1
}
