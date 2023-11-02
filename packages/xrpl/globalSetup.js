// globalSetup.js
const fs = require('fs')
const path = require('path')

const jsonFilePath = path.join(__dirname, 'globalTestData.json')

module.exports = async () => {
  const initialData = {}
  // Create globalTestData.json before tests start
  fs.writeFileSync(jsonFilePath, JSON.stringify(initialData, null, 2))
}
