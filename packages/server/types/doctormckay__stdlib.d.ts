declare module '@doctormckay/stdlib' {
  export namespace Promises {
    function timeoutPromise<T>(timeout: number, executor: (resolve: (value: T) => void, reject: (reason?: any) => void) => void): Promise<T>;
  }
}
