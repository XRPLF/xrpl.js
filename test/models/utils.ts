import { isFlagEnabled } from '../../src/models/utils'
import { assert } from 'chai'

/**
 * Utils Testing
 *
 * Provides tests for utils used in models
 */
describe('Models Utils', () => {
    describe('isFlagEnabled', () => {
        let flags
        const flag1 = 0x00010000
        const flag2 = 0x00020000

        beforeEach(() => {
            flags = 0x00000000
        })

        it('verifies a flag is enabled', () => {
            flags += flag1 + flag2
            assert.isTrue(isFlagEnabled(flags, flag1))
        })

        it('verifies a flag is not enabled', () => {
            flags += flag2
            assert.isFalse(isFlagEnabled(flags, flag1))
        })
    })
})
