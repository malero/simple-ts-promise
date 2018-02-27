import {IDeferred, Promise} from "../src/Promise";


class Test {}


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
});
