import { EventDispatcher } from "simple-ts-event-dispatcher";
export interface IDeferred<T> {
    promise: Promise<T>;
    resolve(result: T): void;
    reject(reason: string): void;
}
export declare enum EPromiseStates {
    PENDING = 0,
    FULFILLED = 1,
    REJECTED = 2,
}
export interface IPromise<T> {
    then<X = T>(success?: (result?: T) => X, error?: (reason?: string) => string): IPromise<X>;
    catch(onRejected: (reason: string) => string): IPromise<string>;
    finally<X = T>(finallyCallback: (result: T | string) => X | string): IPromise<X>;
}
export declare function noop<T = any>(result?: T): T;
export declare type TResolve<T> = (result: T) => void;
export declare type TReject = (reason: string) => void;
export declare class Promise<T> extends EventDispatcher implements IPromise<T> {
    protected state: EPromiseStates;
    protected result: T | string | null;
    private promiseClass;
    constructor(executor: (resolve: TResolve<T>, reject: TReject) => void);
    static defer<T>(): IDeferred<T>;
    static resolve<T>(result: T): Promise<T>;
    static reject(reason: string): Promise<void>;
    static all<T>(iter: Promise<T>[]): Promise<T[]>;
    static race<T>(iter: Promise<T>[]): Promise<T>;
    then<X = T>(success?: (result: T) => X, error?: (reason: string) => string): IPromise<X>;
    catch(onRejected: (reason: string) => string): IPromise<string>;
    finally<X = T>(finallyCallback: (result: T | string) => X | string): IPromise<X>;
    protected _resolve(result: T): void;
    protected _reject(reason: string): void;
}
