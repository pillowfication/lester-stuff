const _ = require('lodash')
const fs = require('fs')
const path = require('path')
const puppeteer = require('puppeteer')
const cheerio = require('cheerio')

function getReviewsPage (url, pageNum) {
  const match = url.match(/g[0-9]+-d[0-9]+/)
  const index = match.index + match[0].length
  return url.substring(0, index) + `-or${pageNum * 5}` + url.substring(index)
}

function getHotelsPage (url, pageNum) {
  const match = url.match(/g[0-9]+/)
  const index = match.index + match[0].length
  return url.substring(0, index) + `-oa${pageNum * 30}` + url.substring(index)
}

async function scrapeHotel (url) {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()

  await page.goto(url)
  const html = await page.content()
  const $ = cheerio.load(html)

  const details = {
    hotel_name: $('#HEADING').text(),
    street_address: $('.street-address').text(),
    locality: $('.locality').text()
  }
  const fileName = path.resolve(__dirname, `./data/${_.kebabCase(details.hotel_name)}.json`)
  fs.writeFileSync(fileName, JSON.stringify(details) + '\n')
  console.log(`${details.hotel_name} -> ${fileName}`)

  for (let pageNum = 0; ; ++pageNum) {
    try {
      await page.goto(getReviewsPage(url, pageNum))
      const html = await page.content()
      const $ = cheerio.load(html)

      const retrievedPage = Number($('.pageNum.current').eq(0).text())
      if (retrievedPage !== pageNum + 1) {
        console.log(`${details.hotel_name}: Stopped (Page ${pageNum})`)
        break
      }

      const results = []
      $(':not(.hotels-hotel-review-community-content-TabContent__inactive--2Ky9z) > * > .hotels-hotel-review-community-content-Card__card--1MJgB').each((i, elem) => {
        const $elem = $(elem)
        results.push({
          author_username:
            $elem.find('.social-member-event-MemberEventOnObjectBlock__member--35-jC')
              .attr('href').substring(9),
          author_hometown:
            $elem.find('.social-member-common-MemberHometown__hometown--3kM9S')
              .text() || undefined,
          review_date:
            $elem.find('.social-member-event-MemberEventOnObjectBlock__member--35-jC')
              .parent().get()[0].children[1].data.substring(16),
          review_rating: (() => {
            const $bubble = $elem.find('.ui_bubble_rating')
            return _.find([ 1, 2, 3, 4, 5 ], rating => $bubble.hasClass(`bubble_${rating}0`))
          })(),
          review_title:
            $elem.find('.hotels-review-list-parts-ReviewTitle__reviewTitle--2Fauz')
              .text(),
          review_content:
            $elem.find('.hotels-review-list-parts-ExpandableReview__reviewText--3oMkH')
              .text(),
          review_disclaimer:
            $elem.find('.hotels-review-list-parts-AttributionDisclaimer__disclaimer--2mPy6')
              .text() || undefined,
          review_date_of_stay:
            $elem.find('.hotels-review-list-parts-EventDate__event_date--CRXs4')
              .get()[0].children[0].children[1].data.substring(1)
        })
      })

      fs.appendFileSync(fileName, JSON.stringify({ page: pageNum, results }) + '\n')
      console.log(`${details.hotel_name} (${pageNum}): Success`)
    } catch (error) {
      fs.appendFileSync(fileName, JSON.stringify({ page: pageNum, error }) + '\n')
      console.log(`${details.hotel_name} (${pageNum}): Failure`)
    }
  }

  await browser.close()
}

async function scrapeListings (url) {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()

  let results = []

  for (let pageNum = 0; ; ++pageNum) {
    console.log(pageNum)
    await page.goto(getHotelsPage(url, pageNum))
    const html = await page.content()
    const $ = cheerio.load(html)

    const retrievedPage = Number($('.pageNum.current').eq(0).text())
    if (retrievedPage !== pageNum + 1) {
      console.log(`End of Hotels List`)
      break
    }

    const urls = $('.listing .listing_title a.property_title')
      .map((_, elem) => 'https://www.tripadvisor.com' + $(elem).attr('href'))
      .get()
    results = results.concat(urls)
  }

  return results
}

(async () => {
  const hotels = await scrapeListings('https://www.tripadvisor.com/Hotels-g29222-Oahu_Hawaii-Hotels.html')
  console.log('SCRAPING\n\n')
  for (const url of hotels) {
    await scrapeHotel(url)
  }
})()
