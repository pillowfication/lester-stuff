const _ = require('lodash')
const fs = require('fs')
const path = require('path')
const request = require('./request')
const cheerio = require('cheerio')

const { journals, working_papers: workingPapers } = require('./journals.json')
const BASE_URL = 'https://econpapers.repec.org'
const REQUEST_BATCH_SIZE = 20

function getPaperUrl (journalId, paperUrl, isWorkingPapers) {
  return `${BASE_URL}/${isWorkingPapers ? 'papers' : 'article'}/${journalId}/${paperUrl}`
}

async function doTheScrape (journalData, isWorkingPapers) {
  let counter = 0
  for (const batch of _.chunk(journalData.papers, REQUEST_BATCH_SIZE)) {
    if (counter % 10 === 0) {
      console.log(`${journalData.id}: ${counter * REQUEST_BATCH_SIZE}/${journalData.papers.length}`)
    }
    ++counter

    const pages = await Promise.all(batch.map(paper => request(getPaperUrl(journalData.id, paper.url))))
    pages.forEach((page, pageIndex) => {
      const $ = cheerio.load(page)
      batch[pageIndex].authors =
        $('h1.colored').next().find('i').map((_, i) => ({
          url: $(i).find('a').attr('href'),
          name: $(i).text()
        })).get()
    })
  }
}

;(async () => {
  let journalCounter = 0
  for (const { id: journalId } of journals) {
    console.log()
    console.log(`Starting ${journalId} (${journalCounter}/${journals.length})`)
    ++journalCounter

    const output = path.resolve(__dirname, `./data2/j-${journalId}.json`)
    try {
      fs.accessSync(output)
      console.log(journalId + ': File already exists. Skipping...')
    } catch (err) {
      const journalData = require(`./data/j-${journalId}.json`)
      await doTheScrape(journalData)
      fs.writeFileSync(output, JSON.stringify(journalData))
    }
  }

  let workingPapersCounter = 0
  for (const { id: workingPapersId } of workingPapers) {
    console.log()
    console.log(`Starting ${workingPapersId} (${workingPapersCounter}/${workingPapers.length})`)
    ++workingPapersCounter

    const output = path.resolve(__dirname, `./data2/wp-${workingPapersId}.json`)
    try {
      fs.accessSync(output)
      console.log(workingPapersId + ': File already exists. Skipping...')
    } catch (err) {
      const workingPapersData = require(`./data/wp-${workingPapersId}.json`)
      await doTheScrape(workingPapersData)
      fs.writeFileSync(output, JSON.stringify(workingPapersData))
    }
  }
})()
