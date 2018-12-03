const fs = require('fs')
const path = require('path')
const request = require('request')
const cheerio = require('cheerio')

// Makes a GET request to the URL, and resolves with the body if successful
function requestGet (url) {
  return new Promise((resolve, reject) => {
    request.get({
      url: url,
      method: 'GET',
      headers: {
        'Host': 'www.sis.hawaii.edu',
        'Connection': 'keep-alive',
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache',
        'Upgrade-Insecure-Requests': '1',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.87 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Referer': 'https://www.sis.hawaii.edu/uhdad/avail.classes?i=MAN&t=201930',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'en-US,en;q=0.9,ja;q=0.8,ko;q=0.7'
      }
    }, (error, response, body) => {
      if (error || !body) {
        reject(error || new Error(`Could not load url: ${url}`))
      } else {
        resolve(body)
      }
    })
  })
}

module.exports = async function scrape () {
  // Load the main page
  const mainPage = await requestGet('https://www.sis.hawaii.edu/uhdad/avail.classes?i=MAN&t=201930')
  const $ = cheerio.load(mainPage)
return
  // Grab all elements that match `ul.subjects > li > a`
  // This will give us all links in both columns (and ignore the "HDFS formerly FAMR" link)
  // Then grab only the 'href' attribute of those elements (the actual URL)
  const links = $('ul.subjects > li > a').map((index, element) => $(element).attr('href'))

  // Load each of those links
  const subjectPages = await Promise.all(links.map(url =>
    requestGet('https://www.sis.hawaii.edu/uhdad/' + url.substring(2))
  ))

  // For each subject page, grab all elements that match `table.listOfClasses > tr > td:nth-child(2) > a`
  // The `:nth-child(2)` selects the second column of the table
  // Grab just the 'href' attribute again
  const subjectClasses = subjectPages.map(page => {
    const $ = cheerio.load(page)
    const links = $('table.listOfClasses > tr > td:nth-child(2) > a')
      .map((index, element) => $(element).attr('href'))
  })

  // `subjectClasses` is now a 2D array of links
  // Flattening it to simplify the next part (we don't care about the 2D-ness)
  const allCRNLinks = [].concat(...subjectClasses)

  // Create a variable to hold our results
  const allEmails = []

  // Now for each CRN link...
  Promise.all(allCRNLinks.map(link =>
    // Load the page
    requestGet('https://www.sis.hawaii.edu/uhdad/' + url.substring(2))
      .then(page => {
        const $ = cheerio.load(page)

        // We have to find the Instructor email now
        // I'm not sure if it's always the 13th row of the 4th table on the page,
        // so I'll do a little more work to find the rows that start with 'Instructor:'
        // (the tables and rows have no class or id attributes to distinguish them)
        $('table tr').each((index, row) => {
          // The first child node of the `row` elem is the <td> on the left
          // That <td>'s next sibling is the <td> on the right, which holds the email
          const firstChild = $(row.firstChild)
          if (firstChild.text().trim() === 'Instructor:') {
            const secondChild = firstChild.next()
            const anchorTag = secondChild.children('a').get(0)
            // In the case of "TBD", no anchor tag will be found
            if (anchorTag) {
              console.log(anchorTag)
            }
          }
        })
      })
  )).then(() => {
    // Reaching here means the code is finished
    console.log('All done')
  })
}
