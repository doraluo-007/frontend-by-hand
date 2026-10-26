const test = require('node:test');
const assert = require('node:assert/strict');
const { MyPromise } = require('./dist/promise');

const observe = (promise) => new Promise((resolve, reject) => promise.then(resolve, reject));

test('executor 同步执行，then 回调稍后执行', async () => {
    const order = [];
    const promise = new MyPromise((resolve) => {
        order.push('executor');
        resolve(1);
    });
    const next = promise.then((value) => {
        order.push('then');
        return value;
    });
    order.push('sync');
    assert.deepEqual(order, ['executor', 'sync']);
    assert.equal(await observe(next), 1);
    assert.deepEqual(order, ['executor', 'sync', 'then']);
});

test('pending 时登记的多个回调按顺序执行，第一次落定生效', async () => {
    let resolve, reject;
    const promise = new MyPromise((res, rej) => { resolve = res; reject = rej; });
    const values = [];
    const first = promise.then((value) => { values.push(value); });
    const second = promise.then((value) => { values.push(value + 1); });
    resolve(10);
    reject('ignored');
    await Promise.all([observe(first), observe(second)]);
    assert.deepEqual(values, [10, 11]);
});

test('then 返回新实例，并传递普通值与 PromiseLike 的结果', async () => {
    const source = MyPromise.resolve(1);
    const next = source.then((value) => value + 1);
    assert.notEqual(next, source);
    assert.equal(await observe(next.then((value) => ({ then: (resolve) => resolve(value + 1) }))), 3);
});

test('同步异常转为拒绝，catch 可恢复链条', async () => {
    const error = new Error('expected');
    await assert.rejects(observe(new MyPromise(() => { throw error; })), (reason) => reason === error);
    const recovered = MyPromise.resolve(1).then(() => { throw error; }).catch((reason) => {
        assert.equal(reason, error);
        return 'recovered';
    });
    assert.equal(await observe(recovered), 'recovered');
});

test('省略回调与同步 finally 透传原结果', async () => {
    let cleaned = 0;
    assert.equal(await observe(MyPromise.resolve(7).then().finally(() => { cleaned++; })), 7);
    const error = new Error('expected');
    await assert.rejects(observe(MyPromise.reject(error).then().finally(() => { cleaned++; })), (reason) => reason === error);
    assert.equal(cleaned, 2);
});

test('静态 resolve 复用已有实例，并接收普通 PromiseLike', async () => {
    const promise = MyPromise.resolve(3);
    assert.equal(MyPromise.resolve(promise), promise);
    assert.equal(await observe(MyPromise.resolve({ then: (resolve) => resolve(4) })), 4);
});
