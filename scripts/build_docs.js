'use strict';
const fs = require('fs');
const path = require('path');
const execSync = require('child_process').execSync;
const ejs = require('ejs');
const renderFromPaths =
  require('json-schema-to-markdown-table').renderFromPaths;
const ROOT = path.dirname(path.normalize(__dirname));

function strip(string) {
  return string.replace(/^\s+|\s+$/g, '');
}

function importFile(relativePath) {
  const absolutePath = path.join(ROOT, relativePath);
  return strip(fs.readFileSync(absolutePath).toString('utf-8'));
}

function renderFixture(fixtureRelativePath) {
  const json = importFile(path.join('test', 'fixtures', fixtureRelativePath));
  return '\n```json\n' + json + '\n```\n';
}

function renderSchema(schemaRelativePath) {
  const schemasPath = path.join(ROOT, 'src', 'common', 'schemas');
  const schemaPath = path.join(schemasPath, schemaRelativePath);
  return renderFromPaths(schemaPath, schemasPath);
}

function main() {
  const locals = {
    importFile: importFile,
    renderFixture: renderFixture,
    renderSchema: renderSchema
  };

  const indexPath = path.join(ROOT, 'docs', 'src', 'index.md.ejs');
  ejs.renderFile(indexPath, locals, function(error, output) {
    if (error) {
      console.error(error);
      process.exit(1);
    } else {
      const outputPath = path.join(ROOT, 'docs', 'index.md');
      fs.writeFileSync(outputPath, output);
      execSync('npm run doctoc', {cwd: ROOT});
      process.exit(0);
    }
  });
}

main();
