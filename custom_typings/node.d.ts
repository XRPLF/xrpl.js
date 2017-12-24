/**
 * This is an extension of Node's `process` object to include the browser
 * property, which is added by webpack.
 */
interface AmbiguousProcess extends NodeJS.Process {
  browser?: true
}

declare var process: AmbiguousProcess;