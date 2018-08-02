/*
 * Most basic/simple implementation of a Typescript Promise!
 * Documentation and implementation based off of:
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
 *
 * Recreating wheels!
 */

import {EventDispatcher} from "simple-ts-event-dispatcher";

export interface IDeferred<T> {
    [key: string]: any;
    promise: Promise<T>;
    resolve(result: T): void;
    reject(reason: string): void;
}

export enum EPromiseStates {
    PENDING,
    FULFILLED,
    REJECTED
}

export interface IPromise<T> {
    then<X = T>(success?: (result?: T) => X, error?: (reason?: string) => string): IPromise<X>;
    catch(onRejected: (reason: string) => string): IPromise<string>;
    finally<X = T>(finallyCallback: (result: T | string) => X | string): IPromise<X>;
}

export function noop<T = any>(result?: T): T { return result as T; }

export type TResolve<T> = (result: T) => void;
export type TReject = (reason: string) => void;

export class Promise<T> extends EventDispatcher implements IPromise<T> {
    protected state: EPromiseStates;
    protected result: T | string | null = null;
    private promiseClass: typeof Promise;

    constructor(executor: (resolve: TResolve<T>, reject: TReject) => void) {
        super();
        this.state = EPromiseStates.PENDING;
        this.promiseClass = (Object.getPrototypeOf(this).constructor);
        try {
            executor(this._resolve.bind(this), this._reject.bind(this));
        } catch (e) {
            this._reject(e);
        }
    }

    public static defer<T>(): IDeferred<T> {
        const promise: Promise<T> = new Promise<T>((res, rej) => {});

        return {
            promise: promise,
            resolve: promise._resolve.bind(promise),
            reject: promise._reject.bind(promise)
        };
    }

    /*
     * Returns a Promise object that is resolved with the given value. If the value is a thenable (i.e. has a then
     * method), the returned promise will "follow" that thenable, adopting its eventual state; otherwise the returned
     * promise will be fulfilled with the value. Generally, if you don't know if a value is a promise or not,
     * Promise.resolve(value) it instead and work with the return value as a promise.
     */
    public static resolve<T>(result: T): Promise<T> {
        return new Promise<T>((resolve: TResolve<T>): void => {
            if (result instanceof Promise) {
                result.then((innerResult: T) => {
                    resolve(innerResult);
                });
            } else {
                resolve(result);
            }
        });
    }

    /*
     * Returns a Promise object that is rejected with the given reason.
     */
    public static reject(reason: string): IPromise<void> {
        return new Promise<void>((resolve: TResolve<void>, reject: TReject): void => {
            reject(reason);
        });
    }

    /*
     * Returns a promise that either fulfills when all of the promises in the iterable argument have fulfilled or
     * rejects as soon as one of the promises in the iterable argument rejects. If the returned promise fulfills, it is
     * fulfilled with an array of the values from the fulfilled promises in the same order as defined in the iterable.
     * If the returned promise rejects, it is rejected with the reason from the first promise in the iterable that
     * rejected. This method can be useful for aggregating results of multiple promises.
     */
    public static all<T>(iter: Promise<T>[]): IPromise<T[]> {
        const deferred: IDeferred<T[]> = Promise.defer<T[]>();
        let done: boolean = true;
        for (const promise of iter) {
            if (promise.state == EPromiseStates.PENDING) {
                done = false;
                promise.once('fulfilled', (result: T): void => {
                    Promise.poolResults(iter, deferred);
                });

                promise.once('rejected', (reason: string): void => {
                    deferred.reject(reason);
                });
            } else if(promise.state == EPromiseStates.REJECTED) {
                deferred.reject(promise.result as string);
                done = false;
                break;
            }
        }

        if (done)
            Promise.poolResults(iter, deferred);

        return deferred.promise;
    }

    public static poolResults<T>(iter: Promise<T>[], deferred: IDeferred<T[]>) {
        let done: boolean = true;
        const results: T[] = [];
        for (const p of iter) {
            if (p.state === EPromiseStates.REJECTED) {
                deferred.reject(p.result as string);
                break;
            } else if (p.state === EPromiseStates.PENDING) {
                done = false;
            }
            results.push(p.result as T);
        }
        if (done)
            deferred.resolve(results);
    }

    /*
     * Returns a promise that fulfills or rejects as soon as one of the promises in the iterable fulfills or rejects,
     * with the value or reason from that promise.
     */
    public static race<T>(iter: Promise<T>[]): IPromise<T> {
        const deferred: IDeferred<T> = Promise.defer<T>();

        for (const promise of iter) {
            promise.once('fulfilled', (result: T) => {
                deferred.resolve(result);
            });

            promise.once('rejected', (reason: string) => {
                deferred.reject(reason);
            });
        }

        return deferred.promise;
    }

    /*
     * Appends fulfillment and rejection handlers to the promise, and returns a new promise resolving to the return
     * value of the called handler, or to its original settled value if the promise was not handled (i.e. if the
     * relevant handler onFulfilled or onRejected is not a function).
     */
    public then<X = T>(success?: (result: T) => X, error?: (reason: string) => string): IPromise<X> {
        return new this.promiseClass<X>((resolve: TResolve<X>, reject: TReject): void => {
            if (this.state === EPromiseStates.FULFILLED) {
                if (success)
                    resolve(success(this.result as T));
            } else if (this.state === EPromiseStates.REJECTED) {
                if (error)
                    reject(error(this.result as string));
            } else {
                this.once('fulfilled', (result: T): void => {
                    if (success)
                        resolve(success(result));
                });

                this.once('rejected', (reason: string): void => {
                    if (error)
                        reject(error(reason));
                });
            }
        });
    }

    /*
     * Appends a rejection handler callback to the promise, and returns a new promise resolving to the return value of
     * the callback if it is called, or to its original fulfillment value if the promise is instead fulfilled.
     */
    public catch(onRejected: (reason: string) => string): IPromise<string> {
        return this.then<string>(undefined, onRejected);
    }

    /*
     * Appends a handler to the promise, and returns a new promise which is resolved when the original promise is
     * resolved. The handler is called when the promise is settled, whether fulfilled or rejected.
     */
    public finally<X = T>(finallyCallback: (result: T | string) => X | string): IPromise<X> {
        const success: (r: T) => X = (result: T): X => finallyCallback(result) as X;
        const error: (r: string) => string = (reason: string): string => finallyCallback(reason) as string;

        return this.then<X>(success, error);
    }

    protected _resolve(result: T): void {
        if (this.state !== EPromiseStates.PENDING) return;
        this.state = EPromiseStates.FULFILLED;
        this.result = result;
        this.trigger('fulfilled', result);
    }

    protected _reject(reason: string): void {
        if (this.state !== EPromiseStates.PENDING) return;
        this.state = EPromiseStates.REJECTED;
        this.result = reason;
        this.trigger('rejected', reason);
    }
}
