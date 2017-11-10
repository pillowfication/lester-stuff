const jsonfile = require('jsonfile')
const async = require('async')
const request = require('request')
const cheerio = require('cheerio')

const BASE_URL = 'http://collegepollarchive.com/football/ap/seasons.cfm?appollid='

function requestId (id, callback) {
  request.get(`${BASE_URL}${id}`, (error, _, html) => {
    if (error) {
      return callback(error)
    }

    const $ = cheerio.load(html, { normalizeWhitespace: true })

    const heading = $('h2').filter((index, h2) => {
      return /Football Poll$/.test($(h2).text())
    })

    const table = heading.nextAll('table').eq(0)

    if (!table.length) {
      callback(new Error('Could not find the table of data.'))
    } else {
      callback(null, {
        heading: heading.text(),
        table: parseTable($, table)
      })
    }
  })
}

function parseTable ($, table) {
  const thData = []
  $('tr', table).eq(0).children('th').each((index, th) => {
    thData.push({
      text: $(th).text(),
      span: +$(th).attr('colspan') || 1
    })
  })

  const cols = thData.reduce((sum, th) => sum + th.span, 0)
  const data = []

  $('tr', table).each((index, tr) => {
    const tds = $('td', tr)
    if (tds.length !== cols) {
      return
    }

    const datum = {}
    let td = 0
    thData.forEach(th => {
      if (th.span === 1) {
        datum[th.text] = tds.eq(td).text().trim()
        ++td
      } else {
        datum[th.text] = []
        for (let inc = 0; inc < th.span; ++inc) {
          datum[th.text].push(tds.eq(td + inc).text().trim())
        }
        td += th.span
      }
    })
    data.push(datum)
  })

  return data
}

const [ start, end ] = [ 671, 1103 ]
async.timesSeries(end - start + 1, (inc, next) => {
  const id = start + inc
  console.log(`Fetching id: ${id}...`)
  requestId(id, next)
}, (error, results) => {
  if (error) {
    console.log('SOMETHING BAD HAPPENED')
    console.log(error)
  } else {
    const data = {}
    results.forEach((result, index) => {
      data[start + index] = result
    })
    try {
      jsonfile.writeFileSync('data.json', data, { spaces: 2 })
    } catch (_error) {
      console.log('Error creating `data.json`. Please try again.')
      console.log(_error)
    }
  }
})
