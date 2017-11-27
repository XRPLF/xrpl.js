interface AmbiguousProcess extends NodeJS.Process {
  browser?: true
}

declare var process: AmbiguousProcess;