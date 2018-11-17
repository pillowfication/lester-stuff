const request = require('request')
const cheerio = require('cheerio')
const jsonfile = require('jsonfile')
const journalList = require('./journals.json')

const BASE_URL = 'https://econpapers.repec.org/article'

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
  const html = await requestGet(`${BASE_URL}/${journalId}/default${page || ''}.htm`)
  const $ = cheerio.load(html)

  const firstHeader = $('h1.colored').first()
  if (firstHeader.text() === 'Error: 404 Not Found') {
    return null
  }

  const data = []
  $('.bodytext b').each((_, b) => {
    const [ volume, issue ] = b.children[0].attribs.name.split(':').map(s => s.substring(1))
    // const year = b.children[1].data.substring(2)
    const papers = []
    $(b).parent().next().children('dt').each((_, dt) => {
      papers.push({
        title: dt.children[0].children[0].data,
        authors: $(dt).next().children('i').map((_, i) => $(i).text()).get()
      })
    })

    data.push({ volume, issue, /* year, */ papers })
  })

  return data
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
        volume[chunk.issue] = chunk.papers
      }
    }
  }

  return journal
}

function getAllJournals () {
  Promise.all(journalList.map(journal => getJournal(journal.id)))
    .then(data => {
      try {
        jsonfile.writeFileSync('data.json', data, { spaces: 2 })
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
