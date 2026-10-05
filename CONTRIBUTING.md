# 贡献指南（CONTRIBUTING）

感谢你为 **Jelly UI** 贡献代码。本仓库是 Vue 3 + TypeScript 的组件库（包名 `@jelly-kits/jelly-ui`）加一套自带文档站；一次改动通常要同时照顾组件、文档页、双语译文与生成的 API 表。动笔前先读一遍本文，能少走很多弯路。

## 1. 开发环境与常用命令

要求 Node `>=18`（见 `package.json` 的 `engines`）。安装依赖后主要命令如下：

| 命令 | 作用 | 性质 |
| --- | --- | --- |
| `npm run dev` | 起文档站（`predev` 会自动先跑 `gen:api`） | 日常开发 |
| `npm run gen:api` | 从 `*.vue` 的 JSDoc 重新生成 `demo/api-data.ts` 的 API 表 | **改完组件必须跑** |
| `npm run typecheck` | `vue-tsc --noEmit` | **提交前必须跑** |
| `npm run build` | 组件库构建 → `dist/`（`vite build && vue-tsc -p tsconfig.build.json`） | **提交前必须跑** |
| `npm run build:demo` | 文档站构建 → `dist-demo/`（`prebuild:demo` 会先跑 `gen:api`） | **提交前必须跑** |
| `npm run preview` | 本地预览组件库构建产物 | 按需 |
| `npm run preview:demo` | 本地预览文档站构建产物 | 按需 |

「必须跑」一句话记忆：**改完组件 → `gen:api`；提交前 → `typecheck` + `build` + `build:demo`。**

## 2. 项目地图

| 目录 / 文件 | 职责 |
| --- | --- |
| `src/components/` | 组件目录，一个组件一个子目录（`JeXxx/`） |
| `src/core/` | 与组件无关的内核：`spring.ts`（弹簧动画，固定 1/60s 步长）、`presets.ts`、`useSpring.ts`、`useFloating` / `useZIndex` / `useClickOutside` / `useFocusTrap` / `useScrollLock` / `useMediaQuery` / `useSheetDrag` / `form.ts`、`canvas.ts`（Canvas 绘制共享内核）、`qrcode.ts`、`treeLayout.ts`、`globalConfig.ts`、`theme.ts` |
| `src/theme/variables.css` | 全局 CSS token，**只放原始 token**（浅色在 `:root`，深色由 `@media (prefers-color-scheme: dark)` 与 `[data-theme='dark']` 两处给出） |
| `demo/pages/` | 文档站页面，与路由 1:1 |
| `demo/components/` | 文档站骨架与通用块（`DemoPage` / `DemoBlock` / `ApiSection` / `DemoPreviewFrame` / `apiGroups.ts`） |
| `demo/i18n/` | 文档站自身的多语言（`index.ts` 语言状态、`en-US.ts` 英文覆盖表），**独立于组件库的 `JeLocale`** |
| `demo/router.ts` | 路由与左侧菜单的**唯一数据源** |
| `demo/api-data.ts` | **生成物**，由 `scripts/gen-api.mjs` 产出，勿手改 |
| `scripts/` | `gen-api.mjs`（生成 API 表）、`audit-i18n.mjs`（译文覆盖审计）、`audit-motion.mjs`（减弱动效审计）、`api-glossary.mjs`（说明文案兜底词表） |
| `public/` | 文档站静态资源（`logo.svg`、`images/`） |
| `index.html` | 首帧同步内联脚本：先定 `data-theme` 并铺与 `themeInitScript` 同源的 token，避免深色偏好下闪白 |
| `vite.config.ts` / `vite.config.demo.ts` | 分别是组件库构建与文档站构建，两份配置，**不要合并** |
| `dist/` / `dist-demo/` | 构建产物，勿手改（均已 gitignore） |
| `test.html` | 设计源原型，**只读参考，不要改** |

## 3. 命名与结构

- 组件导出名 `Je*`（如 `JeButton`），目录 `src/components/JeButton/`，主文件 `JeButton.vue`；同目录可放 `index.ts` 与 `types.ts`，也允许同目录多导出（如 `JeRow` + `JeCol`）。
- **CSS 类名与自定义属性一律 `je-` 前缀**（如 `.je-button`、`--je-primary`）。
- 命令式 API、provide-inject key、助手一律 `je*` camelCase（如注入键 `jeConfigKey`、图标表 `jeIcons`）；**命令式 API 一律用 `showXxx` 前缀**（`showMessage` / `showLoading` / `showDialog`）。
- 演示页模板里组件写 kebab 标签。注意：**不要在同一文件里既 `import { JeFoo }` 又 `import { jeFoo }`** —— `<je-foo>` 会被 `@vue/compiler-sfc` camelize 成 `jeFoo` 进而命中那个函数绑定，整页该标签全部崩掉。
- 每个组件目录里的 `index.ts` 只做该组件的再导出；根 `src/index.ts` 汇总所有具名导出（公开 API 的唯一入口）。
- 包名 `@jelly-kits/jelly-ui`；构建产物名 `jelly-ui.js` / `jelly-ui.cjs` 与产品名「Jelly UI」是**刻意保留**的历史命名，不要跟着 `Je*` 前缀一起改。

## 4. 硬性约定（不要违反）

1. **命名**：见上一节。
2. **主题铁律**：`src/theme/variables.css` 只放原始 token。渐变、半透明强调色、光晕、斑马纹底色、固定列投影这类**派生色一律在组件内用 `color-mix()` / `linear-gradient()` 现算**，不要新增全局 token。文字分两族：正文用 `--je-text*`（随明暗翻转）；**彩色 / 渐变 / 深色遮罩上的文字与图标一律用 `--je-text-on-color`**（两套主题都恒为 `#ffffff`），别把 `--je-text` 顶到彩色表面上。
3. **零运行时依赖**：不新增 npm 依赖。图标用内置 `JeIcon`（可用名字见 `src/components/JeIcon/icons.ts`）。
4. **移动端 ≤768px**：触控热区 ≥44px、预留 `env(safe-area-inset-*)`；判断窄屏用 `src/core/useMediaQuery.ts` 的 `useIsMobile()`。
5. **浮层统一模式**：面板常驻 DOM，用 `.is-open` 切 `visibility`（不要 `v-if` / `display:none`，否则量不到尺寸）；铺满视口的容器必须 `pointer-events: none`，`.is-open` 时恢复 `auto`。
6. **减弱动效**：`@media (prefers-reduced-motion: reduce)` 里**必须把状态类（`.is-open` / 修饰符类）一起列进去**，只写基础类会被特异性反压、动画照跑。改完用 `node scripts/audit-motion.mjs` 复核，别靠肉眼看选择器。
7. **配置回退链**：全局配置（`size` / `locale` / `teleportTo` / `zIndexBase`）按**四层**取值 —— 组件自身 prop → 最近的 `JeConfigProvider` → `configureJelly()` 单例 → 内置缺省。**组件级 prop 的默认值必须显式写 `undefined`**（如 `teleportTo: undefined`），省略会被 Vue 布尔转型成 `false`、让回退链当场短路。
8. **国际化**：`src/components/JeLocale/` 是唯一语言源，消费侧一律 `const { t } = useJeLocale(); t('signature.tip')`；库内新增文案要同步补 zh-CN / en-US 两套包与 `fromAdapter()` 的 key 清单。文档站自己的多语言是另一套、走 `demo/i18n/`（口径「中文原文即 key」，未命中回落中文原文，可渐进翻译）。
9. **导出与全量导入**：组件一律从 `src/index.ts` 具名导出（公开 API 的唯一入口）；`src/plugin.ts` 另维护显式白名单 `jeComponents`，新增 / 删除 / 改名组件时必须同步。plugin 只依赖 `src/components/*`，**不要反向 `import './index'`**（会成环）。
10. **z-index 与弹簧动画**：z-index 一律走 `src/core/useZIndex.ts` 的 `nextZIndex()`（全局递增，起始 2001），不要手写魔法数；弹簧动画走 `src/core/spring.ts`（固定 1/60s 步长）与 `presets.ts` / `useSpring.ts`。

## 5. 可复用的内核与参考实现

写新组件前先看有没有现成内核能复用，**不要在组件里各抄一份**：

- **命令式 API**：参考 `src/components/JeMessage/index.ts`（`createApp(内部容器).mount(宿主节点)`、返回句柄）。命令式 API 拿不到 provide 链，配置从单例读。
- **浮层内核**：`src/core/useFloating.ts`、`src/core/useZIndex.ts`、`src/core/useClickOutside.ts`、`src/core/useFocusTrap.ts`、`src/core/useSheetDrag.ts`。
- **动画内核**：`src/core/spring.ts` + `src/core/presets.ts` + `src/core/useSpring.ts`。
- **Canvas 绘制共享内核**：`src/core/canvas.ts`（`resolveCssColor` / `isTransparent` / `loadImage` / `collectQrcodeRuns` / `gradientVector` / `drawQrcodeMatrix` / `roundRectPath` / `drawImageInBox` / `wrapText`），`JeQrcode` / `JeWatermark` / `JePoster` 都从这里取绘制口径。
- **树布局内核**：`src/core/treeLayout.ts`（`JeOrgChart` 专用，纯函数，只产出坐标，与渲染解耦）。
- **配置体系**：`src/core/globalConfig.ts`（`configureJelly()` 单例）+ `src/components/JeConfigProvider/types.ts`（`useJeConfig()` 取配置值、`useTeleportTarget()` 走完整回退链）。
- **文档级主题**：`src/core/theme.ts`（`useColorMode()` / `useThemeTokens()` / `setColorMode()` / `setThemeTokens()` / `themeInitScript`）。
- **国际化**：`src/components/JeLocale/types.ts`（两套内置包、注册表、`fromAdapter()`、`useJeLocale()`）。
- **表格渲染管线**：改 `src/components/JeTable/JeTable.vue` 前先读它的列 / 行口径（`leafColumns` / `flatColumns` / `renderRows` / `renderItems` / `virtualRange`），**别再用扁平 `props.columns` 遍历**；滚动走 `JeScrollbar`，不要再往 `<table>` 外层套 `overflow: auto`。
- **海报 `JePoster`**：一份配置 → 一套布局 → 两个渲染器（`types.ts` / `layout.ts` / `paint.ts`），坐标 / 尺寸 / 字号一律设计稿 px，改这块前先看这三个文件。

## 6. 文档站页面与演示块

文档站页面写在 `demo/pages/`，由 `demo/components/` 里的通用骨架拼装：

- `DemoPage.vue` —— 页面骨架：正文列居中（≤904px）+ 右侧 sticky 第三列（在「本页目录 / 移动端预览」间切换，窄屏 ≤1200px 收起）。页面头、演示块、API 表都渲染在这套骨架里。
- `DemoBlock.vue` —— 演示块：挂载时向 `DemoPage` 登记目录锚点（id = `demo-block-N`）；「展开代码」面板里的示例代码由它生成，这也是「页面里要显式 import 组件」的原因。
- `ApiSection.vue` + `apiGroups.ts` —— API 正文与右侧目录的唯一口径（分组过滤、两级锚点 id 必须同源）。
- `DemoPreviewFrame.vue` —— 移动端预览：390px 外框 + iframe，src 自带语言段，切语言即重载。
- 页面标题 / 说明文案过 `t()`（走 `demo/i18n/`），所以新增页面要同步 `en-US.ts`。

## 7. 新增一个组件要同步的地方

按顺序做，**最容易漏的是 ②③④⑤⑥**：

1. **组件目录与实现** — 新建 `src/components/JeXxx/`（`JeXxx.vue` + `index.ts`，类型多时加 `types.ts`）。
2. **`src/index.ts` 加具名导出** — 公开 API 的唯一入口。
3. **`src/plugin.ts` 的 `jeComponents` 注册表加一项** — 键即注册名。**漏登记不会报错**，只会让该组件在全量导入（`app.use(JellyUI)`）下不可用。注册表只收组件，不含 `jeIcons` / `showDialog` / `useJeLocale` / `jeConfigKey` 这类函数与注入键。
4. **`demo/router.ts` 注册路由** — 它是路由与左侧菜单的唯一数据源。`demoRoutes` 的 `path` **不带语言段**（它同时是 `gen-api.mjs` 生成 `pageApi` / `pageSource` 的键）。
5. **新建 `demo/pages/XxxPage.vue`** — 并在页面 `<script setup>` 里**显式 import 用到的组件**，否则「展开代码」面板里生成的示例代码会缺 import。
6. **`demo/i18n/en-US.ts` 补标题与说明的英文 key** — 口径是「中文原文即 key」，页面里直接写中文即可。
7. **给 props / slots / emits 写 JSDoc** — `scripts/gen-api.mjs` 靠它生成 API 表。要点：props 说明写在 `types.ts` interface 成员**自己那一行**的 JSDoc（写在类型别名上取不到）；events 必须写内联字面量 `defineEmits<{ /** 说明 */ confirm: [] }>()`；`defineExpose` 不能写简写属性；插槽说明写在 `<slot>` 正上方的一行 HTML 注释里；面向 API 表的说明是纯文本插值，不要用 `**加粗**` / 反引号等 markdown 标记。
8. **重跑 `npm run gen:api`** — 它重写 `demo/api-data.ts`（**提交物**），所以改完组件必须跑。
9. **浮层类组件记得接 Teleport 目标** — 用 `src/components/JeConfigProvider/types.ts` 的 `useTeleportTarget(() => props.teleportTo)`，并在 `withDefaults` 里**显式写 `teleportTo: undefined`**（见硬性约定 7）；否则回退链失效、浮层永远就地渲染。

## 8. 验证方式

本项目**没有测试框架**（`node_modules` 里没有 jsdom / playwright / puppeteer），约定用「无头浏览器 + 探针页 + DOM 断言」：

1. 在项目根新建 `_probe*.html` 探针页，挂 `demo/main.ts`，在页面里跑断言并把结论渲染成 `<pre>`（这样截图 / `--dump-dom` 里就能读到文本结论）。
2. 起 dev server（用非默认端口，免得跟别的进程撞车），再用系统 Chrome 无头模式取结论。
3. **探针页用完必须删除**（临时文件，`.gitignore` 已忽略 `_probe*.html`）。

```powershell
# 起 dev server
node node_modules\vite\bin\vite.js --port 5180 --strictPort --host 127.0.0.1

# 截图（Chrome 路径按本机实际位置调整）
& 'C:\Program Files\Google\Chrome\Application\chrome.exe' --headless=new --disable-gpu `
  --force-prefers-reduced-motion --window-size='1280,900' --virtual-time-budget=25000 `
  --user-data-dir="$env:TEMP\je-chrome-x" --screenshot="$env:TEMP\x.png" 'http://127.0.0.1:5180/#/route'
```

结论是纯文本时用 `--dump-dom` 更省事：把渲染后的整棵 DOM 打到 stdout，再从 `<pre id="probe">` 里检索 `PASS` / `FAIL` 前缀。

探针特别注意：无头 + 虚拟时钟下 `requestAnimationFrame` **不触发**（需先打桩成 `setTimeout(cb, 16)`）；CSS 动画时间轴也是**冻住的**（要证明动画在跑就用 Web Animations API 逐点 seek）；**「切换状态后立刻读一个挂了过渡的属性」永远读到旧值**（断言前先设 `transition: none`，或整体加 `--force-prefers-reduced-motion`）；每次截图用**独立的 `--user-data-dir`**（复用同一 profile 会静默失败）；视口怪癖 —— `--window-size=390,844` 时 `window.innerWidth` 是 500，布局断言要用 `offsetWidth` / `getComputedStyle` 而非 `getBoundingClientRect`。

已经脚本化的审计可以直接当 CI 检查项：

| 检查 | 命令 | 通过标准 |
| --- | --- | --- |
| 译文覆盖（页面头 + 演示块） | `node scripts/audit-i18n.mjs` | 缺失 **0**（有缺失时退出码 1） |
| 译文覆盖（API 说明） | `node scripts/audit-i18n.mjs --api` | 缺失 **0**（有缺失时退出码 1） |
| 待翻清单导出 | `node scripts/audit-i18n.mjs --api --json` | —（此模式恒退出 0，便于管道消费） |
| 减弱动效审计 | `node scripts/audit-motion.mjs` | 缺陷 **0**（有缺陷时退出码 1） |

> 前四条里带退出码的三项都与 `.github/workflows/ci.yml` 保持一致 —— 本地跑绿了，CI 就不会红；本地红在 CI 里同样会红。

## 9. 常见陷阱速查

以下都是本项目真实踩过的坑，写组件时最容易撞上：

- **尺寸类 prop 的数字字符串要补 `px`**：模板里 `height="320"` 传进来是字符串 `"320"`，直接写进 `style.height` 是非法 CSS、被浏览器静默忽略。参照 `JeTable` 的 `toSize()` / `JeScrollbar` 的 `toUnit()`，对纯数字字符串补 `px`，`%` / `em` / `calc()` 原样透传。
- **`ProgressEvent` 的 `loaded` / `total` / `lengthComputable` 是原型上的只读取值器**，只能走构造函数第二参数 `new ProgressEvent('progress', { loaded, total, lengthComputable })`，`Object.assign` 会抛 `TypeError` 并打断状态机。
- **受控组件 watcher 里的「孤儿代理」**：列表类受控组件在 watcher 里对每个条目重新 `reactive()`，会让闭包持有的旧代理与视图的新代理分家。必须先用 `new Set(当前内部数组)` 判重，已是内部代理的条目原样返回。
- **`watch(computed, …)` 不写 `immediate` 就是「永不触发」**：用它做「初次同步 / 初始化」且源是 computed / ref、值在挂载前既定，必须显式 `{ immediate: true }`。
- **受控组件 + 命令式封装**：包装器必须自己用 `ref` 持有可见性并接住 `update:modelValue`，否则组件永远关不掉、宿主节点泄漏。
- **换肤变量必须落在 `<html>`（`documentElement`）上**：`Teleport` 只搬 DOM、不改 CSS 变量继承链，变量写在内容容器上时弹层里的按钮 / 勾选框读不到新色。走 `src/core/theme.ts`。
- **`public/` 下资源写绝对路径时**，脚本字符串 / 非默认属性里的 `/xxx` 不会被 `base` 改写，必须自己拼 `import.meta.env.BASE_URL`。
- **原生表格里不要给 `<th>` 加 `display: flex`**：`th` 不再是 `table-cell` 会让表头从一行散成竖排；要横排就让子元素各自 `inline-flex`。
- **不要用 PowerShell 往返读写源文件**：PS 5.1 的 `Get-Content -Raw` / `Set-Content` 会按 GBK 误读 UTF-8，造成不可逆乱码；请用编辑工具改文件。

## 10. 提交与 PR

- **改动与它牵动的文档、译文、README 放在同一个 PR** —— 组件、`demo/pages/`、`demo/i18n/en-US.ts`、`demo/api-data.ts` 与 `README.md` / `README.en.md` 有其一漏掉都不算完整。
- **提交信息说明「为什么」**，而不只是「改了什么」。
- **提交前确认上面的命令全绿**：`npm run gen:api`、`npm run typecheck`、`npm run build`、`npm run build:demo`，以及第 8 节的译文 / 动效审计脚本。
- 子路径部署用 `npm run build:demo -- --base=/仓库名/`（`base` 必须写成 `/<仓库名>/`）。
