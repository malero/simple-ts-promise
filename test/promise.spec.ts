import {IDeferred, Promise} from "../src/Promise";


class Test {
    constructor(
        public value: string = 'test'
    ) {}
}
class Testing {
    constructor(
        public test: Test
    ) {}
}


describe('Promise', () => {
    let dummy: any = null,
        dummy2: any = null;

    beforeEach(() => {
        dummy = jasmine.createSpyObj('dummy', ['callback']);
        dummy2 = jasmine.createSpyObj('dummy2', ['callback']);
    });

    it("defer should work properly with resolve", () => {
        const d: IDeferred<Test> = Promise.defer<Test>();
        const t: Test = new Test();
        expect(dummy.callback).not.toHaveBeenCalled();
        d.promise.then(dummy.callback.bind(dummy));
        d.resolve(t);
        expect(dummy.callback).toHaveBeenCalled();
        expect(d.promise['result']).toBe(t);
    });

    it("defer should work properly with reject", () => {
        const d: IDeferred<Test> = Promise.defer<Test>();
        const t: Test = new Test();
        expect(dummy.callback).not.toHaveBeenCalled();
        expect(dummy2.callback).not.toHaveBeenCalled();
        d.promise.then(dummy.callback.bind(dummy), dummy2.callback.bind(dummy2));
        d.reject("failed");
        expect(dummy.callback).not.toHaveBeenCalled();
        expect(dummy2.callback).toHaveBeenCalled();
        expect(d.promise['result']).toBe("failed");
    });

    it("defer should work properly with finally", () => {
        const d: IDeferred<Test> = Promise.defer<Test>();
        expect(dummy.callback).not.toHaveBeenCalled();
        expect(dummy2.callback).not.toHaveBeenCalled();
        d.promise.then((result: Test) => {
            expect(false).toBe(true); // should never be called
            return result;
        }, (reason: string) => {
            expect(dummy2.callback).not.toHaveBeenCalled();
            return reason;
        }).finally(dummy2.callback.bind(dummy2));

        d.reject("failed");
        expect(dummy2.callback).toHaveBeenCalled();
        expect(d.promise['result']).toBe("failed");
    });

    it("test race with reject", () => {
        const d: IDeferred<Test> = Promise.defer<Test>();
        const d2: IDeferred<Test> = Promise.defer<Test>();
        const t: Test = new Test();
        expect(dummy.callback).not.toHaveBeenCalled();
        expect(dummy2.callback).not.toHaveBeenCalled();
        Promise.race([
            d.promise,
            d2.promise
        ]).then(dummy.callback.bind(dummy), dummy2.callback.bind(dummy2));

        d.reject("failed");
        d2.resolve(t);
        expect(dummy.callback).not.toHaveBeenCalled();
        expect(dummy2.callback).toHaveBeenCalled();
        expect(d.promise['result']).toBe("failed");
    });

    it("test race with resolve", () => {
        const d: IDeferred<Test> = Promise.defer<Test>();
        const d2: IDeferred<Test> = Promise.defer<Test>();
        const t: Test = new Test();
        expect(dummy.callback).not.toHaveBeenCalled();
        expect(dummy2.callback).not.toHaveBeenCalled();
        Promise.race([
            d.promise,
            d2.promise
        ]).then(dummy.callback.bind(dummy), dummy2.callback.bind(dummy2));

        d.resolve(t);
        d.reject("failed");
        expect(dummy.callback).toHaveBeenCalled();
        expect(dummy2.callback).not.toHaveBeenCalled();
        expect(d.promise['result']).toBe(t);
    });

    it("test all with resolve", () => {
        const d: IDeferred<Test> = Promise.defer<Test>();
        const d2: IDeferred<Test> = Promise.defer<Test>();
        const t: Test = new Test();
        expect(dummy.callback).not.toHaveBeenCalled();
        expect(dummy2.callback).not.toHaveBeenCalled();
        Promise.all([
            d.promise,
            d2.promise
        ]).then(dummy.callback.bind(dummy), dummy2.callback.bind(dummy2));

        d.resolve(t);
        expect(dummy.callback).not.toHaveBeenCalled();
        expect(dummy2.callback).not.toHaveBeenCalled();
        d2.resolve(t);
        expect(dummy.callback).toHaveBeenCalled();
        expect(dummy2.callback).not.toHaveBeenCalled();
        expect(d.promise['result']).toBe(t);
    });

    it("test all with reject", () => {
        const d: IDeferred<Test> = Promise.defer<Test>();
        const d2: IDeferred<Test> = Promise.defer<Test>();
        const t: Test = new Test();
        expect(dummy.callback).not.toHaveBeenCalled();
        expect(dummy2.callback).not.toHaveBeenCalled();
        Promise.all([
            d.promise,
            d2.promise
        ]).then(dummy.callback.bind(dummy), dummy2.callback.bind(dummy2));

        d.resolve(t);
        expect(dummy.callback).not.toHaveBeenCalled();
        expect(dummy2.callback).not.toHaveBeenCalled();
        d2.reject("failed");
        expect(dummy.callback).not.toHaveBeenCalled();
        expect(dummy2.callback).toHaveBeenCalled();
        expect(d2.promise['result']).toBe("failed");
    });

    it("resolve static function should work properly", () => {
        const t: Test = new Test();
        expect(dummy.callback).not.toHaveBeenCalled();
        expect(dummy2.callback).not.toHaveBeenCalled();
        Promise.resolve(t).then(dummy.callback.bind(dummy), dummy2.callback.bind(dummy2));
        expect(dummy.callback).toHaveBeenCalled();
        expect(dummy2.callback).not.toHaveBeenCalled();
    });

    it("reject static function should work properly", () => {
        const t: Test = new Test();
        expect(dummy.callback).not.toHaveBeenCalled();
        expect(dummy2.callback).not.toHaveBeenCalled();
        Promise.reject("failed").then(dummy.callback.bind(dummy), dummy2.callback.bind(dummy2));
        expect(dummy.callback).not.toHaveBeenCalled();
        expect(dummy2.callback).toHaveBeenCalled();
    });

    it("should be rejected if error is thrown", () => {
        const t: Test = new Test();
        expect(dummy.callback).not.toHaveBeenCalled();
        expect(dummy2.callback).not.toHaveBeenCalled();
        new Promise<Test>((resolve, reject) => {
            throw Error('failed');
        }).then(dummy.callback.bind(dummy), dummy2.callback.bind(dummy2));
        expect(dummy.callback).not.toHaveBeenCalled();
        expect(dummy2.callback).toHaveBeenCalled();
    });

    it("should process multiple then statements in the correct order", () => {
        const d: IDeferred<Test> = Promise.defer<Test>();
        const t: Test = new Test();
        d.promise.then<Test>((result: Test): Test => {
            expect(result.value).toBe('test');
            result.value = 'then 1';
            return result;
        });
        d.promise.then<Test>((result: Test): Test => {
            expect(result.value).toBe('then 1');
            result.value = 'then 2';
            return result;
        });
        d.promise.then<Test>((result: Test): Test => {
            expect(result.value).toBe('then 2');
            result.value = 'then 3';
            return result;
        });
        d.promise.then<Test>((result: Test): Test => {
            expect(result.value).toBe('then 3');
            result.value = 'then 4';
            return result;
        });

        d.resolve(t);
    });

    it("should process chained then statements in the correct order", () => {
        const d: IDeferred<Test> = Promise.defer<Test>();
        const t: Test = new Test();
        d.promise.then<Testing>((result: Test) => {
            expect(d.promise['result']).toBe(result);
            return new Testing(result);
        }).then((result: Testing | undefined): Testing => {
            expect((result as any as Testing).test).toBe(t);
            return result as any as Testing;
        });
        d.resolve(t);
    });

    it("should process callback on previously resolved promise", (done) => {
        const d: IDeferred<Test> = Promise.defer<Test>();
        const t: Test = new Test();
        d.resolve(t);

        d.promise.then<Testing>((result: Test) => {
            expect(d.promise['result']).toBe(result);
            done();
            return new Testing(result);
        });
    });

    it("should process callback on previously rejected promise", (done) => {
        const d: IDeferred<Test> = Promise.defer<Test>();
        d.reject('Failure.');

        d.promise.then<Testing>((result: Test) => {
            expect(false).toBe(true);
            return new Testing(result);
        }, (reason?: string): string => {
            expect(reason).toBe('Failure.');
            done();

            return reason as string;
        });
    });

    it("should process Promise.all callbacks with previously resolved promises", (done) => {
        const d: IDeferred<Test> = Promise.defer<Test>();
        const d2: IDeferred<Test> = Promise.defer<Test>();
        const t: Test = new Test();
        const t2: Test = new Test();
        d2.resolve(t2);

        Promise.all<Test>([d.promise, d2.promise]).then((results?: Test[]) => {
            if (results === undefined) return;
            expect(d.promise['result']).toBe(results[0]);
            expect(d2.promise['result']).toBe(results[1]);
            done();
        });

        d.resolve(t);
    });

    it("should process Promise.all callbacks with previously rejected promises", (done) => {
        const d: IDeferred<Test> = Promise.defer<Test>();
        const d2: IDeferred<Test> = Promise.defer<Test>();
        const t: Test = new Test();
        const t2: Test = new Test();
        d.reject('Failure.');

        Promise.all<Test>([d.promise, d2.promise]).then((results?: Test[]) => {
            expect(false).toBe(true);
        }, (reason?: string): string => {
            expect(reason).toBe('Failure.');
            done();

            return reason as string;
        });

        d2.resolve(t2);
    });
});
