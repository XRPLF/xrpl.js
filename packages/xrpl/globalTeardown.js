// globalTeardown.js
const fs = require('fs')
const path = require('path')

const jsonFilePath = path.join(__dirname, 'globalTestData.json')

module.exports = async () => {
  // Delete globalTestData.json after all tests have run
  if (fs.existsSync(jsonFilePath)) {
    fs.unlinkSync(jsonFilePath)
  }
}
