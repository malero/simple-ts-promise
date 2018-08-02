import { EventDispatcher } from "simple-ts-event-dispatcher";
export interface IDeferred<T> {
    [key: string]: any;
    promise: Promise<T>;
    resolve(result: T): void;
    reject(reason: string): void;
}
export declare type TResolve<T> = (result: T) => void;
export declare type TReject = (reason: string) => void;
export declare type TResult<T> = T | string | null;
export declare enum EPromiseStates {
    PENDING = 0,
    FULFILLED = 1,
    REJECTED = 2,
}
export interface IPromise<T> extends EventDispatcher {
    state: EPromiseStates;
    result: TResult<T>;
    then<X = T>(success?: (result?: T) => X, error?: (reason?: string) => string): IPromise<X>;
    catch(onRejected: (reason: string) => string): IPromise<string>;
    finally<X = T>(finallyCallback: (result: T | string) => X | string): IPromise<X>;
}
export declare function noop<T = any>(result?: T): T;
export declare class Promise<T> extends EventDispatcher implements IPromise<T> {
    protected _state: EPromiseStates;
    protected _result: TResult<T>;
    private promiseClass;
    constructor(executor: (resolve: TResolve<T>, reject: TReject) => void);
    readonly state: EPromiseStates;
    readonly result: TResult<T>;
    static defer<T>(): IDeferred<T>;
    static resolve<T>(result: T): IPromise<T>;
    static reject(reason: string): IPromise<void>;
    static all<T>(iter: IPromise<T>[]): IPromise<T[]>;
    static poolResults<T>(iter: IPromise<T>[], deferred: IDeferred<T[]>): void;
    static race<T>(iter: IPromise<T>[]): IPromise<T>;
    then<X = T>(success?: (result: T) => X, error?: (reason: string) => string): IPromise<X>;
    catch(onRejected: (reason: string) => string): IPromise<string>;
    finally<X = T>(finallyCallback: (result: T | string) => X | string): IPromise<X>;
    protected _resolve(result: T): void;
    protected _reject(reason: string): void;
}
