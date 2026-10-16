# Jelly UI

[English](https://github.com/jelly-kits/jelly-ui/blob/main/README.en.md) | [简体中文](https://github.com/jelly-kits/jelly-ui/blob/main/README.md)

**仓库**：<https://github.com/jelly-kits/jelly-ui> ｜ **uni-app 版仓库**：<https://github.com/jelly-kits/jelly-ui-uniapp> ｜ **在线文档**：<https://jelly-kits.github.io/jelly-ui/> ｜ **uni-app 版文档**：<https://jelly-kits.github.io/jelly-ui-uniapp/>

Vue 3 **果冻**UI组件库 + 自带文档站。设计源是根目录的 `test.html`（弹簧 / 果冻效果原型）。

- **零运行时依赖**（图标是内置的自绘 SVG），`vue` 是唯一的 peer dependency；富文本编辑器子入口（`/editor`）额外依赖 tiptap、拖拽排序子入口（`/sortable`）额外依赖 sortablejs，那些包都记为**可选 peer**，用到才装
- 规模：117 个组件目录 / 137 个组件 / 111 个文档页

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

## 富文本编辑器（可选子入口）

`@jelly-kits/jelly-ui/editor` 提供轻量富文本编辑器 `JeEditor`：文字格式、H1 / H2 标题、无序 / 有序列表、超链接、图片与视频，不做图文环绕这类复杂排版。它基于 [Tiptap](https://tiptap.dev/)，相关的包记为**可选 peer** —— 只有真的 import 了编辑器才需要安装：

```bash
npm install @tiptap/vue-3 @tiptap/starter-kit @tiptap/core @tiptap/pm @tiptap/extension-image @tiptap/extensions
```

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { JeEditor, type JeEditorUpload } from '@jelly-kits/jelly-ui/editor'

const html = ref('<p>你好</p>')

// 图片 / 视频的上传回调：返回最终可访问的地址，onProgress 用来驱动面板里的进度
const upload: JeEditorUpload = async (file, { onProgress }) => {
  onProgress(50)
  return 'https://cdn.example.com/uploaded.png'
}
</script>

<template>
  <je-editor v-model="html" :upload="upload" placeholder="请输入内容…" />
</template>
```

- `v-model` 默认收发 HTML 字符串；`value-type="json"` 时收发 Tiptap 的文档对象。
- 不传 `upload` 时，图片 / 视频面板只提供「填 / 粘贴地址」的输入框。
- 编辑器**不在主入口导出**：没用到它的项目不会被要求安装 tiptap。
- 其余属性（`disabled` / `minHeight` / `placeholder`）、事件与可调用函数见[在线文档](https://jelly-kits.github.io/jelly-ui/#/zh-CN/editor)的 Editor 页。

## 块编辑器

`JeBlockEditor` 把内容拆成「块」：一段文本、一张图片、一个视频、一条超链接各占一块，每块占满一行、可拖动排序。数据是一份**不含 HTML 的纯 JSON**，小程序等端按 `type` 分支渲染即可 —— `JeBlockView` 就是展示侧的参照实现。两者都在主入口导出，没有额外依赖。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { JeBlockEditor, JeBlockView, type JeBlockDocument, type JeBlockUpload } from '@jelly-kits/jelly-ui'

const doc = ref<JeBlockDocument>({
  version: 1,
  blocks: [{ id: 'b1', type: 'text', text: '一段文本就是一个块' }],
})

// 图片 / 视频上传：每次传一个文件，返回可访问的地址；图片多选时会被逐个调用
const upload: JeBlockUpload = async (file) => 'https://cdn.example.com/uploaded.png'
</script>

<template>
  <je-block-editor v-model="doc" :upload="upload" />
  <je-block-view :value="doc" />
</template>
```

- 列表里每个块平时只是预览，**点一下才选中**；选中后块头部才出现图标（拖动把手 + 编辑 / 上移 / 下移 / 复制 / 删除），点「编辑」在居中弹窗里改这个块（**双击块**同样直接打开），改完点确定才写回数据。
- 不传 `upload` 时只能填 / 粘贴地址；传了以后图片可一次选多张，第一张落在当前块，其余各生成一个图片块插在它后面。
- 视频块默认只渲染封面（`poster`）+ 播放键，点播放键才挂载播放器并自动播放，页面加载时不会拉视频数据。
- 图片 / 视频可调宽度（25% / 50% / 75% / 100% 档位或自定义数值 + `%` / `px`）、高度（留空即按素材比例自适应）与缩放方式（对应 `object-fit` 的 `contain` / `cover` / `fill`）。
- `blockTypes` 限定可添加的块类型；`toolbar` 与 `blockActions` 是「白名单 + 顺序 + 自定义按钮」，回调里能拿到块与下标。
- 其余属性、事件与可调用函数见[在线文档](https://jelly-kits.github.io/jelly-ui/#/zh-CN/block-editor)的 BlockEditor 页。

## 拖拽排序（可选子入口）

`@jelly-kits/jelly-ui/sortable` 提供批量拖拽排序组件 `JeDragSort`：给一份数组接上 `v-model` 就能拖动改顺序，支持多选整组拖拽与跟随鼠标的预览。它基于 [Sortable.js](https://github.com/SortableJS/Sortable)，`sortablejs` 记为**可选 peer** —— 只有真的 import 了它才需要安装：

```bash
npm install sortablejs
```

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { JeDragSort } from '@jelly-kits/jelly-ui/sortable'

const items = ref([
  { id: 1, name: '用户中心' },
  { id: 2, name: '订单管理' },
])
</script>

<template>
  <je-drag-sort v-model="items">
    <template #item="{ item }">{{ item.name }}</template>
  </je-drag-sort>
</template>
```

- `item-key` 指定数据唯一键字段（默认 `id`）；`handle` 指定拖拽手柄；`draggable` 限定容器内哪些子元素算数据条目。
- `target` 传入页面里已有的容器（选择器 / 元素 / ref），组件就不再渲染自己的列表，直接给那个元素接入拖拽。
- 点击条目可多选（`selectable` 置 false 则只支持单条），拖动其中任意一条会带着整组一起移动；选中变化通过 `update:selectedIds` 回传。
- 内置模式下用 `item` 插槽定制卡片内容，`itemMinWidth` 与 `height` 控制卡片最小宽度和列表可视高度。
- 组件**不在主入口导出**：没用到它的项目不会被要求安装 sortablejs。
- 其余属性、事件与可调用函数见[在线文档](https://jelly-kits.github.io/jelly-ui/#/zh-CN/drag-sort)的 DragSort 页。

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
src/editor.ts     富文本编辑器子入口（@jelly-kits/jelly-ui/editor）
src/sortable.ts   拖拽排序子入口（@jelly-kits/jelly-ui/sortable）
demo/pages/       文档页（111 个，与路由 1:1）
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
