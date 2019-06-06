const fs = require('fs')
const path = require('path')
const request = require('request')
const cheerio = require('cheerio')
const stringify = require('csv-stringify')

async function requestGet (url) {
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

const BY_NAME = 'http://www.jhowell.net/cf/scores/byname.htm'
async function getAllLinks () {
  const html = await requestGet(BY_NAME)
  const $ = cheerio.load(html)

  // Get all links between the first and second <hr>
  return $('hr').next().find('a').map((_, a) => {
    const $a = $(a)
    return {
      url: $a.attr('href'),
      text: $a.text()
    }
  }).get()
}

const BASE_URL = 'http://www.jhowell.net/cf/scores'
let additionalsFound = 0
async function scrapePage (url) {
  const html = await requestGet(`${BASE_URL}/${url}`)
  const $ = cheerio.load(html)

  const tables = []
  $('table').each((index, table) => {
    // First table is always the key
    if (index === 0) return

    const data = { rows: [] }
    const rows = $(table).find('tr')
    rows.each((index, tr) => {
      const $tr = $(tr)
      if (index === 0) {
        data.header = $tr.text()
      } else if (index === rows.length - 1) {
        const tds = $tr.find('td')
        data.footer_1 = tds.eq(1).text()
        data.footer_2 = tds.eq(3).text()
        data.footer_3 = tds.eq(4).text()
      } else {
        const tds = $tr.find('td')
        const rowData = {
          date: tds.eq(0).text(),
          date_color: getColor(tds.eq(0)),
          at: tds.eq(1).text(),
          at_color: getColor(tds.eq(1)),
          team: tds.eq(2).text(),
          team_link: tds.eq(2).find('a').attr('href'),
          team_color: getColor(tds.eq(2)),
          result: tds.eq(3).text(),
          result_color: getColor(tds.eq(3)),
          score_1: tds.eq(4).text(),
          score_1_color: getColor(tds.eq(4)),
          score_2: tds.eq(5).text(),
          score_2_color: getColor(tds.eq(5))
        }
        tds.each((index, td) => {
          if (index > 5) {
            const $td = $(td)
            rowData[`additional_${index - 5}`] = $td.text()
            rowData[`additional_${index - 5}_color`] = getColor($td)
            additionalsFound = Math.max(additionalsFound, index - 5)
          }
        })
        data.rows.push(rowData)
      }
    })
    tables.push(data)
  })
  return tables
}

const map = {
  '#00FF00': 'green',
  '#FFFF00': 'yellow',
  '#FF0000': 'red'
}
function getColor (elem) {
  return map[elem.attr('bgcolor')] || 'white'
}

const OUTPUT = path.resolve(__dirname, './data/ncaa.csv')
function toCsv (data) {
  let columns = [
    'link_url',
    'link_text',
    'table_header',
    'date',
    'date_color',
    'at',
    'at_color',
    'team',
    'team_link',
    'team_color',
    'result',
    'result_color',
    'score_1',
    'score_1_color',
    'score_2',
    'score_2_color'
  ]
  for (let i = 1; i <= additionalsFound; ++i) {
    columns = columns.concat([`additional_${i}`, `additional_${i}_color`])
  }
  columns = columns.concat([
    'table_footer_1',
    'table_footer_2',
    'table_footer_3'
  ])
  columns = columns.reduce((acc, curr) => {
    acc[curr] = curr
    return acc
  }, {})

  const csv = []
  for (const page of data) {
    for (const table of page.tables) {
      for (const row of table.rows) {
        csv.push(Object.assign({
          link_url: page.url,
          link_text: page.text,
          table_header: table.header,
          table_footer_1: table.footer_1,
          table_footer_2: table.footer_2,
          table_footer_3: table.footer_3
        }, row))
      }
    }
  }

  stringify(csv, { header: true, columns: columns }, (_, output) => {
    fs.writeFileSync(OUTPUT, output)
  })
}

;(async () => {
  const links = await getAllLinks()
  const pages = []
  let counter = 0
  for (const link of links) {
    console.log(`${++counter}/${links.length}`, link.text)
    const tables = await scrapePage(link.url)
    pages.push({
      text: link.text,
      url: link.url,
      tables
    })
  }

  toCsv(pages)
})()
