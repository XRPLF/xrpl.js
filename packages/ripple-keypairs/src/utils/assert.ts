const assertHelper: {
  ok: (cond: boolean, message?: string) => asserts cond is true
} = {
  ok(cond, message): asserts cond is true {
    if (!cond) {
      throw new Error(message)
    }
  },
}

export default assertHelper
