<script setup lang="ts">
import { defineComponent, ref } from 'vue'
import { formatMessage, JeButton, JeLocale, useJeLocale } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const locale = ref<'zh-CN' | 'en-US'>('zh-CN')

/**
 * 探针组件：useJeLocale() 必须在子组件里调用，才能 inject 到祖先下发的语言包。
 * 用 defineComponent 写在同一个 script setup 内（不另开第二个 script 块，
 * 避免打断 demoCode.ts 的源码裁剪），模板通过带 v-slot 的 LocaleProbe 取文案。
 */
const LocaleProbe = defineComponent({
  name: 'LocaleProbe',
  setup(_props, { slots }) {
    const { t, name } = useJeLocale()
    // 在渲染函数里读 name.value / 调用 t()，依赖才会被收集，切语言实时更新
    return () => slots.default?.({ t, name: name.value })
  },
})

/* 代码示例用单行字符串数组拼接：demoCode.ts 按行统计括号深度，多行模板串会被切碎 */
const rootSnippet = [
  '<je-config-provider',
  '  size="small"',
  '  :theme="{ \'--je-primary\': \'#10b981\' }"',
  '  locale="zh-CN"',
  '  teleport-to="#app"',
  '>',
  '  <router-view />',
  '</je-config-provider>',
].join('\n')

const globalSnippet = [
  "import { configureJelly } from '@jelly-kits/jelly-ui'",
  '',
  '// 应用级缺省，建议在 app.mount() 之前调用一次；',
  '// 命令式 API（showMessage / showDialog …）在组件树之外，只读得到它',
  "configureJelly({ locale: 'en-US' })",
].join('\n')

const adapterSnippet = [
  "import { configureJelly } from '@jelly-kits/jelly-ui'",
  "import { i18n } from './i18n' // 你项目里的 vue-i18n 实例",
  '',
  '// Jelly 用自己的 key 逐条去问 t()，取不到的键回落 zh-CN；',
  '// t() 读到的响应式来源会被收集，切换语言会自动重渲染。',
  'configureJelly({',
  '  locale: {',
  '    name: i18n.global.locale.value,',
  '    t: i18n.global.t,',
  "    prefix: 'jelly.',",
  '  },',
  '})',
].join('\n')

const registerSnippet = [
  "import { registerJellyLocale } from '@jelly-kits/jelly-ui'",
  '',
  '// 只需写要覆盖的字段，其余回落 zh-CN；同名可覆盖（含内置 en-US）',
  "registerJellyLocale('ja-JP', {",
  "  confirm: '確認',",
  "  cancel: 'キャンセル',",
  "  signature: { tip: '上の空白部分に署名してください' },",
  '})',
].join('\n')
</script>

<template>
  <DemoPage
    title="Locale 国际化"
    description="内置 zh-CN / en-US 两套语言包，通过 Locale 或 ConfigProvider 下发；子组件用 useJeLocale().t() 取文案，也支持注册新语言或接入项目自有的翻译函数。"
  >
    <DemoBlock
      title="切换语言"
      description="在任意位置包一层 Locale 传入 locale，子组件用 useJeLocale() 拿到 t() 取文案，并随切换实时更新；name 是当前语言标识。"
    >
      <div class="toolbar">
        <je-button
          size="small"
          :type="locale === 'zh-CN' ? 'primary' : 'default'"
          @click="locale = 'zh-CN'"
        >
          中文
        </je-button>
        <je-button
          size="small"
          :type="locale === 'en-US' ? 'primary' : 'default'"
          @click="locale = 'en-US'"
        >
          English
        </je-button>
      </div>

      <je-locale :locale="locale">
        <LocaleProbe v-slot="m">
          <dl class="probe">
            <dt>name</dt>
            <dd>{{ m.name }}</dd>
            <dt>t('confirm')</dt>
            <dd>{{ m.t('confirm') }}</dd>
            <dt>t('cancel')</dt>
            <dd>{{ m.t('cancel') }}</dd>
            <dt>t('loading')</dt>
            <dd>{{ m.t('loading') }}</dd>
            <dt>t('signature.clear')</dt>
            <dd>{{ m.t('signature.clear') }}</dd>
            <dt>t('shareSheet.title')</dt>
            <dd>{{ m.t('shareSheet.title') }}</dd>
            <dt>t('imagePreview.close')</dt>
            <dd>{{ m.t('imagePreview.close') }}</dd>
            <dt>未命中（返回 key 本身）</dt>
            <dd>{{ m.t('not.exist') }}</dd>
          </dl>
        </LocaleProbe>
      </je-locale>
    </DemoBlock>

    <DemoBlock
      title="带占位符的文案"
      description="t(key, params) 会自动插值 {name} 占位符；imagePreview.index 默认就是 '{current} / {total}' 这种模板串。"
    >
      <je-locale :locale="locale">
        <LocaleProbe v-slot="m">
          <p class="fmt">
            <code class="fmt__code">t('imagePreview.index', { current: 2, total: 5 })</code>
            <span class="fmt__out">
              {{ m.t('imagePreview.index', { current: 2, total: 5 }) }}
            </span>
          </p>
          <p class="fmt">
            <code class="fmt__code">formatMessage('{current} / {total}', { current: 2, total: 5 })</code>
            <span class="fmt__out">{{ formatMessage('{current} / {total}', { current: 2, total: 5 }) }}</span>
          </p>
        </LocaleProbe>
      </je-locale>
    </DemoBlock>

    <DemoBlock
      title="局部覆盖单条文案"
      description="内层 Locale 传部分覆盖对象时，只有写到的字段被替换，其余字段继续继承外层语言包。"
    >
      <je-locale locale="en-US">
        <LocaleProbe v-slot="outer">
          <dl class="probe">
            <dt>外层 t('confirm')</dt>
            <dd>{{ outer.t('confirm') }}</dd>
            <dt>外层 t('cancel')</dt>
            <dd>{{ outer.t('cancel') }}</dd>
          </dl>
        </LocaleProbe>

        <je-locale :locale="{ confirm: 'OK!' }">
          <LocaleProbe v-slot="inner">
            <dl class="probe">
              <dt>内层 t('confirm')（被覆盖）</dt>
              <dd>{{ inner.t('confirm') }}</dd>
              <dt>内层 t('cancel')（继承外层 en-US）</dt>
              <dd>{{ inner.t('cancel') }}</dd>
            </dl>
          </LocaleProbe>
        </je-locale>
      </je-locale>
    </DemoBlock>

    <DemoBlock
      title="在应用根部统一配置"
      description="推荐在入口同时设置 locale 与 theme，子树里的文案与浮层都会自动跟随。"
    >
      <pre class="code"><code>{{ rootSnippet }}</code></pre>
    </DemoBlock>

    <DemoBlock
      title="应用级语言（configureJelly）"
      description="四层回退链：组件自身 / 最近的 Locale 或 ConfigProvider → configureJelly() → 内置 zh-CN，第一个有值的生效。命令式 API 拿不到 provide 链，只读得到 configureJelly()，所以应用级语言建议在这里设一次。"
    >
      <pre class="code"><code>{{ globalSnippet }}</code></pre>
      <p class="note">
        内置 zh-CN / en-US 两套语言包，覆盖 confirm、cancel、loading、signature、shareSheet、imagePreview、
        orgChart 等文案；加第三种语言用 registerJellyLocale()，接项目自有的翻译体系用适配器（见下两节），不必等库内置。
        只要显式配置过 locale，库就会把语言标识同步写入 &lt;html lang&gt;；完全没配过则不动这个属性。
      </p>
    </DemoBlock>

    <DemoBlock
      title="注册新语言（registerJellyLocale）"
      description="只需写要覆盖的字段，其余回落简体中文；同名可覆盖（也允许覆盖内置的 en-US）。注册后可直接用语言名下发。"
    >
      <pre class="code"><code>{{ registerSnippet }}</code></pre>
    </DemoBlock>

    <DemoBlock
      title="接入项目自有的翻译函数（适配器）"
      description="已有 vue-i18n 或自研 t() 时，把 { name, t, prefix } 作为 locale 传进来即可 —— Jelly 用自己的 key 逐条去问它，取不到的键回落简体中文，切换语言会自动重渲染。"
    >
      <pre class="code"><code>{{ adapterSnippet }}</code></pre>
      <p class="note">
        key 就是组件内部用的那套点路径：confirm、cancel、loading、signature.clear、signature.undo、signature.tip、
        shareSheet.title、shareSheet.cancel、imagePreview.close、imagePreview.index、orgChart.name、orgChart.title、
        orgChart.addChild、orgChart.remove、orgChart.removeConfirm、orgChart.removeConfirmLeaf、orgChart.newNode。
        prefix 用于把它们挂到你的命名空间下（如 jelly.）。
      </p>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.toolbar {
  display: flex;
  gap: 10px;
}

.note {
  margin: 12px 0 0;
  font-size: 13px;
  line-height: 1.7;
  color: var(--je-text-muted);
}

.probe {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 8px 16px;
  margin: 0;
  font-size: 13px;
}

.probe dt {
  color: var(--je-text-faint);
}

.probe dd {
  margin: 0;
  color: var(--je-text);
}

.fmt {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 12px;
  margin: 0;
  font-size: 13px;
}

.fmt__code {
  padding: 2px 8px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12.5px;
  color: var(--je-text-muted);
  background: var(--je-surface-hover);
  border-radius: var(--je-radius-sm);
}

.fmt__out {
  font-weight: 600;
  color: color-mix(in srgb, var(--je-primary) 60%, var(--je-text));
}

.code {
  margin: 0;
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