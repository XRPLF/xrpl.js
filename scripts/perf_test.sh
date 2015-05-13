#!/bin/sh
URL="https://www.dropbox.com/s/a0gy7vbb86eeqlq/ledger-full-1000000.json?dl=1"
DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )
DEST="$DIR/cache/ledger-full-1000000.json"
if [ ! -e "$DEST" ]
then
  echo "Downloading test data..."
  mkdir -p "$DIR/cache"
  curl -L "$URL" > "$DEST"
fi
npm run compile && time node "$DIR/verify_ledger_json.js" "$DEST"
