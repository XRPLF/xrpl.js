import { Response, TxResponse } from '..'

function txHasPartialPayment(_response: TxResponse): boolean {
  return true
}

function hasPartialPayment(command: string, response: Response): boolean {
  switch (command) {
    case 'tx':
      return txHasPartialPayment(response as TxResponse)
    default:
      return false
  }
}

export default function handlePartialPayment(
  command: string,
  response: Response,
): void {
  if (hasPartialPayment(command, response)) {
    const warnings = response.warnings ?? []

    const warning = {
      id: 3838,
      message: 'This response contains a Partial Payment',
    }

    warnings.push(warning)

    response.warnings = warnings
  }
}
