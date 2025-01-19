import {
  ResponseFormatError,
  RippledError,
  TimeoutError,
  XrplError,
} from '../errors'
import type { APIVersion } from '../models'
import { Response, RequestResponseMap } from '../models/methods'
import { BaseRequest, ErrorResponse } from '../models/methods/baseMethod'

interface PromiseEntry<T> {
  resolve: (value: T | PromiseLike<T>) => void
  reject: (value: Error) => void
  timer: ReturnType<typeof setTimeout>
}

/**
 * Manage all the requests made to the websocket, and their async responses
 * that come in from the WebSocket. Responses come in over the WS connection
 * after-the-fact, so this manager will tie that response to resolve the
 * original request.
 */
export default class RequestManager {
  private nextId = 0
  private readonly promisesAwaitingResponse = new Map<
    string | number,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Necessary and typed wrapper in addPromise method
    PromiseEntry<any>
  >()

  /**
   * Adds a promise to the collection of promises awaiting response. Handles typing with generics.
   *
   * @template T The generic type parameter representing the resolved value type.
   * @param newId - The identifier for the new promise.
   * @param timer - The timer associated with the promise.
   * @returns A promise that resolves to the specified generic type.
   */
  public async addPromise<
    R extends BaseRequest,
    T = RequestResponseMap<R, APIVersion>,
  >(newId: string | number, timer: ReturnType<typeof setTimeout>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.promisesAwaitingResponse.set(newId, {
        resolve,
        reject,
        timer,
      })
    })
  }

  /**
   * Successfully resolves a request.
   *
   * @param id - ID of the request.
   * @param response - Response to return.
   * @throws Error if no existing promise with the given ID.
   */
  public resolve(
    id: string | number,
    response: Partial<Response<APIVersion>>,
  ): void {
    const promise = this.promisesAwaitingResponse.get(id)
    if (promise == null) {
      throw new XrplError(`No existing promise with id ${id}`, {
        type: 'resolve',
        response,
      })
    }
    clearTimeout(promise.timer)
    promise.resolve(response)
    this.deletePromise(id)
  }

  /**
   * Rejects a request.
   *
   * @param id - ID of the request.
   * @param error - Error to throw with the reject.
   * @throws Error if no existing promise with the given ID.
   */
  public reject(id: string | number, error: Error): void {
    const promise = this.promisesAwaitingResponse.get(id)
    if (promise == null) {
      throw new XrplError(`No existing promise with id ${id}`, {
        type: 'reject',
        error,
      })
    }
    clearTimeout(promise.timer)
    // TODO: figure out how to have a better stack trace for an error
    promise.reject(error)
    this.deletePromise(id)
  }

  /**
   * Reject all pending requests.
   *
   * @param error - Error to throw with the reject.
   */
  public rejectAll(error: Error): void {
    this.promisesAwaitingResponse.forEach((_promise, id, _map) => {
      this.reject(id, error)
      this.deletePromise(id)
    })
  }

  /**
   * Creates a new WebSocket request. This sets up a timeout timer to catch
   * hung responses, and a promise that will resolve with the response once
   * the response is seen & handled.
   *
   * @param request - Request to create.
   * @param timeout - Timeout length to catch hung responses.
   * @returns Request ID, new request form, and the promise for resolving the request.
   * @throws XrplError if request with the same ID is already pending.
   */
  public createRequest<
    R extends BaseRequest,
    T = RequestResponseMap<R, APIVersion>,
  >(request: R, timeout: number): [string | number, string, Promise<T>] {
    let newId: string | number
    if (request.id == null) {
      newId = this.nextId
      this.nextId += 1
    } else {
      newId = request.id
    }
    const newRequest = JSON.stringify({ ...request, id: newId })
    // Typing required for Jest running in browser
    const timer: ReturnType<typeof setTimeout> = setTimeout(() => {
      this.reject(
        newId,
        new TimeoutError(
          `Timeout for request: ${JSON.stringify(request)} with id ${newId}`,
          request,
        ),
      )
    }, timeout)
    /*
     * Node.js won't exit if a timer is still running, so we tell Node to ignore.
     * (Node will still wait for the request to complete).
     */
    // The following type assertions are required to get this code to pass in browser environments
    // where setTimeout has a different type
    // eslint-disable-next-line max-len -- Necessary to disable both rules.
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access -- Reason above.
    if ((timer as unknown as any).unref) {
      // eslint-disable-next-line max-len -- Necessary to disable both rules.
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call -- Reason above.
      ;(timer as unknown as any).unref()
    }
    if (this.promisesAwaitingResponse.has(newId)) {
      clearTimeout(timer)
      throw new XrplError(
        `Response with id '${newId}' is already pending`,
        request,
      )
    }
    const newPromise = new Promise<T>((resolve, reject) => {
      this.promisesAwaitingResponse.set(newId, {
        resolve,
        reject,
        timer,
      })
    })

    return [newId, newRequest, newPromise]
  }

  /**
   * Handle a "response". Responses match to the earlier request handlers,
   * and resolve/reject based on the data received.
   *
   * @param response - The response to handle.
   * @throws ResponseFormatError if the response format is invalid, RippledError if rippled returns an error.
   */
  public handleResponse(
    response: Partial<Response<APIVersion> | ErrorResponse>,
  ): void {
    if (
      response.id == null ||
      !(typeof response.id === 'string' || typeof response.id === 'number')
    ) {
      throw new ResponseFormatError('valid id not found in response', response)
    }
    if (!this.promisesAwaitingResponse.has(response.id)) {
      return
    }
    if (response.status == null) {
      const error = new ResponseFormatError('Response has no status')
      this.reject(response.id, error)
    }
    if (response.status === 'error') {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- We know this must be true
      const errorResponse = response as Partial<ErrorResponse>
      const error = new RippledError(
        errorResponse.error_message ?? errorResponse.error,
        errorResponse,
      )
      this.reject(response.id, error)
      return
    }
    if (response.status !== 'success') {
      const error = new ResponseFormatError(
        `unrecognized response.status: ${response.status ?? ''}`,
        response,
      )
      this.reject(response.id, error)
      return
    }
    // status no longer needed because error is thrown if status is not "success"
    delete response.status
    this.resolve(response.id, response)
  }

  /**
   * Delete a promise after it has been returned.
   *
   * @param id - ID of the request.
   */
  private deletePromise(id: string | number): void {
    this.promisesAwaitingResponse.delete(id)
  }
}
