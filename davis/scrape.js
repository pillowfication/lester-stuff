const util = require('util')
const fs = require('fs')
const path = require('path')
const winston = require('winston')
const request = require('request')
const cheerio = require('cheerio')
const moment = require('moment')

const writeFile = util.promisify(fs.writeFile)
const appendFile = util.promisify(fs.appendFile)

const BASE_URL = 'http://directory.ucdavis.edu/search/directory_results.shtml'
const NOW = moment().format('YYYY-MM-DD_HH-mm')
const OUTPUT = path.join(__dirname, 'data', `${NOW}.json`)
const LOGFILE = path.join(__dirname, 'data', `${NOW}.log`)

function pad (id) {
  return ('00000000' + id).slice(-8)
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

async function getPage (id) {
  const html = await requestGet(`${BASE_URL}?id=${pad(id)}`)
  const $ = cheerio.load(html)

  const table = $('#directory_results_wrapper > table').first()
  if (table.get().length === 0) {
    // `null` means `id` was not found
    return null
  }

  const data = { id }
  table.find('tr').each((index, row) => {
    const first = $(row).children().first()
    data[first.text()] = first.next().text()
  })

  return data
}

async function getPages (start, count) {
  const promises = []
  for (let index = 0; index < count; ++index) {
    promises[index] = getPage(start + index)
  }

  return Promise.all(promises)
}

async function scrape (start = 0, end = 99999999, chunk = 500, outputPath = OUTPUT, logPath = LOGFILE) {
  const startTime = Date.now()
  const logger = new (winston.Logger)({
    transports: [ new (winston.transports.File)({ filename: logPath }) ]
  })

  logger.info(`Scraping to file: ${outputPath}`)
  logger.info(`  start: ${start}`)
  logger.info(`  end:   ${end}`)
  logger.info(`  chunk: ${chunk}`)
  logger.info('==========')

  await writeFile(outputPath, '')

  const keys = {}
  function cleanData (data) {
    const clean = {}
    for (const key in data) {
      const cleanKey = key.toLowerCase().replace(/[^a-z]+/g, '')
      let keySet = keys[cleanKey]
      if (!keySet) {
        keySet = keys[cleanKey] = new Set()
      }
      keySet.add(key)
      clean[cleanKey] = data[key]
    }
    return clean
  }

  for (let currentId = start; currentId <= end; currentId += chunk) {
    let _chunk = Math.max(1, Math.min(chunk, end - currentId))
    logger.info(`Scraping: ${pad(currentId)} - ${pad(currentId + _chunk - 1)}`)

    let results
    do {
      try {
        results = await getPages(currentId, _chunk)
      } catch (error) {
        logger.error('Error scraping pages', error)
        logger.info('Trying again')
      }
    } while (!results)

    const found = results.filter(x => x).map(cleanData)
    logger.info(found.length
      ? `Found ids: ${found.map(data => data.id).join(', ')}`
      : `Found ids: (none)`
    )

    await appendFile(outputPath,
      found.map(data => JSON.stringify(data) + '\n').join('')
    )
  }

  const metaData = {
    startTime,
    endTime: Date.now(),
    keys: (() => {
      const _keys = {}
      for (const key in keys) {
        _keys[key] = Array.from(keys[key])
      }
      return _keys
    })(),
    logFile: logPath
  }
  await writeFile(outputPath + '.tag',
    JSON.stringify(metaData, null, 2) + '\n'
  )

  logger.info('Done.')
}

module.exports = scrape
