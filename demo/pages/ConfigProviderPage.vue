<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { JeActionBarButton, JeButton, JeConfigProvider, JeDialog } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

/** 键名两种写法混用：primary 与 --je-primary-end 都会被补成对应 CSS 变量 */
const theme = {
  primary: '#10b981',
  '--je-primary-end': '#059669',
}

/** teleportTo 演示的开关 */
const mountedDialog = ref(false)

/*
 * 挂载点盒子由本页自己渲染，而 Teleport 只在挂载那一刻解析一次选择器 —— 同一个组件里
 * 「先渲染盒子、后挂浮层」是来不及的（盒子此刻还不在 DOM 里），所以等本页 onMounted 之后再挂浮层。
 * 真实项目里挂载点一般在 index.html 里静态存在，不需要这道门。
 */
const shellReady = ref(false)
onMounted(() => {
  shellReady.value = true
})

/* 代码示例用单行字符串数组拼接：demoCode.ts 按行统计括号深度，多行模板串会被切碎 */
const teleportSnippet = [
  '<je-config-provider teleport-to="#app-shell">',
  '  <!-- 目标节点要在浮层挂载时就已经存在，否则 Teleport 找不到会退回就地渲染 -->',
  '  <router-view />',
  '</je-config-provider>',
].join('\n')

const teleportGlobalSnippet = [
  "import { configureJelly } from '@jelly-kits/jelly-ui'",
  '',
  '// 应用级缺省值。组件树之外也读得到（命令式 API 靠它定位宿主节点），',
  '// 建议在 app.mount() 之前调用一次',
  "configureJelly({ teleportTo: '#app-shell', size: 'small', zIndexBase: 3000 })",
].join('\n')

const teleportReadSnippet = [
  "import { useJeConfig, useTeleportTarget } from '@jelly-kits/jelly-ui'",
  '',
  '// 自研浮层：只取配置值，缺省回落 body',
  'const { teleportTo } = useJeConfig()',
  "const target = teleportTo.value ?? 'body'",
  '',
  '// 或者直接用库内那套组合式，把「组件自身 prop」也算进同一条回退链：',
  'const resolved = useTeleportTarget(() => props.teleportTo)',
].join('\n')
</script>

<template>
  <DemoPage
    title="ConfigProvider 子树配置"
    description="通过 provide 向子树下发主题变量、组件尺寸、语言包与浮层挂载点；根元素是 display: contents，只做变量下发，不参与外层布局。它下发的是「子树局部覆盖」—— 应用级（全局）缺省走 configureJelly()，见 Theme 页。"
  >
    <DemoBlock
      title="主题变量覆盖"
      description="theme 里的键会补成 --je-* 变量，在子树范围内覆盖主题 token，键名写 primary 或 --je-primary 都可以。注意这是局部覆盖：变量落在本组件的包裹 div 上，只作用于这棵子树 —— Teleport 到 body 的浮层不在其中，吃不到这套色。整站换肤不走 ConfigProvider，见 Theme 页。"
    >
      <div class="scope">
        <je-config-provider :theme="theme">
          <div class="scope__inner">
            <je-button type="primary">绿色主按钮</je-button>
            <je-button type="primary" plain>素色按钮</je-button>
            <p class="scope__hint">
              这一片区的 --je-primary / --je-primary-end 已被替换，按钮颜色与渐变随之变成绿色。
            </p>
          </div>
        </je-config-provider>
      </div>
      <div class="compare">
        <je-button type="primary">未套 Provider 的对照按钮</je-button>
      </div>
    </DemoBlock>

    <DemoBlock
      title="子树默认尺寸（size）"
      description="size 作为子树缺省值下发，会读取配置的组件（如 ActionBarButton）自动跟随；组件自身传了 size 时以自身为准。要设应用级缺省（全站生效）用 configureJelly({ size: 'small' })。"
    >
      <div class="sizes">
        <div class="sizes__col">
          <span class="sizes__label">size="small"</span>
          <je-config-provider size="small">
            <div class="sizes__row">
              <je-action-bar-button text="跟随全局" />
              <je-action-bar-button text="自身 large" size="large" />
            </div>
          </je-config-provider>
        </div>

        <div class="sizes__col">
          <span class="sizes__label">size="large"</span>
          <je-config-provider size="large">
            <div class="sizes__row">
              <je-action-bar-button text="跟随全局" />
              <je-action-bar-button text="自身 default" size="default" />
            </div>
          </je-config-provider>
        </div>
      </div>
    </DemoBlock>

    <DemoBlock
      title="浮层挂载节点（teleportTo）"
      description="teleportTo 决定库内浮层的 DOM 挂到哪个节点。回退链是「组件自身 teleportTo → 最近的 JeConfigProvider → configureJelly() → body」，四层里第一个有值的生效；组件传 false 表示就地渲染、不传送。下面的演示把挂载点指向左框，打开对话框就能看到面板挂进了左框而不是 body。"
    >
      <div class="tp">
        <div id="cp-demo-shell" class="tp__shell">
          <span class="tp__shell-label">#cp-demo-shell</span>
        </div>

        <je-config-provider v-if="shellReady" teleport-to="#cp-demo-shell">
          <div class="tp__side">
            <je-button type="primary" @click="mountedDialog = true">打开对话框</je-button>
            <p class="note">
              面板的 DOM 会挂进左框里（左框加了 transform 才把 position: fixed 圈在框内）。把这个 Provider 的
              teleport-to 去掉，它就回落到 body。
            </p>
          </div>
          <je-dialog v-model="mountedDialog" title="我挂进了左框" width="260">
            这层面板的父节点是 #cp-demo-shell，不是 body。
          </je-dialog>
        </je-config-provider>
      </div>

      <p class="note">
        目标节点必须在浮层挂载时就已经存在于 DOM 里：Teleport 只在挂载那一刻解析一次选择器，找不到会退回就地渲染（并打印一条警告）。
        这个演示的挂载点是本页自己渲染的，所以要等它进 DOM 之后再挂浮层（脚本里用 <code>onMounted</code> 开这道门）；真实项目里挂载点通常写在
        index.html 里、天然先于组件存在。
        应用级缺省值走 configureJelly()，它写在组件树之外也能被读到 —— 命令式 API（showMessage / showDialog …）各自建宿主节点，拿不到 provide 链，只能读它。
      </p>
      <pre class="code"><code>{{ teleportSnippet }}</code></pre>
      <pre class="code"><code>{{ teleportGlobalSnippet }}</code></pre>
      <pre class="code"><code>{{ teleportReadSnippet }}</code></pre>
      <p class="note">
        JeDialog 的 appendTo / appendToBody、JeMessage / JeNotification / JeNumberKeyboard 的 teleport 都是旧名，已保留兼容，
        新代码统一写 teleportTo；四层之外组件还有各自的私有缺省（如 JeLoading 只在全屏时传送）。
      </p>
    </DemoBlock>

    <DemoBlock
      title="嵌套与继承"
      description="内层 Provider 会覆盖外层同名配置，未被内层声明的字段继续沿用外层。"
    >
      <div class="nest">
        <je-config-provider size="small">
          <span class="nest__label">外层 Provider：size="small"</span>
          <div class="nest__row">
            <je-action-bar-button text="直接子级跟随 small" />
          </div>
          <je-config-provider size="large">
            <div class="nest__inner">
              <span class="nest__label">内层 Provider：size="large" 覆盖外层</span>
              <div class="nest__row">
                <je-action-bar-button text="内层子级跟随 large" />
              </div>
            </div>
          </je-config-provider>
        </je-config-provider>
      </div>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.scope {
  padding: 18px;
  background: var(--je-surface-hover);
  border: var(--je-border);
  border-radius: var(--je-radius-lg);
}

.scope__inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.scope__hint {
  width: 100%;
  margin: 0;
  font-size: 13px;
  color: var(--je-text-faint);
}

.compare {
  display: flex;
}

.sizes {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.sizes__col {
  padding: 14px;
  background: var(--je-surface-hover);
  border-radius: var(--je-radius);
}

.sizes__label,
.nest__label {
  display: block;
  margin-bottom: 10px;
  font-size: 12px;
  font-weight: 600;
  color: var(--je-text-muted);
}

.sizes__row,
.nest__row {
  display: flex;
  gap: 10px;
}

.sizes__row :deep(.je-action-bar__button),
.nest__row :deep(.je-action-bar__button) {
  flex: 1 1 0;
  max-width: none;
}

.note {
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
  color: var(--je-text-muted);
}

/* teleportTo 演示：左边是挂载点盒子，右边是触发按钮 */
.tp {
  display: flex;
  gap: 16px;
  align-items: stretch;
}

/*
 * 挂载点盒子：transform 让它成为 position: fixed 的包含块（否则面板会铺满整个视口），
 * overflow: hidden 顺便把面板圈在框内，一眼就能看出「DOM 挂在这里」。
 */
.tp__shell {
  position: relative;
  flex: 0 0 260px;
  min-height: 260px;
  overflow: hidden;
  background: var(--je-surface-hover);
  border: 1px dashed var(--je-border-color);
  border-radius: var(--je-radius);
  transform: translate(0);
}

.tp__shell-label {
  position: absolute;
  top: 10px;
  left: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  color: var(--je-text-faint);
}

.tp__side {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

@media (max-width: 768px) {
  .tp {
    flex-direction: column;
  }

  .tp__shell {
    flex: 0 0 auto;
    min-height: 200px;
  }
}

/* 说明与代码块交替堆叠时留出间距（各自 margin 都是 0） */
.note + .code,
.code + .code,
.code + .note {
  margin-top: 12px;
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

.nest {
  padding: 16px;
  background: var(--je-surface-hover);
  border-radius: var(--je-radius);
}

.nest__inner {
  margin-top: 14px;
  padding: 12px;
  border: 1px dashed var(--je-border-color);
  border-radius: var(--je-radius);
}
</style>