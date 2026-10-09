# Jelly UI

[English](https://github.com/jelly-kits/jelly-ui/blob/main/README.en.md) | [简体中文](https://github.com/jelly-kits/jelly-ui/blob/main/README.md)

**仓库**：<https://github.com/jelly-kits/jelly-ui> ｜ **uni-app 版仓库**：<https://github.com/jelly-kits/jelly-ui-uniapp> ｜ **在线文档**：<https://jelly-kits.github.io/jelly-ui/> ｜ **uni-app 版文档**：<https://jelly-kits.github.io/jelly-ui-uniapp/>

Vue 3 **果冻**UI组件库 + 自带文档站。设计源是根目录的 `test.html`（弹簧 / 果冻效果原型）。

- **零运行时依赖**（图标是内置的自绘 SVG），`vue` 是唯一的 peer dependency
- 规模：113 个组件目录 / 134 个导出组件 / 108 个文档页

## 安装与使用

```bash
npm install @jelly-kits/jelly-ui
```

**样式是独立文件，必须显式引入一次**（库不会自动注入）：

```ts
// main.ts
import '@jelly-kits/jelly-ui/style.css'
```

**按需导入（推荐）** —— 组件都是具名导出，脚本里用 PascalCase 引入，模板里写 kebab-case 标签：

```vue
<script setup lang="ts">
import { JeButton } from '@jelly-kits/jelly-ui'
</script>

<template>
  <je-button type="primary">果冻按钮</je-button>
</template>
```

**全量导入** —— 用 Vue 插件一次性注册全部组件，之后模板里直接写 `<je-*>`，业务文件不必再逐个 `import`：

```ts
// main.ts
import { createApp } from 'vue'
import JellyUI from '@jelly-kits/jelly-ui'
import '@jelly-kits/jelly-ui/style.css'
import App from './App.vue'

createApp(App).use(JellyUI).mount('#app')
```

- 全量导入会把整个组件库拉进依赖图，打包器**无法再摇掉**未用到的组件；体积敏感时请用上面的按需导入。插件也提供具名导出：`import { JellyUI } from '@jelly-kits/jelly-ui'`。
- `vue@^3.5` 是唯一 peer dependency（组件里用到了 `useId` / `useTemplateRef`）。
- `style.css` 里同时包含各组件样式与全局 CSS token（`--je-*`），覆盖 token 即可换肤。
- ESM 产物已声明 `sideEffects`（仅 CSS），未引用的组件可被打包器摇掉。
- 命令式 API（`showMessage` / `showDialog` / `showLoading`）与其余用法见[在线文档](https://jelly-kits.github.io/jelly-ui/)（源码在仓库 [`demo/pages/`](https://github.com/jelly-kits/jelly-ui/tree/main/demo/pages)，本地 `npm run dev` 可起）。

## 本地开发

```bash
npm install
npm run dev        # 起文档站（会先自动跑 gen:api）
```

| 命令                   | 作用                                                                     |
| -------------------- | ---------------------------------------------------------------------- |
| `npm run dev`        | 起文档站（`predev` 自动执行 `gen:api`）                                          |
| `npm run gen:api`    | 从组件源码的 JSDoc 生成 `demo/api-data.ts`（**改完组件必须跑**）                        |
| `npm run typecheck`  | `vue-tsc --noEmit`                                                     |
| `npm run build`      | 构建库产物到 `dist/`（`vite build` + 类型声明）                                    |
| `npm run build:demo` | 构建文档站到 `dist-demo/`（走 `vite.config.demo.ts`；部署到子路径加 `-- --base=/仓库名/`） |

## 目录

```
src/components/   组件（Je* 前缀，CSS 类名 je-）
src/core/         动画与浮层内核（spring / useFloating / useZIndex / useFocusTrap …）
src/theme/        全局 CSS token
demo/pages/       文档页（108 个，与路由 1:1）
scripts/          gen-api.mjs（API 表生成）、api-extract.mjs（提取实现，主库与 uni 版共用）、api-glossary.mjs（说明兜底词表）
.github/workflows/  deploy-demo.yml —— 推 main 自动把文档站发布到 GitHub Pages
test.html         设计源原型，只读参考
```

## 参考与致谢

本项目的 **API 设计与交互范式**的选取参考了两个优秀的开源项目。**源码为独立实现，未复制其代码或资源**，也不与其存在任何官方关联。

- [Element Plus](https://element-plus.org/zh-CN) —— 桌面端组件语义参考
  （MIT License，Copyright (c) 2020-PRESENT Element Plus）
- [Vant](https://vant-ui.github.io/vant/#/zh-CN) —— 移动端交互范式参考
  （MIT License，Copyright (c) Youzan / Chen Jiahan and other contributors）

两者均以 MIT 协议开源，允许自由使用、修改与再分发（再分发其代码时需保留版权声明）。本项目仅在接口命名与交互约定上向其对齐，`src/` 内不含上述项目的任何代码或资源。
