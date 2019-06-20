const fs = require('fs')
const path = require('path')
const getPage = require('../get-page')

const AUTHORS_LIST = 'https://ideas.repec.org/i/eall.html'
async function getAuthors () {
  const $ = await getPage(AUTHORS_LIST)

  // Tables immediately follow <a> tags with a non-empty "name" attribute
  const $tables = $('#content-block > table')
    .filter((_, table) => {
      const $prev = $(table).prev()
      return $prev.get(0).tagName === 'a' && ($prev.attr('name') || '').trim() !== ''
    })

  const authors = []
  $tables.each((_, table) => {
    $(table).find('tr').each((index, tr) => {
      if (index === 0) return // First <tr> is the header
      $(tr).find('td').each((_, td) => {
        const $a = $(td).find('a')
        authors.push({
          name: $a.text().trim(),
          url: shrinkUrl($a.attr('href'))
        })
      })
    })
  })

  return authors
}

const ROOT_URL = 'https://ideas.repec.org'
function shrinkUrl (url) {
  return url.startsWith(ROOT_URL) ? url.substr(ROOT_URL.length) : url
}

function trim (str) {
  return str.replace(/\s+/g, ' ').replace(/\s[,.]/g, s => s[1]).trim()
}

async function getPapers (author) {
  const $ = await getPage(ROOT_URL + author.url)

  const papers = {}
  ;[ 'papers', 'articles', 'chapters' ].forEach(heading => {
    const $anchor = $(`a[name=${heading}]`)
    if ($anchor.length === 0) return

    const $ol = $anchor.next().next()
    papers[heading] = $ol.children('.list-group-item').map((_, li) => {
      const $li = $(li)
      const paper = {}

      ;[ 'publishedas', 'otherversion' ].forEach(versionType => {
        const $section = $li.find(`div.${versionType}`)
        if ($section.length > 0) {
          paper[versionType] = $section.find('.list-group-item')
            .map((_, li) => parseListGroupItem($(li)))
            .get()
          $section.remove()
        }
      })

      return Object.assign(paper, parseListGroupItem($li))
    }).get()
  })

  function parseListGroupItem ($li) {
    const data = {
      title: trim($li.find('b > a').eq(0).text()),
      url: shrinkUrl($li.find('b > a').eq(0).attr('href')),
      reference: trim($li.text())
    }
    if (!data.title || !data.url || !data.reference) {
      console.log(' > EEEE ' + JSON.stringify('data'))
    }
    return data
  }

  return papers
}

const CHUNK_SIZE = 10000
function getChunk (index) {
  const chunk = Math.floor(index / CHUNK_SIZE)
  return path.resolve(__dirname, `./data/network-${chunk}.json`)
}

;(async () => {
  console.log('Getting authors...')
  const authors = await getAuthors()
  console.log(`${authors.length} authors found...`)

  for (let i = 48195; i < authors.length; ++i) {
    const author = authors[i]
    console.log(`${i} / ${authors.length} : ${author.name}`)
    author.research = await getPapers(author)
    fs.appendFileSync(getChunk(i), JSON.stringify(author) + '\n')
  }

  console.log('Done!')
})()
