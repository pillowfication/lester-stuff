const _ = require('lodash')
const fs = require('fs')
const path = require('path')

fs.writeFileSync(
  path.resolve(__dirname, './emails.txt'),
  _.uniq(
    _.compact(
      [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ]
        .map(x =>
          fs.readFileSync(path.resolve(__dirname, `./emails${x}.txt`)).toString()
        )
        .join('')
        .split('\n')
    )
  )
    .sort()
    .map(s => s + '\n')
    .join('')
)
