#!/bin/bash

function checkEOL {
  local changedFiles=$(git --no-pager diff --name-only -M100% --diff-filter=AM --relative $(git merge-base FETCH_HEAD origin/HEAD) FETCH_HEAD)
  local result=0
  for name in $changedFiles; do
    grep  -c -U -q $'\r' $name
      if [ $? -eq 0 ]; then
        echo "windows eol found in $name" >&2
        result=1
      fi
  done
  if [ $result -eq 1 ]; then
    false
  fi
}

checkEOL
