<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  JeButton,
  JeConfigProvider,
  JeDialog,
  resetThemeTokens,
  setColorMode,
  setThemeTokens,
  themeInitSnippet,
  useColorMode,
  useThemeTokens,
} from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const { mode, isDark } = useColorMode()
const { tokens } = useThemeTokens()

/** 主色两段在 :root 上的默认值（与 variables.css 一致），没被覆盖时用来回显 */
const DEFAULT_PRIMARY = '#667eea'
const DEFAULT_PRIMARY_END = '#764ba2'

const primary = computed(() => tokens.value['--je-primary'] ?? DEFAULT_PRIMARY)
const primaryEnd = computed(() => tokens.value['--je-primary-end'] ?? DEFAULT_PRIMARY_END)

const onPrimaryInput = (event: Event) => {
  setThemeTokens({ ...tokens.value, '--je-primary': (event.target as HTMLInputElement).value })
}

const onPrimaryEndInput = (event: Event) => {
  setThemeTokens({ ...tokens.value, '--je-primary-end': (event.target as HTMLInputElement).value })
}

/** 演示「变量落在 <html> 上，Teleport 到 body 的浮层也吃得到」 */
const floating = ref(false)

/* 代码示例用单行字符串数组拼接：demoCode.ts 按行统计括号深度，多行模板串会被切碎 */
const configureSnippet = [
  "import { configureJelly } from '@jelly-kits/jelly-ui'",
  '',
  '// 应用级缺省，建议在 app.mount() 之前调用一次；',
  '// 用户随后手动切换会写 localStorage，并优先于这里',
  "configureJelly({ colorMode: 'auto', tokens: { '--je-primary': '#10b981' } })",
].join('\n')

const colorModeSnippet = [
  "import { useColorMode } from '@jelly-kits/jelly-ui'",
  '',
  'const { mode, isDark, setColorMode, toggleColorMode } = useColorMode()',
  '',
  "setColorMode('dark') // 'light' | 'dark' | 'auto'（auto = 跟随系统）",
  'toggleColorMode()',
].join('\n')

/* 静态换肤：直接覆盖 :root 上的原始 token，与 configureJelly({ tokens }) / useThemeTokens() 等价 */
const tokenSnippet = [
  ':root {',
  '  --je-primary: #10b981;',
  '  --je-primary-end: #059669; /* 主色是两段渐变，必须成对改 */',
  '  --je-success: #0ea5e9;',
  '  --je-warning: #f59e0b;',
  '  --je-danger: #ef4444;',
  '  --je-info: #7c8db5;',
  '}',
].join('\n')
</script>

<template>
  <DemoPage
    title="Theme 全局主题"
    description="明暗与主题色都是「文档级」的：库把变量写到 <html> 上，所以 Teleport 到 body 的浮层也吃得到。应用级缺省走 configureJelly()，用户偏好由 useColorMode() / setThemeTokens() 写进 localStorage 并优先于它。"
  >
    <DemoBlock
      title="明暗模式"
      description="三种取值：light / dark 把 data-theme 写到 <html> 上；auto 则清掉该属性，交给 :root 与 prefers-color-scheme 的媒体查询实时跟随系统。切换会持久化，下次打开按同一结果还原。"
    >
      <div class="toolbar">
        <je-button :type="mode === 'light' ? 'primary' : 'default'" @click="setColorMode('light')">
          light
        </je-button>
        <je-button :type="mode === 'dark' ? 'primary' : 'default'" @click="setColorMode('dark')">
          dark
        </je-button>
        <je-button :type="mode === 'auto' ? 'primary' : 'default'" @click="setColorMode('auto')">
          auto（跟随系统）
        </je-button>
      </div>
      <p class="note">
        当前 mode = <code>{{ mode }}</code
        >，实际渲染 = <code>{{ isDark ? 'dark' : 'light' }}</code
        >。auto 下改系统外观会实时跟随，&lt;html&gt; 上不会留属性。
      </p>
      <pre class="code"><code>{{ colorModeSnippet }}</code></pre>
    </DemoBlock>

    <DemoBlock
      title="主题色（语义 token）"
      description="改的是 :root 上的原始 token，渐变、光晕、半透明强调色这些派生值都由组件内部用 color-mix() / linear-gradient() 现算，所以只需要改 token。写入会持久化（localStorage key je-theme-tokens）。"
    >
      <div class="toolbar">
        <label class="pick">
          <span class="pick__name">--je-primary</span>
          <input class="pick__input" type="color" :value="primary" @input="onPrimaryInput" >
        </label>
        <label class="pick">
          <span class="pick__name">--je-primary-end</span>
          <input class="pick__input" type="color" :value="primaryEnd" @input="onPrimaryEndInput" >
        </label>
        <je-button type="default" text @click="resetThemeTokens()">恢复默认</je-button>
      </div>

      <div class="toolbar">
        <je-button type="primary">主色按钮</je-button>
        <je-button type="success">成功</je-button>
        <je-button type="warning">警告</je-button>
        <je-button type="primary" plain>素色</je-button>
        <je-button @click="floating = true">打开浮层</je-button>
      </div>
      <p class="note">
        主色是两段渐变（JeButton 取 --je-primary → --je-primary-end），只改前者的话按钮末端还是旧的紫色，必须成对改。
        点「打开浮层」能看到 Teleport 到 body 的面板里颜色同样跟着变 —— 变量落在 &lt;html&gt; 上，DOM 搬到哪都继承得到。
      </p>
      <je-dialog v-model="floating" title="浮层里的主色" width="280">
        <je-button type="primary" block>我是浮层里的按钮</je-button>
      </je-dialog>
      <p class="note">
        可换的是 6 个语义色 token：primary、primary-end、success、warning、danger、info —— 光晕 / 斑马纹 / 半透明强调色都由它们现算，不需要也不应该单独去改。
        除了上面的运行时 API，也可以静态写在样式里（与 configureJelly({ tokens }) 等价）：
      </p>
      <pre class="code"><code>{{ tokenSnippet }}</code></pre>
    </DemoBlock>

    <DemoBlock
      title="应用级缺省与首帧防闪白"
      description="configureJelly() 设的是「应用声明的缺省」；用户手动切换后以 localStorage 里的偏好优先。要避免首帧闪一下浅色，把 themeInitSnippet 贴进 index.html 的 <head>。"
    >
      <pre class="code"><code>{{ configureSnippet }}</code></pre>
      <p class="note">下面是 themeInitSnippet 的实际内容（与 useColorMode() 读同一组 key，两边同源）：</p>
      <pre class="code"><code>{{ themeInitSnippet }}</code></pre>
    </DemoBlock>

    <DemoBlock
      title="与 ConfigProvider 的分工"
      description="ConfigProvider 的 theme 是「子树局部覆盖」：变量写在它的包裹 div 上，只影响这棵子树，Teleport 出去的浮层也吃不到。全局换色一律走这一页的 API。"
    >
      <je-config-provider :theme="{ primary: '#10b981' }">
        <div class="toolbar">
          <je-button type="primary">这片区被局部改成绿色</je-button>
        </div>
      </je-config-provider>
      <p class="note">它不影响 &lt;html&gt; 上的全局值，也不影响下面这个对照按钮。</p>
      <div class="toolbar">
        <je-button type="primary">对照按钮（跟随全局 token）</je-button>
      </div>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.toolbar + .toolbar {
  margin-top: 12px;
}

.note {
  margin: 12px 0 8px;
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

/* 取色器一行：名称 + 一块圆角色板 */
.pick {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border: var(--je-border);
  border-radius: var(--je-radius-sm);
  cursor: pointer;
}

.pick__name {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  color: var(--je-text-muted);
}

.pick__input {
  width: 26px;
  height: 26px;
  padding: 0;
  background: none;
  border: none;
  border-radius: 7px;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
}

.pick__input::-webkit-color-swatch-wrapper {
  padding: 0;
}

.pick__input::-webkit-color-swatch {
  border: none;
  border-radius: 7px;
  box-shadow: inset 0 0 0 1px var(--je-text-faint);
}

.pick__input::-moz-color-swatch {
  border: none;
  border-radius: 7px;
  box-shadow: inset 0 0 0 1px var(--je-text-faint);
}

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
</style>
