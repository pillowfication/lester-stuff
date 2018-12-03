process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const https = require('https')

https.get('https://www.sis.hawaii.edu/uhdad/avail.classes?i=MAN&t=201930', res => {
  console.log('statusCode:', res.statusCode)
  console.log('headers:', res.headers)
  res.on('data', data => {
    process.stdout.write(data)
  })
}).on('error', err => {
  console.error(err)
})

