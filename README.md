# Frontend by Hand · 前端手写实验室

从一行代码开始，拆开前端的核心机制。

这里收集用 JavaScript / TypeScript 手写的前端实现。每个主题独立成包，配上必要注释、可运行示例和实现说明，边写边理解它为什么这样工作。

## 已有实现

| 主题 | 内容 | 源码与说明 |
| --- | --- | --- |
| Promise | 状态管理、then 链式调用、回调调度、PromiseLike、catch / finally、resolve / reject | [阅读 Promise](./packages/promise) |

后续可扩充：防抖与节流、call / apply / bind、深拷贝、事件总线、并发控制、响应式系统等。新增主题以实际提交为准。

## 快速开始

需要 Node.js 20+ 和 npm。

```bash
git clone https://github.com/doraluo-007/frontend-by-hand.git
cd frontend-by-hand
npm install
npm run demo:promise
```

```bash
npm run build   # 编译所有实现
npm test        # 编译并运行测试
```

## 工程结构

```text
frontend-by-hand/
├── packages/
│   └── promise/
│       ├── promise.ts         # MyPromise 实现与注释
│       ├── demo.ts            # 可运行示例
│       ├── promise.test.cjs   # 基础行为测试
│       ├── README.md         # 阅读顺序与实现范围
│       ├── package.json
│       └── tsconfig.json
├── package.json              # npm workspaces 与统一命令
├── package-lock.json
└── tsconfig.base.json        # 共享 TypeScript 配置
```

## 新增一个主题

1. 在 `packages/<主题名>/` 下放入源码、示例和 README。
2. 添加 `package.json`，包名用 `@frontend-by-hand/<主题名>`，设置 `private: true`。
3. TypeScript 配置继承根目录的 `tsconfig.base.json`，编译产物输出到包内 `dist/`。
4. 提供 `build`、`test`、`demo` 命令；在根目录运行 `npm install` 注册新工作区。
5. 更新上面的主题目录。按需增加根目录的 `demo:<主题名>` 快捷命令。

各包 README 说明解决的问题、阅读顺序、运行方式和当前实现边界。现有代码保留自己的命名与排版风格。

这些实现用于学习，各主题的支持范围见对应 README。
