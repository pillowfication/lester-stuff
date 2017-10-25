const path = require('path')
const moment = require('moment')
const CronJob = require('cron').CronJob
const scrape = require('./scrape')
const toCsv = require('./to-csv')

const scrapeStart = 0
const scrapeEnd = 2000000
const scrapeChunk = 100

const autoScrape = new CronJob('0 0 * * 1', () => {
  const now = moment().format('YYYY-MM-DD_HH-mm')
  console.log(`Scraping for: ${now}`)
  const outputPath = path.join(__dirname, 'data', now + '.json')
  console.log(`  Output: ${outputPath}`)
  const logPath = path.join(__dirname, 'data', now + '.log')
  console.log(`  Log: ${logPath}`)

  scrape(scrapeStart, scrapeEnd, scrapeChunk, outputPath, logPath)
    .then(() => {
      console.log('Done scraping.')
      console.log('Converting to CSV...')
      return toCsv(outputPath)
    })
    .then(csvPath => {
      console.log(`CSV written to: ${csvPath}`)
    })
    .catch(error => {
      console.error(error)
    })
})

autoScrape.start()

module.exports = autoScrape
