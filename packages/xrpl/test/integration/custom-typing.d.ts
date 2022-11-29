// Used with the integration test to add new type

declare namespace xrpl {
  interface TransactionTypeRegistry {
    NewTx: import('./newTx').NewTx
  }
}
