const fs = require('fs')
const path = require('path')
const bigJson = require('big-json')
const nameMatches = require('./name-matches')

const { journals, working_papers: workingPapers } = require('./journals.json')

let authors = {}
let papers = {}
let seenNames = []

function addJournal (journalData, isWorkingPaper) {
  console.log()
  console.log(`Adding ${isWorkingPaper ? 'working papers' : 'journal'} ${journalData.id}...`)
  let counter = 0

  for (const paper of journalData.papers) {
    if (counter % 1000 === 0) {
      console.log(`${counter}/${journalData.papers.length} (${seenNames.length} names)`)
    }
    ++counter

    if (papers[paper.url]) {
      console.log(` - Duplicate paper: ${paper.url}`)
      break
    }
    papers[paper.url] = { authors: [] }

    for (const author of paper.authors) {
      if (author.url) {
        const { url, name } = author

        let match = authors[url]
        if (!match) {
          match = { url: true, aliases: [ name ], papers: [] }
          authors[url] = match
        } else if (!match.aliases.includes(name)) {
          match.aliases.push(name)
        }

        // Register paper
        papers[paper.url].authors.push(url)
        match.papers.push({ url: paper.url, year: paper.year })
      } else {
        const { name } = author

        // Find matching name
        let match, matchedName
        if (authors[`_AUTH_${name}`]) {
          match = authors[`_AUTH_${name}`]
          matchedName = name
        } else {
          for (const seenName of seenNames) {
            if (nameMatches(seenName, name)) {
              match = authors[`_AUTH_${seenName}`]
              matchedName = seenName
              break
            }
          }
        }
        if (!match) {
          match = { url: false, aliases: [ name ], papers: [] }
          authors[`_AUTH_${name}`] = match
          seenNames.push(name)
          matchedName = name
        } else if (!match.aliases.includes(name)) {
          match.aliases.push(name)
        }

        // Register paper
        papers[paper.url].authors.push(`_AUTH_${matchedName}`)
        match.papers.push({ url: paper.url, year: paper.year })
      }
    }
  }
}

function getJournal (journalId) {
  const journalData = require(`./data/j-${journalId}.json`)
  for (const paper of journalData.papers) {
    paper.year = Number(paper.year) > 0 ? Number(paper.year) : -1
    // paper.authors = paper.authors.map(authorName => ({ name: authorName, url: undefined }))
    paper.url = journalId + '/' + paper.url
    delete paper.title
  }
  return journalData
}

const THRESHOLDS = {
  cprceprdp: [
    { year: 1999, series: 2344 },
    { year: 2000, series: 2656 },
    { year: 2001, series: 3157 },
    { year: 2002, series: 4137 },
    { year: 2003, series: 4840 },
    { year: 2004, series: 5442 },
    { year: 2005, series: 6028 },
    { year: 2006, series: 6663 },
    { year: 2007, series: 7117 },
    { year: 2008, series: 7617 },
    { year: 2009, series: 8173 },
    { year: 2010, series: 8804 },
    { year: 2011, series: 9270 },
    { year: 2012, series: 9787 },
    { year: 2013, series: 10324 },
    { year: 2014, series: 11033 },
    { year: 2015, series: 11735 },
    { year: 2016, series: 11735 },
    { year: 2017, series: 12551 },
    { year: 2018, series: 13422 },
    { year: 2019, series: Number.MAX_SAFE_INTEGER }
  ],
  izaizadps: [
    { year: 1998, series: 27 },
    { year: 1999, series: 100 },
    { year: 2000, series: 238 },
    { year: 2001, series: 413 },
    { year: 2002, series: 681 },
    { year: 2003, series: 975 },
    { year: 2004, series: 1449 },
    { year: 2005, series: 1910 },
    { year: 2006, series: 2537 },
    { year: 2007, series: 3271 },
    { year: 2008, series: 3917 },
    { year: 2009, series: 4680 },
    { year: 2010, series: 5418 },
    { year: 2011, series: 6268 },
    { year: 2012, series: 7120 },
    { year: 2013, series: 7879 },
    { year: 2014, series: 8754 },
    { year: 2015, series: 9620 },
    { year: 2016, series: 10465 },
    { year: 2017, series: 11254 },
    { year: 2018, series: 12062 },
    { year: 2019, series: Number.MAX_SAFE_INTEGER }
  ],
  nbrnberwo: [
    { year: 1973, series: 25 },
    { year: 1974, series: 72 },
    { year: 1975, series: 118 },
    { year: 1976, series: 159 },
    { year: 1977, series: 226 },
    { year: 1978, series: 307 },
    { year: 1979, series: 418 },
    { year: 1980, series: 612 },
    { year: 1981, series: 831 },
    { year: 1982, series: 1053 },
    { year: 1983, series: 1254 },
    { year: 1984, series: 1530 },
    { year: 1985, series: 1784 },
    { year: 1986, series: 2115 },
    { year: 1987, series: 2478 },
    { year: 1988, series: 2807 },
    { year: 1989, series: 3218 },
    { year: 1990, series: 3573 },
    { year: 1991, series: 3945 },
    { year: 1992, series: 4248 },
    { year: 1993, series: 4606 },
    { year: 1994, series: 4981 },
    { year: 1995, series: 5402 },
    { year: 1996, series: 5868 },
    { year: 1997, series: 6345 },
    { year: 1998, series: 6869 },
    { year: 1999, series: 7454 },
    { year: 2000, series: 8061 },
    { year: 2001, series: 8696 },
    { year: 2002, series: 9407 },
    { year: 2003, series: 10623 },
    { year: 2004, series: 11017 },
    { year: 2005, series: 11908 },
    { year: 2006, series: 12813 },
    { year: 2007, series: 13716 },
    { year: 2008, series: 14629 },
    { year: 2009, series: 15629 },
    { year: 2010, series: 16654 },
    { year: 2011, series: 17719 },
    { year: 2012, series: 18664 },
    { year: 2013, series: 19774 },
    { year: 2014, series: 20819 },
    { year: 2015, series: 21839 },
    { year: 2016, series: 23015 },
    { year: 2017, series: 24179 },
    { year: 2018, series: 25415 },
    { year: 2019, series: Number.MAX_SAFE_INTEGER }
  ]
}

function getWorkingPapers (workingPapersId) {
  const workingPapersData = require(`./data/wp-${workingPapersId}.json`)
  for (const paper of workingPapersData.papers) {
    switch (workingPapersId) {
      case 'arxpapers':
        paper.year = Number(paper.series)
        break
      case 'cprceprdp':
      case 'izaizadps':
      case 'nbrnberwo':
        const series = Number(paper.series)
        for (const thresh of THRESHOLDS[workingPapersId]) {
          if (series <= thresh.series) {
            paper.year = thresh.year
            break
          }
        }
        break
    }
    // paper.authors = paper.authors.map(authorName => ({ name: authorName, url: undefined }))
    paper.url = workingPapersId + '/' + paper.url
    delete paper.title
    delete paper.series
  }
  return workingPapersData
}

const output = path.resolve(__dirname, './data/network 12-55-24-919.json')
try {
  fs.accessSync(output)
  console.log(`Building from ${output}`)
  ;({ authors, papers, seenNames } = require(output))
} catch (err) {
  for (const journal of journals) {
    addJournal(getJournal(journal.id))
  }
  for (const workingPaper of workingPapers) {
    addJournal(getWorkingPapers(workingPaper.id), true)
  }
  console.log('Done!')

  try {
    console.log('==== WRITING TO FILE ====')
    ;(async () => new Promise((resolve, reject) => {
      const stringifyStream = bigJson.createStringifyStream({
        body: { authors, papers, seenNames }
      })
      stringifyStream.pipe(fs.createWriteStream(output))
      stringifyStream.on('end', resolve)
      stringifyStream.on('error', reject)
    }))()
  } catch (err) {
    console.log(err)
  }
}

module.exports = {
  authors,
  papers,
  seenNames
}
