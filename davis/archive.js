const util = require('util')
const path = require('path')
const fs = require('fs')
const archiver = require('archiver')

function archive (files, archivePath, callback) {
  const output = fs.createWriteStream(archivePath)
  const archive = archiver('zip', { zlib: { level: 9 } })
  archive.pipe(output)

  archive.on('error', callback)
  output.on('close', callback)

  for (const file of files) {
    archive.append(fs.createReadStream(file), { name: path.basename(file) })
  }

  archive.finalize()
}

module.exports = util.promisify(archive)
