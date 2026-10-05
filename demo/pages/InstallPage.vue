<script setup lang="ts">
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'
import { useDemoI18n } from '../i18n'
import { withLocale } from '../router'

/*
 * 三行而不是 `const { locale, t } = useDemoI18n()` 解构：
 * 「展开代码」面板的依赖裁剪是按**顶层声明名**收集的，解构语句收集不到名字，
 * 生成出来的示例会缺声明（dangling 的 locale / t）。
 */
const i18n = useDemoI18n()
const locale = i18n.locale
const t = i18n.t

/**
 * 代码示例一律用「单行字符串数组 + join」拼接：
 * demoCode.ts 按行统计括号深度来切分顶层语句，多行模板串会被切碎（与 ThemePage 同款写法）。
 * 另外刻意不在脚本里写「模板根标签」的字面量 —— demoCode.ts 用 indexOf 定位页面模板段，
 * 脚本注释里若出现该字面量会让它锚到错误位置（会命中注释而不是真正的模板段）。
 */
const installSnippet = [
  '# npm',
  'npm install @jelly-kits/jelly-ui',
  '',
  '# pnpm',
  'pnpm add @jelly-kits/jelly-ui',
  '',
  '# yarn',
  'yarn add @jelly-kits/jelly-ui',
].join('\n')

const styleSnippet = [
  '// main.ts',
  "import { createApp } from 'vue'",
  "import '@jelly-kits/jelly-ui/style.css'",
  "import App from './App.vue'",
  '',
  "createApp(App).mount('#app')",
].join('\n')

const componentSnippet = [
  '// 脚本里按需引入（PascalCase）',
  "import { JeButton } from '@jelly-kits/jelly-ui'",
  '',
  '// 模板里用 kebab-case 标签',
  '<je-button type="primary">果冻按钮</je-button>',
].join('\n')

const fullImportSnippet = [
  '// main.ts',
  "import { createApp } from 'vue'",
  "import JellyUI from '@jelly-kits/jelly-ui'",
  "import '@jelly-kits/jelly-ui/style.css'",
  "import App from './App.vue'",
  '',
  '// 一次性注册全部组件，之后的模板里直接用组件标签',
  "createApp(App).use(JellyUI).mount('#app')",
].join('\n')

const configSnippet = [
  "import { configureJelly } from '@jelly-kits/jelly-ui'",
  '',
  '// 应用级缺省，建议在 app.mount() 之前调用一次；同名覆盖，可多次调用',
  'configureJelly({',
  "  size: 'default',                        // 'large' | 'default' | 'small'",
  "  locale: 'zh-CN',                        // 语言名 / 部分覆盖对象 / 外部适配器",
  '  zIndexBase: 2001,                       // 浮层起始层级，只升不降',
  "  teleportTo: 'body',                     // 浮层挂载点（选择器或元素）",
  "  colorMode: 'auto',                      // 'light' | 'dark' | 'auto'（跟随系统）",
  "  tokens: { '--je-primary': '#10b981' },  // 主题色 token，写入即落到 <html>",
  '})',
].join('\n')

/** 「下一步」里带向的页面：path 是无语言段的页面路径，跳转时由 withLocale 补上当前语言 */
const NEXT_STEPS = [
  { path: '/theme', label: 'Theme 全局主题', desc: '换肤、明暗模式与首帧防闪白' },
  { path: '/locale', label: 'Locale 国际化', desc: '语言名 / 部分覆盖 / 外部适配器三条输入通道' },
  { path: '/config-provider', label: 'ConfigProvider 子树配置', desc: '只对某棵子树覆盖尺寸 / 语言 / 主题' },
  { path: '/', label: '总览', desc: '按分组浏览全部组件' },
]
</script>

<template>
  <DemoPage
    title="Install 安装"
    description="在 Vue 3 项目里装上 Jelly UI：安装依赖 → 引入样式 → 跑通第一个组件 → 按需做应用级配置。库零运行时依赖，vue 是唯一的 peer dependency。"
  >
    <DemoBlock
      title="安装依赖"
      description="包名是 @jelly-kits/jelly-ui，npm / pnpm / yarn 都可。vue ^3.5 是唯一的 peer dependency（组件里用到了 useId / useTemplateRef），请确保宿主项目已经装了它。"
    >
      <pre class="code"><code>{{ installSnippet }}</code></pre>
      <p class="note">
        库本身<strong>零运行时依赖</strong>：图标是内置的自绘 SVG，浮层定位、弹簧动画都是自研内核，不会带进第三方的运行时包。
      </p>
    </DemoBlock>

    <DemoBlock
      title="引入样式"
      description="样式是独立文件，库不会自动注入，需要在入口显式引入一次。style.css 里同时包含各组件样式与全局 CSS token（--je-*），覆盖 token 即可换肤。"
    >
      <pre class="code"><code>{{ styleSnippet }}</code></pre>
      <p class="note">
        包已声明 <code>sideEffects</code>（仅 CSS），所以这条样式导入不会被 Tree-shaking 摇掉；反过来，未用到的组件样式仍然会留在 CSS 里（本项目没有做样式按需拆分）。
      </p>
    </DemoBlock>

    <DemoBlock
      title="使用组件"
      description="组件都是具名导出：脚本里用 PascalCase 引入，模板里写 kebab-case 标签。ESM 产物可直接被打包器摇树，不需要额外的按需引入插件。"
    >
      <pre class="code"><code>{{ componentSnippet }}</code></pre>
      <p class="note">
        命令式 API 是 <code>showMessage</code> / <code>showDialog</code> / <code>showLoading</code>，刻意加 <code>show</code>
        前缀与 <code>Je*</code> 组件区分开。旧名 <code>jeMessage</code> / <code>jeDialog</code> / <code>jeLoading</code>
        仍作为已废弃别名导出；若导入了旧名，同一文件模板里的 <code>&lt;je-message&gt;</code> 之类必须写成 PascalCase ——
        kebab 标签会被编译器 camelize 后命中那个函数绑定。
      </p>
    </DemoBlock>

    <DemoBlock
      title="全量导入"
      description="也可以全量导入：用 Vue 插件 app.use(JellyUI) 一次性注册全部组件，之后模板里直接用组件标签，业务文件不必再逐个 import（样式仍需单独引入一次）。"
    >
      <pre class="code"><code>{{ fullImportSnippet }}</code></pre>
      <p class="note">
        全量注册会把整个组件库拉进依赖图，打包器<strong>无法再摇掉</strong>未用到的组件；体积敏感时请继续用上面的按需导入。
        插件同时有具名导出，两种写法等价：<code>import JellyUI from '@jelly-kits/jelly-ui'</code> 或
        <code>import { JellyUI } from '@jelly-kits/jelly-ui'</code>。
      </p>
    </DemoBlock>

    <DemoBlock
      title="应用级配置"
      description="应用级缺省走 configureJelly()，建议在 app.mount() 之前调用一次。布尔值之外的取值一律按「组件自身 prop → 最近的 JeConfigProvider → configureJelly() → 内置缺省」四层回退，前一层有值就压过后一层。"
    >
      <pre class="code"><code>{{ configSnippet }}</code></pre>
      <p class="note">
        命令式 API（<code>showMessage</code> / <code>showDialog</code> / <code>showLoading</code>）在组件树之外各自挂载，
        拿不到 provide 链，读的就是这份单例。其中 <code>colorMode</code> / <code>tokens</code> 是文档级配置，
        写入即落到 <code>&lt;html&gt;</code> 上，用户之后用 <code>useColorMode()</code> / <code>setThemeTokens()</code> 手动切换会写 localStorage 并优先于它。
      </p>
    </DemoBlock>

    <DemoBlock title="下一步" description="装好之后，可以接着看这几页：">
      <ul class="next">
        <li v-for="item in NEXT_STEPS" :key="item.path" class="next__item">
          <RouterLink class="next__link" :to="withLocale(locale, item.path)">{{ t(item.label) }}</RouterLink>
          <span class="next__desc">{{ t(item.desc) }}</span>
        </li>
      </ul>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.code {
  margin: 0 0 12px;
  padding: 14px 16px;
  overflow-x: auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12.5px;
  line-height: 1.7;
  color: color-mix(in srgb, var(--je-primary) 22%, var(--je-text));
  background: color-mix(in srgb, var(--je-text) 12%, transparent);
  border: var(--je-border);
  border-radius: var(--je-radius);
}

.note {
  margin: 12px 0 0;
  font-size: 13px;
  line-height: 1.7;
  color: var(--je-text-muted);
}

.note code {
  padding: 2px 6px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12.5px;
  color: var(--je-text);
  background: var(--je-surface-hover);
  border-radius: 6px;
}

.next {
  margin: 0;
  padding: 0;
  list-style: none;
}

.next__item {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 10px;
  padding: 10px 0;
}

.next__item + .next__item {
  border-top: var(--je-border);
}

.next__link {
  font-weight: 600;
  color: var(--je-primary);
}

.next__desc {
  font-size: 13px;
  color: var(--je-text-faint);
}
</style>
