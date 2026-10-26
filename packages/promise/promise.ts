
/** Promise 的三种状态：等待、成功、失败。 */
enum PromiseState {
    PENDING = 'pending', // 结果尚未确定
    FULFILLED = 'fulfilled', // 已得到成功值
    REJECTED = 'rejected' // 已得到失败原因
}


type ResolveFunction = (value: any) => void;
type RejectFunction = (reason: any) => void;


class MyPromise {

    // 新实例处于 pending，等待 resolve 或 reject。
    #state: PromiseState = PromiseState.PENDING;
    // 保存成功值或失败原因；初始值为 undefined。
    #result: any = undefined;
    // 每次 then 登记一组回调，以及它返回的新 Promise 的两个出口。
    #handlers: {
        onFulfilled?: ((value: any) => any) | null | undefined,
        onRejected?: ((reason: any) => any) | null | undefined,
        resolve: ResolveFunction,
        reject: RejectFunction
    }[] = [];

    /**
     * 创建实例并同步调用执行器。
     * @param executor 唯一的构造参数
     */
    constructor(executor: (resolve: ResolveFunction, reject: RejectFunction) => void) {
        /**
         * 传给 executor 的成功函数。
         * @param value 要保存的成功值
         */
        const resolve = (value: any) => {
            this.#changeState(PromiseState.FULFILLED, value);
        };

        /**
         * 传给 executor 的失败函数。
         * @param reason 要保存的失败原因
         */
        const reject = (reason: any) => {
            this.#changeState(PromiseState.REJECTED, reason);
        };

        // executor 在构造时同步执行；同步抛错会转成拒绝。
        try {
            executor(resolve, reject);
        } catch (error) {
            reject(error);
        }
    }

    /**
     * 只在 pending 时写入结果，并通知已登记的回调。
     * @param newState 要写入的成功或失败状态
     * @param result 成功值或失败原因
     */
    #changeState(newState: PromiseState, result: any) {
        if (this.#state !== PromiseState.PENDING) {
            return;
        }
        this.#state = newState;
        this.#result = result;
        this.#run();
    }

    /**
     * 判断一个值是否有可调用的 then 方法。
     * @param value 待判断的值
     * @returns 是否为 PromiseLike
     */
    #isPromiseLike(value: any) {
        if (value !== null && (typeof value === 'object' || typeof value === 'function')) {
            return typeof value.then === 'function';
        }
        return false;
    }

    /**
     * 把回调安排在当前同步代码之后；不同分支不保证与原生 Promise 同序。
     * @param func 稍后执行的回调
     */
    #runMicroTask(func: () => void) {
        if (typeof process === 'object' && typeof process.nextTick === 'function') {
            process.nextTick(func);
        } else if (typeof MutationObserver === 'function') {
            const observer = new MutationObserver(func);
            const textNode = document.createTextNode('');
            observer.observe(textNode, { characterData: true });
            textNode.data = '1';
        } else {
            setTimeout(func, 0);
        }
    }


    /**
     * 执行一组回调，并用其结果决定下一层 Promise。
     * @param callback 当前状态对应的回调，可省略
     * @param resolve 下一层 Promise 的成功出口
     * @param reject 下一层 Promise 的失败出口
     */
    #runOne(callback: ((value: any) => any) | null | undefined, resolve: ResolveFunction, reject: RejectFunction) {
        this.#runMicroTask(() => {
            // 没传对应回调时，把原值或错误直接交给下一层。
            if (typeof callback !== 'function') {
                const settled = this.#state === PromiseState.FULFILLED ? resolve : reject;
                settled(this.#result);
                return;
            }

            try {
                const data = callback(this.#result);
                if (this.#isPromiseLike(data)) {
                    // 返回 PromiseLike 时，下一层等待它的最终结果。
                    data.then(resolve, reject);
                } else {
                    resolve(data);
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    /** 状态确定后，按登记顺序调度等待中的回调。 */
    #run() {
        // 还在等待结果时，保留已登记的回调。
        if (this.#state === PromiseState.PENDING) {
            return;
        }
        while (this.#handlers.length) {
            const { onFulfilled, onRejected, resolve, reject } = this.#handlers.shift()!;

            if (this.#state === PromiseState.FULFILLED) {
                this.#runOne(onFulfilled, resolve, reject);
            } else {
                this.#runOne(onRejected, resolve, reject);
            }
            // if (this.#state === PromiseState.FULFILLED) {
            //     if (typeof onFulfilled === 'function') {
            //         try {
            //             const data = onFulfilled(this.#result);
            //             resolve(data);
            //         } catch (error) {
            //             reject(error);
            //         }
            //     } else {
            //         resolve(this.#result);
            //     }
            // } else {
            //     if (typeof onRejected === 'function') {
            //         onRejected(this.#result);
            //     } else {
            //         reject(this.#result);
            //     }
            // }

        }

    }

    /**
     * 登记成功或失败回调，返回链式调用的下一层 Promise。
     * @param onFulfilled 成功时执行的回调
     * @param onRejected 失败时执行的回调
     * @returns 新的 MyPromise 实例
     */
    then(onFulfilled?: ((value: any) => any) | null, onRejected?: ((reason: any) => any) | null) {

        return new MyPromise((resolve, reject) => {
            this.#handlers.push({
                onFulfilled,
                onRejected,
                resolve,
                reject
            });
            // 如果当前 Promise 已有结果，刚登记的回调也要被处理。
            this.#run();
        })
    }

    /**
     * 登记失败回调，相当于只传失败回调的 then。
     * @param onRejected 失败时执行的回调
     * @returns 新的 MyPromise 实例
     */
    catch(onRejected: (reason: any) => void) {
        return this.then(undefined, onRejected);
    }

    /**
     * 成功或失败时都执行收尾；收尾正常完成后透传原结果。
     * @param onFinally 收尾回调
     * @returns 新的 MyPromise 实例
     */
    finally(onFinally: () => void) {
        return this.then(
            (value) => {
                onFinally();
                return value;
            },
            (reason) => {
                onFinally();
                throw reason;
            }
        );
    }

    /**
     * 把普通值或 PromiseLike 转成 MyPromise；已有实例直接返回。
     * @param value 要包装的值
     * @returns 已有或新建的 MyPromise 实例
     */
    static resolve(value: any) {
        if (value instanceof MyPromise) {
            return value;
        }
        let _resolve!: ResolveFunction, _reject!: RejectFunction;
        const p = new MyPromise((resolve, reject) => {
            _resolve = resolve;
            _reject = reject;
        });
        // PromiseLike 要跟随其结果；普通值直接让新实例成功。
        if (p.#isPromiseLike(value)) {
            value.then(_resolve, _reject);
        } else {
            _resolve(value);
        }
        return p;
    }

    /**
     * 创建一个以给定原因为结果的失败实例。
     * @param value 失败原因
     * @returns 新的 MyPromise 实例
     */
    static reject(value: any) {
        return new MyPromise((_, reject) => {
            reject(value);
        });
    }
}

export { MyPromise };
