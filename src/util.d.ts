declare module 'util' {
  // See https://github.com/DefinitelyTyped/DefinitelyTyped/issues/16860
  export function promisify(func: (...input: any[]) => void): (...input: any[]) => Promise<any>;
}