# 更新说明

本文件记录 `@jelly-kits/jelly-ui` 每个版本**面向使用方**的变更，按版本倒序排列。

- 版本号与 npm 上的包、仓库里的 `vX.Y.Z` 标签一一对应。
- 发版时先在这里把「未发布」小节改成实际版本号，再执行 `npm version`（提交信息只会是版本号本身）。
- 分类沿用 Keep a Changelog 的口径：**新增 / 优化 / 修复 / 文档 / 工程**。
  「工程」是不影响使用方的内部改动，只想看组件用法可以跳过。

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
