# 开发 {{APP_NAME}}

安装依赖，然后运行 hello action：

```bash
pnpm install
pnpm action hello --name Builder
```

`actions/run.ts` 仅是驱动 `pnpm action <name>` 的共享 CLI 调度器。将真正的代理可调用 actions 作为单独的文件添加，如 `actions/hello.ts`。

然后对此文件夹运行生产应用-代理循环：

```bash
pnpm agent "Call hello for Builder"
```

有用的检查：

```bash
pnpm typecheck
```

此脚手架有意没有 `app/` 目录、React Router 配置、Vite 配置或开发服务器。仅当你准备好构建 UI 界面时才添加这些；Chat 模板是 UI 优先的脚手架。