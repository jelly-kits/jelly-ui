# 更新说明

本文件记录 `@jelly-kits/jelly-ui` 每个版本**面向使用方**的变更，按版本倒序排列。

- 版本号与 npm 上的包、仓库里的 `vX.Y.Z` 标签一一对应。
- 发版时先在这里把「未发布」小节改成实际版本号，再执行 `npm version`（提交信息只会是版本号本身）。
- 分类沿用 Keep a Changelog 的口径：**新增 / 优化 / 修复 / 文档 / 工程**。
  「工程」是不影响使用方的内部改动，只想看组件用法可以跳过。

## 未发布

### 新增

- **富文本编辑器 `JeEditor`**：新增独立子入口 `@jelly-kits/jelly-ui/editor`（不在主入口导出，
  见下方「工程」）。支持文字格式（加粗 / 斜体 / 下划线 / 删除线）、H1 / H2 标题、无序 / 有序列表、
  超链接、图片与视频，不做图文环绕这类复杂排版。
  - `v-model` 默认收发 HTML 字符串，`value-type="json"` 时收发 Tiptap 文档对象。
  - 图片 / 视频既可填或粘贴地址，也可通过 `upload` 回调上传（回调里给 `onProgress` 即可驱动面板里的进度）。
  - 其余属性：`placeholder`、`disabled`、`minHeight`；事件：`change` / `focus` / `blur` / `upload-error`；
    可调用函数：`editor` / `getHTML()` / `getJSON()` / `clear()` / `focus()`。
- **JeIcon 新增 `video`、`list-ordered` 两个图标**（供编辑器工具栏使用）。
- **块编辑器 `JeBlockEditor` + 只读渲染 `JeBlockView`**（主入口导出）：把内容拆成「块」——
  一段文本、一张图片、一个视频、一条超链接各占一块，每块占满一行、可拖动排序。
  数据是一份不含 HTML 的纯 JSON（`{ version, blocks }`），其他端按 `type` 分支渲染即可，
  `JeBlockView` 就是展示侧的参照实现。
  - **交互**：列表里每个块平时只是一份预览，**点一下才选中**（高亮边框），选中后块头部
    才出现图标 —— 拖动把手 + 编辑 / 上移 / 下移 / 复制 / 删除；点「编辑」打开**居中弹窗**
    改这个块，改完点确定才写回数据；**双击块**也能直接打开这个弹窗；
    从顶部操作栏添加新块时会自动选中并直接打开它的编辑窗口。
  - **上传**：传 `upload` 回调后图片 / 视频都能上传（不传则只能填地址）；
    **图片支持一次选多张** —— 第一张落在当前块，其余各生成一个图片块插在它后面。
  - **尺寸**：图片 / 视频可调宽度（25% / 50% / 75% / 100% 档位，或自定义数值 + `%` / `px` 单位）、
    高度（留空即按素材比例自适应）与缩放方式（`contain` / `cover` / `fill`，对应 `object-fit`；
    `contain` 是默认值，不写进 JSON）。
  - **视频是点播的**：视频块默认只渲染封面（`poster`）+ 播放键，播放器根本不挂载，
    点了播放键才创建并自动播放，页面加载时一字节视频数据都不拉；
    没填封面图时是一块深色占位 + 播放键。
  - **可配置**：`blockTypes` 限定可添加的块类型；`toolbar` 与 `blockActions` 都是
    「白名单 + 顺序 + 自定义按钮」—— 内置项写 key，自定义项写对象，回调里能拿到块与下标，
    也可以调 `openEditor` 复用内置的编辑窗口。
  - 其余属性：`placeholder`、`disabled`；事件：`change` / `upload-error`；
    可调用函数：`getDocument()` / `addBlock()` / `openEditor()` / `clear()`。
- **拖拽排序 `JeDragSort`**：新增独立子入口 `@jelly-kits/jelly-ui/sortable`（不在主入口导出，
  见下方「工程」）。给一份数组接上 `v-model` 就能拖动改顺序，也支持给页面里已有的容器接入拖拽。
  - **两种模式**：默认渲染内置列表（用 `item` 插槽定制卡片内容，`itemMinWidth` / `height`
    控制卡片最小宽度与列表可视高度）；传 `target`（选择器 / 元素 / ref / 返回元素的函数）后
    不再渲染列表，直接给该元素接入拖拽，容器内的条目按位置与数据一一对应，无需自己写 `data-id`。
  - **多选整组拖拽**：点击条目可多选（`selectable` 置 false 则只支持单条），拖动其中任意一条
    会带着整组一起移动；拖动时左上角跟随鼠标的预览会显示条数（最多 3 条，超出用「+N 条」）。
  - **可配置**：`itemKey` 指定数据唯一键字段；`handle` 指定拖拽手柄；`draggable` 限定容器内
    哪些子元素算数据条目；`dragThreshold` 是拖动判定距离。
  - 事件：`update:modelValue`（`v-model`）/ `update:items`（兼容旧的 `v-model:items`）/
    `update:selectedIds`；可调用函数：`toggleSelect()` / `selectAll()` / `clearSelection()`。

### 优化

- **库自带的界面文案改走语言包**：`确定` / `取消` / `加载中` 这类固定文案以前是写死的，
  切到英文后依然是中文；现在统一从语言包取值，语言包也补了顶层 `close`（关闭）与 `empty`（暂无数据）。
  - 按钮：`JeDialog` / `JeActionSheet` / `JeArea` / `JePicker` / `JePopconfirm` 的确定与取消、
    `JeSearch` 的取消；命令式 `showDialog` 的默认按钮文案跟随应用级语言配置。
  - 提示：`JeAutoComplete` / `JeInfiniteScroll` / `JePullRefresh` 的加载中提示；
    空态：`JeEmpty` / `JeTable` / `JeTree`。
  - 无障碍标签：`JeDialog` / `JeDrawer` / `JePopup` / `JeImage` / `JeAlert` / `JeMessage` /
    `JeNotification` / `JeNoticeBar` / `JeFloatingPanel` / `JeTag` / `JeUpload` 的关闭按钮 `aria-label`。
  - 组件上同名的 prop（`cancelText` / `confirmText` / `loadingText` / `emptyText` 等）仍然优先，
    不传时才回退语言包，行为与之前一致。
- 语言包新增 `dragSort` 分组（`count` / `more`），`JeDragSort` 拖拽预览里的数量标签与
  超出上限的余量标签都从语言包取值，切换语言时跟着变。

### 文档

- 文档站「Locale 国际化」页的字段清单补上 `close` / `empty` / `dragSort.count` / `dragSort.more`。
- 文档站新增「Editor 富文本编辑器」页（「工程能力」分组），英文译文同步更新。
- 文档站新增「BlockEditor 块编辑器」页（同一分组），演示选中态交互、弹窗编辑、
  多图上传与宽高 / 缩放，英文译文同步更新。
- 文档站新增「DragSort 拖拽排序」页（同一分组），演示内置列表、多选整组拖拽、
  拖拽手柄与外部容器模式，英文译文同步更新。
- README 补「富文本编辑器（可选子入口）」一节：安装 tiptap 可选 peer 与用法示例。
- README 补「块编辑器」一节：数据结构与基本用法。
- README 补「拖拽排序（可选子入口）」一节：安装 sortablejs 可选 peer 与用法示例。
- 文档站英文译文补齐：Editor / BlockEditor / DragSort 等页面的 API 说明，以及
  `confirm` / `cancel` / `loading` / `empty` 回退类文案的说明；`node scripts/audit-i18n.mjs`
  与 `--api` 两种口径现在均为 0 缺失（之前由本节的 Editor / BlockEditor 页面引入）。

### 工程

- 库新增第三个构建入口 `editor`（`src/editor.ts`），产物为 `dist/editor.js` / `dist/editor.cjs` /
  `dist/editor.d.ts`，`package.json` 新增 `./editor` 子路径导出（`vite.config.ts` 的 `entry` / `fileName`
  已按入口名区分产物）。
- tiptap 相关包（`@tiptap/core`、`@tiptap/extension-image`、`@tiptap/extensions`、`@tiptap/pm`、
  `@tiptap/starter-kit`、`@tiptap/vue-3`）记为**可选 peer** 且不进产物：只有 import 了编辑器子入口的
  项目才需要安装，主入口使用方不受影响，`vue` 仍是主入口唯一的 peer dependency。
- 库新增第四个构建入口 `sortable`（`src/sortable.ts`），产物为 `dist/sortable.js` / `dist/sortable.cjs` /
  `dist/sortable.d.ts`，`package.json` 新增 `./sortable` 子路径导出。
- `sortablejs` 记为**可选 peer** 且不进产物：只有 import 了拖拽排序子入口的项目才需要安装，
  主入口使用方不受影响。它自身不带类型声明，组件侧用同目录的 `sortable.d.ts` 做整包声明兜底。

## 0.2.1
- 修复**action**问题。

## 0.2.0

### 新增

- **尺寸档位与全局配置打通**：新增内部工具 `useJeConfigSize`，所有带尺寸的组件统一走同一条回退链
  —— 组件自身 `size` → `JeForm` 的 `size` → 祖先 `JeConfigProvider` → `configureJelly()` → `default`。
  以前只有部分组件读得到全局尺寸，现在补齐了。
- **新增 `size` 属性的组件**（21 个）：JeArea、JeAutoComplete、JeCascader、JeCheckboxGroup、
  JeDatePicker、JeForm、JeInputNumber、JeNumberKeyboard、JePasswordInput、JePicker、JeRadioGroup、
  JeSearch、JeSegmented、JeSelect、JeSignature、JeSlider、JeSwitch、JeTimePicker、JeTimeSelect、
  JeTransfer、JeTreeSelect。
- **已有 `size` 的组件接入同一条回退链**（9 个）：JeButton、JeColorPicker、JeDescriptions、JeInput、
  JeRate、JeStepper、JeTag、JeText、JeUpload。这些组件不再各自硬编码默认档，改一下全局配置就能整站换尺寸。
- **JeForm 新增 `size`**：一次下发给表单内所有控件，控件自身的 `size` 仍然优先。
- **JeCheckboxGroup / JeRadioGroup 新增 `background`、`border`**：`false` 时去掉选项的底色 / 边框，
  只剩勾选框（圆圈）和文字；选项布局也从「一列」改成一行排多个、放不下自动换行。
- **JeRate 新增 `color`**：自定义填充星星的颜色，可传任意 CSS 颜色；不传时用主题的 warning 色。

### 优化

- **移动端尺寸体系重做**：`src/theme/variables.css` 新增两套尺寸 token —— PC 紧凑档 `--je-control-*`
  与触屏档 `--je-touch-*`（高 32 / 44 / 50，字号 12 / 14 / 16，口径对齐 Vant 4）。
  各组件在 `@media (max-width: 768px)` 下改用触屏档，`small` / `large` 档位在移动端同样生效，
  不再被 44px 的触摸热区下限拉平。要整体调移动端尺寸，改这一处 token 即可。
- **输入类控件在窄屏保持不小于 16px 字号**：低于 16px 时 iOS 会在聚焦时自动放大整个页面。
- **JePagination**：每页条数下拉由浏览器原生 `<select>` 换成组件库自己的 JeSelect（窄屏是底部弹出层，
  支持下拉关闭）；页码按钮、每页条数、跳页输入框共用同一套尺寸档位。

### 修复

- **JeForm**：`labelPosition` 在窄屏不再被强制置顶，「标签位置」在移动端同样生效。

### 文档

- 文档站补齐上述属性与行为的示例、说明，英文译文同步更新。
- CONTRIBUTING 新增 `@since x.y.z` 约定：API 提取器会把该标签从说明正文里摘出来单独留存
  （目前只提取、不渲染，供将来做版本徽章）。

### 工程

- **纯文档改动不再触发 CI 与文档站部署**：`ci.yml` / `deploy-demo.yml` 加了 `paths-ignore`
  （`**/*.md`、`LICENSE`），判定口径是「本次 push 涉及的文件全部命中忽略规则」。
- `scripts/api-extract.mjs` / `gen-api.mjs`：支持 `@since` 的提取与留存（`ApiRow.since`）。

## 0.1.1

无面向使用方的变更，仅内部与文档改动：新增 npm 可信发布（OIDC）工作流、固定 registry 为官方源、
修正 `package-lock.json` 的 resolved 源、补 `.nvmrc`。组件用法与 0.1.0 完全一致。

## 0.1.0

首个公开版本：组件库本体 + 自带文档站。
