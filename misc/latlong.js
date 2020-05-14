const fs = require('fs')
const path = require('path')
const request = require('request-promise-native')

const IN_FILE = fs.readFileSync(path.resolve(__dirname, './latlong.csv'))
const OUT_FILE = path.resolve(__dirname, './latlongblock.csv')

const lines = IN_FILE.toString().split('\n')
lines.shift()

// fs.writeFileSync(OUT_FILE, 'latitude,longitude,fips1,fips2,fips3,fips4,fips5,fips6\n')

const lastFound = '34.2311,-118.5542'
let skip = true
let counter = 0

;(async () => {
  for (const line of lines) {
    const [lat, lon] = line.split(',')
    if (skip) {
      if (line.trim() === lastFound) {
        skip = false
        console.log(`skipped ${counter}`)
      }
      ++counter
      continue
    }

    const { results } = await request({
      uri: 'https://geo.fcc.gov/api/census/area',
      qs: {
        lat,
        lon,
        format: 'json'
      },
      json: true
    })

    if (results.length === 0) {
      console.log(`NO RESULTS: ${lat},${lon}`)
    } else {
      const fips = [0, 1, 2, 3, 4, 5].map(i => getFips(results, i))
      fs.appendFileSync(OUT_FILE, `${lat},${lon},${fips.map(f => f || '').join(',')}\n`)
    }
  }
  console.log('done')
})()

function getFips (r, i) {
  return r[i] ? r[i].block_fips : undefined
}
