const fs = require('fs')
const url = require('url')
const path = require('path')
const moment = require('moment')
const cheerio = require('cheerio')
const Crawler = require('simplecrawler')

const DATE = '2020-05-12' || moment().format('YYYY-MM-DD')

function crawlSite (initialUrl, i, l) {
  return new Promise((resolve, reject) => {
    const crawl = new Crawler(initialUrl)
    Object.assign(crawl, {
      // interval: 100,
      maxConcurrency: 5,
      maxDepth: 10
    })

    const domain = url.parse(initialUrl).hostname
    const domainRegex = new RegExp('^https?://' + domain, 'i')
    const archiveDirectory = path.join(__dirname, 'archive', DATE, domain)
    const archiveDomain = 'http://wayback.pf-n.co/archive/' + DATE + '/' + domain

    crawl.on('fetchcomplete', (queueItem, responseBuffer, response) => {
      const parsedUrl = url.parse(queueItem.url)
      if (parsedUrl.pathname.slice(-1) === '/') {
        parsedUrl.pathname += 'index.html'
      }

      const dirname = archiveDirectory + parsedUrl.pathname.replace(/\/[^/]+$/, '')
      const filepath = archiveDirectory + parsedUrl.pathname

      if (/text\/html/.test(response.headers['content-type'])) {
        const $ = cheerio.load(responseBuffer.toString())
        $('link, script, a, img').each((_, a) => {
          const $a = $(a)
          ;['href', 'src'].forEach(urlAttr => {
            const href = $a.attr(urlAttr)
            if (href) {
              $a.attr(urlAttr, href.replace(domainRegex, archiveDomain))
            }
          })
        })
        responseBuffer = $.html()
      }

      fs.exists(dirname, exists => { // eslint-disable-line
        if (exists) {
          fs.writeFile(filepath, responseBuffer, () => {})
        } else {
          fs.mkdir(dirname, { recursive: true, mode: 0o755 }, () => {
            fs.writeFile(filepath, responseBuffer, () => {})
          })
        }
      })

      console.log(i + '/' + l, queueItem.url, responseBuffer.length)
    })

    crawl.on('complete', resolve)
    crawl.start()
  })
}

//
//
//

const textFile = fs.readFileSync(path.resolve(__dirname, './websites.txt'))
const textRows = textFile.toString().split('\n')
textRows.pop()

const header = textRows.shift().split('|')
const rows = textRows.map(row => {
  const data = row.split('|')
  const datum = {}
  for (let index = 0; index < header.length; ++index) {
    datum[header[index]] = data[index]
  }
  return datum
})

;(async () => {
  const BATCH_SIZE = 1
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = []
    for (let j = 0; j < BATCH_SIZE && i + j < rows.length; ++j) {
      const row = rows[i + j]
      if (row.website && row.website !== 'No Data') {
        batch.push(crawlSite(row.website, i + j, rows.length))
      }
    }
    await Promise.all(batch)
  }
})()
