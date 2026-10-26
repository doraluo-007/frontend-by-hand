# 手写 Promise

用 TypeScript 从头实现 `MyPromise`，理解 Promise 的状态、回调执行时机与链式调用。

## 源码

实现集中在 [promise.ts](./promise.ts)，保留原有实现与注释。演示代码独立放在 [demo.ts](./demo.ts)，源码新增 `MyPromise` 导出。

建议按这个顺序阅读：

1. `PromiseState` 与函数类型：定义状态和两个出口。
2. `constructor`、`#changeState`：同步执行 executor，保存结果。
3. `then`、`#run`：登记回调，状态确定后依次调度。
4. `#runMicroTask`、`#runOne`：延后执行回调，用返回值决定下一层结果。
5. `#isPromiseLike`：判断返回值是否有可调用的 `then`。
6. `catch`、`finally`：错误处理与收尾。
7. `MyPromise.resolve`、`MyPromise.reject`：创建成功或失败实例。

## 运行

需要 Node.js 和 npm。

```bash
npm install
npm run demo:promise
```

也可以只编译：

```bash
npm run build
```

`demo.ts` 中的示例会在 executor 中抛错，用来演示构造函数捕获异常并将实例设为 rejected。`console.log` 打印实例；私有字段不一定显示在控制台中。可在示例中通过 `then` / `catch` 观察结果。

## 实现范围

这是学习用的分步实现，尚未完整实现原生 Promise / Promises/A+ 的所有行为：

- 构造函数中的 `resolve` 直接保存值，没有完整展开 thenable。
- PromiseLike 的处理未覆盖嵌套解析、循环引用等全部边界。
- `finally` 支持同步收尾，尚未等待收尾回调返回的 Promise。
- 调度使用 `process.nextTick`、`MutationObserver` 或 `setTimeout`；其中 `setTimeout` 是任务兜底，执行顺序不完全等同于原生 Promise 微任务。
