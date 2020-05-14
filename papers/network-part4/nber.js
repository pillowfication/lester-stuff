const fs = require('fs')
const path = require('path')
const request = require('./request')
const cheerio = require('cheerio')

;(async () => {
  const results = {}

  try {
    const $ = cheerio.load(await request('https://www.nber.org/programs/program_members.html'))
    const links = $('.mobile-block-full-width > a').map((_, elem) =>
      'https://www.nber.org' + $(elem).attr('href')
    ).get()
    for (const link of links) {
      const $ = cheerio.load(await request(link))
      $('#mainContentTd tr').each((index, elem) => {
        if (index === 0) return

        const $elem = $(elem)
        const name = $elem.find('td:nth-child(1) > a').text()
        const date = $elem.find('td:nth-child(3)').text()

        results[name] = Number(date.substr(0, 4))
      })
    }
  } catch (err) {
    console.log(err)
  }

  fs.writeFileSync(path.resolve(__dirname, './data/nber.json'), JSON.stringify(results))
})()
