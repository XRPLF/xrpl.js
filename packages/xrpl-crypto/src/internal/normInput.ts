import { Input } from './index'

export default function normInput(input: Input) {
  return Array.isArray(input) ? new Uint8Array(input) : input
}
