// const fs = require('fs')
// const path = require('path')
const request = require('request')
const cheerio = require('cheerio')
const jsonfile = require('jsonfile')
// const csvStringify = require('csv-stringify')
const journalList = require('./journals.json')

const BASE_URL = 'https://econpapers.repec.org/article'
// const OUTPUT_PATH = path.resolve(__dirname, './data.csv')

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

function requestGet (url) {
  return new Promise((resolve, reject) => {
    request.get(url, (error, response, body) => {
      if (error || !body) {
        reject(error || new Error(`Could not load url: ${url}`))
      } else {
        resolve(body)
      }
    })
  })
}

async function getPage (journalId, page) {
  try {
    const html = await requestGet(`${BASE_URL}/${journalId}/default${page || ''}.htm`)
    const $ = cheerio.load(html)

    const firstHeader = $('h1.colored').first()
    if (firstHeader.text() === 'Error: 404 Not Found') {
      return null
    }

    const data = []
    $('.bodytext b').each((_, b) => {
      let volume, issue, year
      try {
        ({ volume, issue, year } = parseVIY($(b).text()))
      } catch (e) {
        console.log('UNKNOWN FORMAT')
        console.log($(b).text())
        console.log(journalId, page)
      }

      const papers = []
      $(b).parent().next().children('dt').each((_, dt) => {
        papers.push({
          title: dt.children[0].children[0] ? dt.children[0].children[0].data : '',
          url: `${BASE_URL}/${journalId}/${dt.children[0].attribs.href}`,
          authors: $(dt).next().children('i').map((_, i) => $(i).text()).get()
        })
      })

      data.push({ volume, issue, year, papers })
    })

    return data
  } catch (error) {
    console.log(`Something errored at URL: ${BASE_URL}/${journalId}/default${page || ''}.htm`)
    console.log(error)
  }
}

async function getJournal (journalId) {
  const html = await requestGet(`${BASE_URL}/${journalId}/`)
  const $ = cheerio.load(html)
  const journal = {
    id: journalId,
    title: $('h1.colored').first().text(),
    contents: {}
  }

  for (let page = 0; ; ++page) {
    const data = await getPage(journalId, page)
    if (!data) {
      break
    } else {
      for (const chunk of data) {
        const volume = journal.contents[chunk.volume] || (journal.contents[chunk.volume] = {})
        volume[chunk.issue] = {
          year: chunk.year,
          papers: chunk.papers
        }
      }
    }
  }

  return journal
}

function getAllJournals () {
  console.log('starting scrape')
  const start = Date.now()

  Promise.all(journalList.map(journal => getJournal(journal.id)))
    .then(data => {
      // const csv = []
      // const columns = {
      //   journal: 'Journal',
      //   journalId: 'Journal ID',
      //   volume: 'Volume',
      //   issue: 'Issue',
      //   year: 'Year of Issue',
      //   title: 'Paper Title',
      //   url: 'URL',
      //   author: 'Name of Author'
      // }
      //
      // for (const journal of data) {
      //   for (const volume of Object.keys(journal.contents).sort()) {
      //     for (const issue of Object.keys(journal.contents[volume]).sort()) {
      //       for (const paper of journal.contents[volume][issue].papers) {
      //         for (const author of paper.authors) {
      //           csv.push({
      //             journal: journal.title,
      //             journalId: journal.id,
      //             volume,
      //             issue,
      //             year: journal.contents[volume][issue].year,
      //             title: paper.title,
      //             url: paper.url,
      //             author: author
      //           })
      //         }
      //       }
      //     }
      //   }
      // }
      //
      // csvStringify(csv, { header: true, columns }, (error, csv) => {
      //   if (error) {
      //     console.log('Couldn\'t csv-stringify...')
      //   } else {
      //     fs.writeFileSync(OUTPUT_PATH, csv)
      //     console.log(`Wrote to ${OUTPUT_PATH}`)
      //     console.log(`Time taken: ${((Date.now() - start) / 1000).toFixed(2)}s`)
      //   }
      // })

      try {
        jsonfile.writeFileSync('data.json', data, { spaces: 2 })
        console.log('Wrote to `data.json`')
        console.log(`Time taken: ${((Date.now() - start) / 1000).toFixed(2)}s`)
      } catch (_error) {
        console.log('Error creating `data.json`. Please try again.')
        console.log(_error)
      }
    })
    .catch(error => {
      console.log('SOMETHING BAD HAPPENED')
      console.log(error)
    })
}

module.exports = getAllJournals
getAllJournals()
