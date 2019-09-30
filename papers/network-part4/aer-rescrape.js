const fs = require('fs')
const path = require('path')
const request = require('./request')
const cheerio = require('cheerio')

const BASE_URL = 'https://econpapers.repec.org'

async function getJournalPage (journalId, page) {
  try {
    const $ = cheerio.load(await request(`${BASE_URL}/article/${journalId}/default${page || ''}.htm`))

    const firstHeader = $('h1.colored').first()
    if (firstHeader.text() === 'Error: 404 Not Found') {
      return null
    }

    const papers = []
    $('.bodytext b').each((_, b) => {
      let year, issue
      try {
        ({ year, issue } = parseVIY($(b).text()))
      } catch (e) {
        console.log('UNKNOWN FORMAT')
        console.log($(b).text())
        console.log(journalId, page)
      }

      $(b).parent().next().children('dt').each((_, dt) => {
        papers.push({
          title: dt.children[0].children[0] ? dt.children[0].children[0].data : '',
          url: dt.children[0].attribs.href,
          authors: $(dt).next().children('i').map((_, i) => $(i).text().trim()).get(),
          year,
          issue
        })
      })
    })

    return papers
  } catch (error) {
    console.log(`Something errored at URL: ${BASE_URL}/article/${journalId}/default${page || ''}.htm`)
    console.log(error)
  }
}

async function getJournal (journalId) {
  const $ = cheerio.load(await request(`${BASE_URL}/article/${journalId}/`))
  const journal = {
    id: journalId,
    title: $('h1.colored').first().text(),
    papers: []
  }

  for (let page = 0; ; ++page) {
    console.log(journalId + ': ' + page)
    const data = await getJournalPage(journalId, page)
    if (!data) {
      break
    } else {
      journal.papers = journal.papers.concat(data)
    }
  }

  return journal
}

function parseVIY (str) {
  str = str.trim()
  let match, volume, issue, year

  /* eslint-disable no-cond-assign, no-regex-spaces */
  if (match = str.match(/^([0-9]+), issue ([0-9a-z., _()-]+), vol ([0-9]+)$/i)) {
    [, year, issue, volume] = match
  } else if (match = str.match(/^([0-9]+),  volume ([0-9]+), issue (?:number)?([0-9a-z., _()-]+)$/i)) {
    [, year, volume, issue] = match
  } else if (match = str.match(/^volume (?:volume_? ?)?([0-9a-z. -]+), issue (?:number ?)?([0-9a-z., _()#-]+), ([0-9]+)$/i)) {
    [, volume, issue, year] = match
  } else if (match = str.match(/^([0-9]+), issue (?:number)?([0-9a-z., _()-]+)$/i)) {
    [, year, issue] = match
    volume = '-1'
  } else if (match = str.match(/^([0-9]+),  volume ([0-9-]+)$/i)) {
    [, year, volume] = match
    issue = '-1'
  } else if (match = str.match(/^volume ([0-9]+), issue (?:number )?([0-9a-z., _()-]+)$/i)) {
    [, volume, issue] = match
    year = '-1'
  } else if (match = str.match(/^volume ([0-9]+)$/i)) {
    [, volume] = match
    year = '-1'
    issue = '-1'
  } else if (match = str.match(/^undated$/i)) {
    volume = '-1'
    year = '-1'
    issue = '-1'
  } else {
    throw new Error('oops')
  }
  /* eslint-enable no-cond-assign, no-regex-spaces */

  return { volume, issue, year }
}

;(async () => {
  for (const { id: journalId } of [{ id: 'aeaaecrev' }]) {
    const filename = path.resolve(__dirname, `./data/WOW-${journalId}.json`)
    console.log()

    try {
      fs.accessSync(filename)
      console.log(journalId + ': File already exists. Skipping...')
    } catch (err) {
      console.log(journalId + ': Scraping...')
      const data = await getJournal(journalId)
      console.log(journalId + ': Writing...')
      fs.writeFileSync(filename, JSON.stringify(data))
    }
  }
})()
