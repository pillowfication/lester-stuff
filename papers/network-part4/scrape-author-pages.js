const _ = require('lodash')
const fs = require('fs')
const path = require('path')
const request = require('./request')
const cheerio = require('cheerio')
const bigJson = require('big-json')

const BASE_URL = 'https://econpapers.repec.org'
const BATCH_SIZE = 10

const output = path.resolve(__dirname, './data2/other-papers.json')
;(async () => {
  try {
    fs.accessSync(output)
    console.log(`${output} already exists. Skipping...`)
  } catch (err) {
    let network = require('./network')
    const urls = Object.keys(network.authors).filter(key => network.authors[key].url)
    network = undefined
    const journal = {}

    let counter = 0
    for (const batch of _.chunk(urls, BATCH_SIZE)) {
      if (counter % 10 === 0) {
        console.log(`${counter * BATCH_SIZE}/${urls.length}`)
      }
      ++counter

      await Promise.all(batch.map(url => (async () => {
        const $ = cheerio.load(await request(BASE_URL + url))
        journal[url] = []

        $('h3').each((index, h3) => {
          const $h3 = $(h3)
          const year = Number($h3.text()) || undefined
          $h3.next().find('li').each((index, li) => {
            const $a = $(li).find('a')
            journal[url].push({ title: $a.text(), url: $a.attr('href'), year })
          })
        })
      })()))
    }

    console.log('==== WRITING TO FILE ====')
    await (async () => new Promise((resolve, reject) => {
      const stringifyStream = bigJson.createStringifyStream({
        body: journal
      })
      stringifyStream.pipe(fs.createWriteStream(output))
      stringifyStream.on('end', resolve)
      stringifyStream.on('error', reject)
    }))()
  }
})()
