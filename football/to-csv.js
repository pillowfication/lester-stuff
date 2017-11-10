const fs = require('fs')
const stringify = require('csv-stringify')

const data = require('./data.json')

const csv = []
const columns = { week: 'week', appollid: 'appollid' }
for (const key in data) {
  const page = data[key]
  for (const row of page.table) {
    const csvRow = {
      week: page.heading,
      appollid: key
    }
    for (const col in row) {
      if (Array.isArray(row[col])) {
        row[col].forEach((sub, index) => {
          csvRow[`${col}_${index}`] = sub
          columns[`${col}_${index}`] = `${col}_${index}`
        })
      } else {
        csvRow[col] = row[col]
        columns[col] = col
      }
    }
    csv.push(csvRow)
  }
}

stringify(csv, { header: true, columns: columns }, (_, output) => {
  fs.writeFileSync('data.csv', output)
})
