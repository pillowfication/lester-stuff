const util = require('util')
const path = require('path')
const fs = require('fs')
const moment = require('moment')
const CronJob = require('cron').CronJob
const scrape = require('./scrape')
const toCsv = require('./to-csv')
const archive = require('./archive')
const unlink = util.promisify(fs.unlink)

const SCRAPE_START = 0
const SCRAPE_END = 2000000
const SCRAPE_CHUNK = 500

const autoScrape = new CronJob('0 0 * * 1,3,5', () => {
  const now = moment().format('YYYY-MM-DD')
  console.log(`Scraping for: ${now}`)
  const outputPath = path.join(__dirname, 'data', now + '.json')
  console.log(`  Output: ${outputPath}`)
  const logPath = path.join(__dirname, 'data', now + '.log')
  console.log(`  Log: ${logPath}`)
  const csvPath = path.join(__dirname, 'data', now + '.csv')
  console.log(`  CSV: ${csvPath}`)
  const archivePath = path.join(__dirname, 'data', now + '.zip')
  console.log(`  Archive: ${archivePath}`)

  const files = [
    outputPath,
    outputPath + '.tag',
    logPath,
    csvPath
  ]

  scrape(SCRAPE_START, SCRAPE_END, SCRAPE_CHUNK, outputPath, logPath)
    .then(() => {
      console.log('Done scraping.')
      console.log('Converting to CSV...')
      return toCsv(outputPath, csvPath)
    })
    .then(() => {
      console.log('CSV created.')
      console.log('Creating archive...')
      return archive(files, archivePath)
    })
    .then(() => {
      console.log('Archive created.')
      console.log('Removing files...')
      return Promise.all(files.map(file => unlink(file)))
    })
    .then(() => {
      console.log('All done!')
    })
    .catch(error => {
      console.error(error)
    })
})

autoScrape.start()

module.exports = autoScrape
