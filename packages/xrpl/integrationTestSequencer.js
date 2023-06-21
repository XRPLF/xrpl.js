const Sequencer = require('@jest/test-sequencer').default

class CustomSequencer extends Sequencer {
  sort(tests) {
    // Test structure information
    // https://github.com/facebook/jest/blob/6b8b1404a1d9254e7d5d90a8934087a9c9899dab/packages/jest-runner/src/types.ts#L17-L21
    const copyTests = Array.from(tests)
    const sorted = copyTests.sort((testA, testB) => {
      if (testA.path.includes('escrow') && testA.path.includes('escrow')) {
        return -1
      }

      if (testB.path.includes('escrow')) {
        return 1
      }

      if (testA.path.includes('finalTest')) {
        return 1
      }

      if (testB.path.includes('finalTest')) {
        return -1
      }

      return testA.path > testB.path ? 1 : -1
    })
    console.log('sorted', sorted)
    return sorted
  }
}

module.exports = CustomSequencer
