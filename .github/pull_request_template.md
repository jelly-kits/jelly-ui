## 这个 PR 做了什么

<!-- 一句话概括改动内容 -->

## 为什么

<!-- 动机、要解决的问题、关联的 issue。说明「为什么」，而不只是「改了什么」 -->

## 改动类型

- [ ] 新增组件
- [ ] 修改组件行为（含破坏性变更）
- [ ] 修复 bug
- [ ] 文档 / 文档站
- [ ] 构建 / 配置 / 工程

## 自查清单

详见 [CONTRIBUTING.md](../CONTRIBUTING.md)（尤其是第 7 节「新增一个组件要同步的地方」）。

- [ ] 组件已从 `src/index.ts` 具名导出
- [ ] 新增 / 删除 / 改名组件时，已同步 `src/plugin.ts` 的 `jeComponents`（漏登记不会报错，只会让该组件在全量导入下不可用）
- [ ] 新增组件已在 `demo/router.ts` 注册路由，并新建了 `demo/pages/XxxPage.vue`
- [ ] 演示页 `<script setup>` 里显式 import 了用到的组件（否则「展开代码」面板里生成的示例会缺 import）
- [ ] props / slots / emits 的 JSDoc 已写（API 表据此生成），并已重跑 `npm run gen:api`
- [ ] 新增文案已补 `demo/i18n/en-US.ts`
- [ ] `README.md` / `README.en.md` 已按需同步

## 验证

<!-- 跑了哪些命令、用了什么探针页、结论是什么 -->

- [ ] `npm run typecheck`
- [ ] `npm run build`
- [ ] `npm run build:demo`
- [ ] `node scripts/audit-i18n.mjs` / `--api`（缺失 0）
- [ ] `node scripts/audit-motion.mjs`（缺陷 0）
- [ ] 浮层 / 移动端 / 动画类改动已用探针页实测，且**探针页已删除**

## 截图 / 录屏（可选）

<!-- 涉及视觉或交互的改动请附上 -->
