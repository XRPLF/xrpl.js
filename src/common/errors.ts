/* eslint-disable max-classes-per-file -- Errors can be defined in the same file */
import { inspect } from 'util'

// TODO: replace all `new Error`s with `new XrplError`s

class XrplError extends Error {
  public readonly name: string
  public readonly message: string
  public readonly data?: unknown

  /**
   * Construct an XrplError.
   *
   * @param message - The error message.
   * @param data - The data that caused the error.
   */
  public constructor(message = '', data?: unknown) {
    super(message)

    this.name = this.constructor.name
    this.message = message
    this.data = data
    Error.captureStackTrace(this, this.constructor)
  }

  /**
   * Converts the Error to a human-readable String form.
   *
   * @returns The String output of the Error.
   */
  public toString(): string {
    let result = `[${this.name}(${this.message}`
    if (this.data) {
      result += `, ${inspect(this.data)}`
    }
    result += ')]'
    return result
  }

  /**
   * Console.log in node uses util.inspect on object, and util.inspect allows
   * us to customize its output:
   * https://nodejs.org/api/util.html#util_custom_inspect_function_on_objects.
   *
   * @returns The String output of the Error.
   */
  public inspect(): string {
    return this.toString()
  }
}

class RippledError extends XrplError {}

class UnexpectedError extends XrplError {}

class LedgerVersionError extends XrplError {}

class ConnectionError extends XrplError {}

class NotConnectedError extends ConnectionError {}

class DisconnectedError extends ConnectionError {}

class RippledNotInitializedError extends ConnectionError {}

class TimeoutError extends ConnectionError {}

class ResponseFormatError extends ConnectionError {}

class ValidationError extends XrplError {}

class XRPLFaucetError extends XrplError {}

class NotFoundError extends XrplError {
  /**
   * Construct an XrplError.
   *
   * @param message - The error message. Defaults to "Not found".
   */
  public constructor(message = 'Not found') {
    super(message)
  }
}

export {
  XrplError,
  UnexpectedError,
  ConnectionError,
  RippledError,
  NotConnectedError,
  DisconnectedError,
  RippledNotInitializedError,
  TimeoutError,
  ResponseFormatError,
  ValidationError,
  NotFoundError,
  LedgerVersionError,
  XRPLFaucetError,
}
