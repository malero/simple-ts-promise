"use strict";
/*
 * Most basic/simple implementation of a Typescript Promise!
 * Documentation and implementation based off of:
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
 *
 * Recreating wheels!
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Promise = exports.noop = exports.EPromiseStates = void 0;
var simple_ts_event_dispatcher_1 = require("simple-ts-event-dispatcher");
var EPromiseStates;
(function (EPromiseStates) {
    EPromiseStates[EPromiseStates["PENDING"] = 0] = "PENDING";
    EPromiseStates[EPromiseStates["FULFILLED"] = 1] = "FULFILLED";
    EPromiseStates[EPromiseStates["REJECTED"] = 2] = "REJECTED";
})(EPromiseStates = exports.EPromiseStates || (exports.EPromiseStates = {}));
function noop(result) { return result; }
exports.noop = noop;
var Promise = /** @class */ (function (_super) {
    __extends(Promise, _super);
    function Promise(executor) {
        var _this = _super.call(this) || this;
        _this._result = null;
        _this._state = EPromiseStates.PENDING;
        _this.promiseClass = (Object.getPrototypeOf(_this).constructor);
        try {
            executor(_this._resolve.bind(_this), _this._reject.bind(_this));
        }
        catch (e) {
            _this._reject(e);
        }
        return _this;
    }
    Object.defineProperty(Promise.prototype, "state", {
        get: function () {
            return this._state;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Promise.prototype, "result", {
        get: function () {
            return this._result;
        },
        enumerable: false,
        configurable: true
    });
    Promise.defer = function () {
        var promise = new Promise(function (res, rej) { });
        return {
            promise: promise,
            resolve: promise._resolve.bind(promise),
            reject: promise._reject.bind(promise)
        };
    };
    /*
     * Returns a Promise object that is resolved with the given value. If the value is a thenable (i.e. has a then
     * method), the returned promise will "follow" that thenable, adopting its eventual state; otherwise the returned
     * promise will be fulfilled with the value. Generally, if you don't know if a value is a promise or not,
     * Promise.resolve(value) it instead and work with the return value as a promise.
     */
    Promise.resolve = function (result) {
        return new Promise(function (resolve) {
            if (result instanceof Promise) {
                result.then(function (innerResult) {
                    resolve(innerResult);
                });
            }
            else {
                resolve(result);
            }
        });
    };
    /*
     * Returns a Promise object that is rejected with the given reason.
     */
    Promise.reject = function (reason) {
        return new Promise(function (resolve, reject) {
            reject(reason);
        });
    };
    /*
     * Returns a promise that either fulfills when all of the promises in the iterable argument have fulfilled or
     * rejects as soon as one of the promises in the iterable argument rejects. If the returned promise fulfills, it is
     * fulfilled with an array of the values from the fulfilled promises in the same order as defined in the iterable.
     * If the returned promise rejects, it is rejected with the reason from the first promise in the iterable that
     * rejected. This method can be useful for aggregating results of multiple promises.
     */
    Promise.all = function (iter) {
        var deferred = Promise.defer();
        var done = true;
        for (var _i = 0, iter_1 = iter; _i < iter_1.length; _i++) {
            var promise = iter_1[_i];
            if (promise.state == EPromiseStates.PENDING) {
                done = false;
                promise.once('fulfilled', function (result) {
                    Promise.poolResults(iter, deferred);
                });
                promise.once('rejected', function (reason) {
                    deferred.reject(reason);
                });
            }
            else if (promise.state == EPromiseStates.REJECTED) {
                deferred.reject(promise.result);
                done = false;
                break;
            }
        }
        if (done)
            Promise.poolResults(iter, deferred);
        return deferred.promise;
    };
    Promise.poolResults = function (iter, deferred) {
        var done = true;
        var results = [];
        for (var _i = 0, iter_2 = iter; _i < iter_2.length; _i++) {
            var p = iter_2[_i];
            if (p.state === EPromiseStates.REJECTED) {
                deferred.reject(p.result);
                break;
            }
            else if (p.state === EPromiseStates.PENDING) {
                done = false;
            }
            results.push(p.result);
        }
        if (done)
            deferred.resolve(results);
    };
    /*
     * Returns a promise that fulfills or rejects as soon as one of the promises in the iterable fulfills or rejects,
     * with the value or reason from that promise.
     */
    Promise.race = function (iter) {
        var deferred = Promise.defer();
        for (var _i = 0, iter_3 = iter; _i < iter_3.length; _i++) {
            var promise = iter_3[_i];
            promise.once('fulfilled', function (result) {
                deferred.resolve(result);
            });
            promise.once('rejected', function (reason) {
                deferred.reject(reason);
            });
        }
        return deferred.promise;
    };
    /*
     * Appends fulfillment and rejection handlers to the promise, and returns a new promise resolving to the return
     * value of the called handler, or to its original settled value if the promise was not handled (i.e. if the
     * relevant handler onFulfilled or onRejected is not a function).
     */
    Promise.prototype.then = function (success, error) {
        var _this = this;
        return new this.promiseClass(function (resolve, reject) {
            if (_this.state === EPromiseStates.FULFILLED) {
                if (success)
                    resolve(success(_this.result));
            }
            else if (_this.state === EPromiseStates.REJECTED) {
                if (error)
                    reject(error(_this.result));
            }
            else {
                _this.once('fulfilled', function (result) {
                    if (success)
                        resolve(success(result));
                });
                _this.once('rejected', function (reason) {
                    if (error)
                        reject(error(reason));
                });
            }
        });
    };
    /*
     * Appends a rejection handler callback to the promise, and returns a new promise resolving to the return value of
     * the callback if it is called, or to its original fulfillment value if the promise is instead fulfilled.
     */
    Promise.prototype.catch = function (onRejected) {
        return this.then(undefined, onRejected);
    };
    /*
     * Appends a handler to the promise, and returns a new promise which is resolved when the original promise is
     * resolved. The handler is called when the promise is settled, whether fulfilled or rejected.
     */
    Promise.prototype.finally = function (finallyCallback) {
        var success = function (result) { return finallyCallback(result); };
        var error = function (reason) { return finallyCallback(reason); };
        return this.then(success, error);
    };
    Promise.prototype._resolve = function (result) {
        if (this.state !== EPromiseStates.PENDING)
            return;
        this._state = EPromiseStates.FULFILLED;
        this._result = result;
        this.trigger('fulfilled', result);
    };
    Promise.prototype._reject = function (reason) {
        if (this.state !== EPromiseStates.PENDING)
            return;
        this._state = EPromiseStates.REJECTED;
        this._result = reason;
        this.trigger('rejected', reason);
    };
    return Promise;
}(simple_ts_event_dispatcher_1.EventDispatcher));
exports.Promise = Promise;
//# sourceMappingURL=Promise.js.map