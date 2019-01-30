const fs = require('fs')
const path = require('path')
const querystring = require('querystring')
const request = require('request')
const cheerio = require('cheerio')
const csvParse = require('csv-parse/lib/sync')

const BASE_URL = 'https://google.com'

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

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

async function getGoogleSearchResults (query) {
  // Remember to turn off JS when testing manually
  const url = `${BASE_URL}/search?q=${querystring.escape(query)}`
  try {
    const html = await requestGet(url)
    const $ = cheerio.load(html)

    const results = $('div.g').map((i, elem) => {
      elem = $(elem)
      return {
        url: elem.find('h3.r > a').attr('href'),
        url_text: elem.find('h3.r > a').text(),
        location: elem.find('div.f.slp').text(),
        preview: elem.find('span.st').text(),
        raw_html: elem.html()
      }
    }).get()

    return results
  } catch (error) {
    console.log(`Something errored at URL: ${url}`)
    console.log(error)
  }
}

async function scrape () {
  const STUDENTS_FILE = path.resolve(__dirname, './data/student_names.csv')
  const RESULTS_FILE = path.resolve(__dirname, './data/results.json')
  const studentNames = csvParse(fs.readFileSync(STUDENTS_FILE), { columns: true })

  const START_INDEX = process.argv[2] || 0
  const TIME_DELAY = 1000
  const linkedInRegex = /^\/url\?q=https:\/\/www\.linkedin\.com\/in\/.*$/

  for (let index = START_INDEX; index < studentNames.length; ++index) {
    const student = studentNames[index]
    const fullName = `${student.first} ${student.juhylast}`
    console.log(`${index} | ${student.newid} | ${fullName}`)

    const searchResults = (await getGoogleSearchResults(`${fullName} UC Davis LinkedIn`))
      .filter(result => linkedInRegex.test(result.url))
    fs.appendFileSync(RESULTS_FILE, JSON.stringify({ index, student, searchResults }) + '\n')
    await sleep(TIME_DELAY)
  }
}

scrape()
  .then(() => { console.log('\nFINISHED\n') })
  .catch(e => { console.log(e) })
