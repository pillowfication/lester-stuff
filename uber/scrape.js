const puppeteer = require('puppeteer')

async function wait (ms) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, ms)
  })
}

(async () => {
  const browser = await puppeteer.launch({ args: [ '--no-sandbox' ] })
  const page = await browser.newPage()
  await page.goto(
    'https://movement.uber.com/explore/los_angeles/travel-times/query?si=1380&ti=&ag=censustracts&dt[tpb]=ALL_DAY&dt[wd;]=1,2,3,4,5,6,7&dt[dr][sd]=2018-12-01&dt[dr][ed]=2018-12-31&cd=&sa;=&sdn=&lang=en-US',
    {
      waitUntil: [ 'load', 'networkidle0' ],
      timeout: 5 * 60 * 1000
    }
  )

  await wait(500)
  await page.click('#root > div.ae.af.ag.ah > div.au.av.aw.ax.ay.az.b0 > div > div.f0 > button')
  await wait(5000)
  await page.click('.soft-large button')

  await browser.close()
})()
