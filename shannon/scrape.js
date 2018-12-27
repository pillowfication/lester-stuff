const fs = require('fs')
const path = require('path')
const _ = require('lodash')
const cheerio = require('cheerio')
const request = require('./make-request')

module.exports = async function scrape () {
  // Load the main page
  const mainPage = await request('https://www.sis.hawaii.edu/uhdad/avail.classes?i=MAN&t=201930')
  const $ = cheerio.load(mainPage)

  // Grab all elements that match `ul.subjects > li > a`
  // This will give us all links in both columns (and ignore the "HDFS formerly FAMR" link)
  // Then grab only the 'href' attribute of those elements (the actual URL)
  const links = $('ul.subjects > li > a')
    .map((index, element) => $(element).attr('href').substring(2))
    .get()

  // Load each of those links
  const subjectPages = await Promise.all(links.map(url =>
    request(`https://www.sis.hawaii.edu/uhdad/${url}`)
  ))

  // For each subject page, grab all elements that match `table.listOfClasses tr td:nth-child(2) a`
  // The `:nth-child(2)` selects the second column of the table
  // Grab just the 'href' attribute again
  const subjectClasses = subjectPages.map(page => {
    const $ = cheerio.load(page)
    const links = $('table.listOfClasses tr td:nth-child(2) a')
      .map((index, element) => $(element).attr('href').substring(2))
      .get()
    return links
  })

  // `subjectClasses` is now a 2D array of links
  // Flattening it to simplify the next part (we don't care about the 2D-ness)
  const allCRNLinks = [].concat(...subjectClasses).slice(1750, 2000)

  // Now for each CRN link...
  const allEmails = await Promise.all(allCRNLinks.map(url =>
    // Load the page
    new Promise((resolve, reject) => {
      request(`https://www.sis.hawaii.edu/uhdad/${url}`)
        .then(page => {
          const $ = cheerio.load(page)
          // We have to find the Instructor email now
          // I'm not sure if it's always the 13th row of the 4th table on the page,
          // so I'll do a little more work to find the rows that start with 'Instructor:'
          // (the tables and rows have no class or id attributes to distinguish them)
          $('table tr').each((index, row) => {
            // The first child node of the `row` elem is the <td> on the left
            // That <td>'s next sibling is the <td> on the right, which holds the email
            const firstChild = $(row).find('td:nth-child(1)')
            if (firstChild.text().trim() === 'Instructor:') {
              const secondChild = firstChild.next()
              const anchorTag = secondChild.find('a').get(0)
              // In the case of "TBD", no anchor tag will be found
              if (anchorTag) {
                resolve($(anchorTag).attr('href').substring(7).toLowerCase())
              } else {
                resolve(undefined)
              }
            }
          })
        })
    })
  ))

  fs.writeFileSync(
    path.resolve(__dirname, './emails8.txt'),
    _.uniq(_.compact(allEmails)).sort().map(str => str + '\n').join('')
  )
}
