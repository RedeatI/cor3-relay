# COR3 Relay

[English](README.md) · [上游项目](https://github.com/SaltApocalypse/cor3-helper) · [MIT 许可证](LICENSE)

面向 Chrome 和 Edge 的 COR3 辅助插件，提供当前页面自动解密、账号设置、
市场任务、Daily 调度、远征选择与状态日志。

本项目是 **SaltApocalypse/cor3-helper** 的独立公开 fork，原始项目为
**Femtoce11/cor3-helper**。保留上游历史与版权声明，不代表 COR3 官方或 Salta 发布。

我们的 **2.3.8** 兼容运行层位于 [`relay/`](relay/README.md)；上游 **2.0.5**
TypeScript 重写保留在 `src/`，可单独构建。两者关系与技术债见
[架构记录](docs/architecture/relay-runtime-import.md)。这里仅发布 **Chrome 和 Edge**。

## 构建与加载

需要 Node.js 24 或以上版本。

```sh
npm ci
npm run relay:check
npm run relay:lint
npm run relay:test
npm run relay:build
```

在扩展管理页加载对应目录：

- Chrome：`build/relay/Chrome/extension`
- Edge：`build/relay/Edge/extension`

后续更新保留同一加载目录和扩展身份。更换路径、卸载或安装第二份扩展，
可能使用不同存储。仓库不包含个人账号、浏览器配置、日志或扩展签名身份。
发布代码不会修改正在使用的插件。

## 2.3 版

[查看 2.3.8 更新说明](relay/RELEASE-2.3.8.md)

- 保留浏览器账号绑定、账号和文档隔离、设置写入队列，显式关闭的设置仍生效。
- 三个解密功能使用当前页面的许可，无需等待账号识别后再接管小游戏。
- Daily、市场刷新和自动市场任务具备默认开启逻辑。重开浏览器后，读到未覆盖的
  当前任务池可以补跑一轮；限时小游戏运行或端点占用时等待。
- 执行市场任务期间停止市场读取和刷新；结束后用缓存截止时间与系统时间核对，
  仅处理新的当前任务池。结果未知时保留待核，不盲目重复提交。
- 合并并发读取、使用小缓存摘要、限制日志积压，进度和队列使用关联票据。
  页面面板适配缩放和小窗口。

2.1.1 增加右上角插件底部的 CN / EN 设置，首次跟随浏览器，手动选择后长期
记住。C3 复用近期成功读取，配装显示参数与对比，软件显示能力与资源需求。
同时适配上游 2.0.5 的领奖筛选、零解密算力处理、配装方案缓存和慢读取修复，
并选取 1.11.0n 的简单解密点击范围与防重复改进。详见
[合并记录](relay/UPSTREAM-REVIEW.md)。

远征选择、预算与设置按账号隔离；自动派遣依照用户已配置的远征设置。
测试使用隔离数据和生产函数，不会登录或操作真实账号。离线通过不能代表
实号奖励、真实 CPU/FPS、长时间后台或系统休眠恢复已经验证。

## 保留的上游

`npm run typecheck`、`npm run lint`、`npm test` 和 `npm run build`
检查并构建 `src/` 中的上游重写，输出 `dist/`，与 Relay 的扩展目录分开。
见 [ARCHITECTURE.md](ARCHITECTURE.md)、[MODULES.md](MODULES.md) 和
[上游发布页](https://github.com/SaltApocalypse/cor3-helper/releases)。
