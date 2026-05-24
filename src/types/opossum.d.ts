declare module 'opossum' {
  export default class CircuitBreaker<TArgs extends unknown[], TReturn> {
    constructor(action: (...args: TArgs) => Promise<TReturn>, options?: object);
    fire(...args: TArgs): Promise<TReturn>;
    on(event: string, callback: (...args: unknown[]) => void): void;
  }
}
