<script setup lang="ts">
import { ref } from 'vue'
import { JeAutoComplete } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

interface Option {
  value: string
  label?: string
  disabled?: boolean
}

const fruits = [
  '苹果',
  '香蕉',
  '樱桃',
  '蓝莓',
  '荔枝',
  '榴莲',
  '火龙果',
  '猕猴桃',
  '葡萄',
  '芒果',
]

/** 同步回调：直接按关键字过滤 */
const fetchSync = (query: string): Option[] =>
  fruits
    .filter((item) => item.includes(query.trim()))
    .map((item) => ({ value: item, label: item, disabled: item === '榴莲' }))

/** 异步回调：用定时器模拟接口延迟，方便观察加载态 */
const fetchAsync = (query: string) =>
  new Promise<Option[]>((resolve) => {
    setTimeout(() => {
      resolve(fetchSync(query))
    }, 600)
  })

const basic = ref('')
const asyncValue = ref('')
const opened = ref(false)
const picked = ref('尚未选择')

const onSelect = (option: Option) => {
  opened.value = true
  picked.value = option.label ?? option.value
}
</script>

<template>
  <DemoPage
    title="AutoComplete 自动填充"
    description="输入时防抖拉取候选，支持键盘上下键高亮、Enter 选中、Esc 关闭。桌面端为锚点浮层，窄屏切换为底部弹出层（可下拉关闭、锁定滚动、预留安全区）。"
  >
    <DemoBlock title="基础用法" description="同步回调，输入关键字即时过滤；禁用项会被键盘跳过。">
      <je-auto-complete
        v-model="basic"
        :fetch-suggestions="fetchSync"
        placeholder="搜索水果"
        :debounce="120"
        @select="onSelect"
      />
      <p class="state">已选：{{ picked }} · 输入值：{{ basic || '空' }}</p>
    </DemoBlock>

    <DemoBlock title="异步与加载态" description="返回 Promise 时会显示 loading 图标的加载文案，新输入会丢弃过期结果。">
      <je-auto-complete
        v-model="asyncValue"
        :fetch-suggestions="fetchAsync"
        placeholder="异步搜索水果"
        loading-text="查询中…"
        empty-text="没有找到水果"
      />
      <p class="state">输入值：{{ asyncValue || '空' }} · 是否选择过：{{ opened ? '是' : '否' }}</p>
    </DemoBlock>

    <DemoBlock title="禁用与不可清空" description="disabled 整体禁用；clearable 设为 false 时不显示清空按钮。">
      <je-auto-complete :fetch-suggestions="fetchSync" :clearable="false" placeholder="不可清空" />
      <je-auto-complete :fetch-suggestions="fetchSync" disabled placeholder="禁用状态" />
    </DemoBlock>

    <DemoBlock title="移动端" description="窄屏（≤768px）下面板贴底弹出，选项热区不小于 44px，向下拖动把手即可关闭。">
      <p class="state">把视口缩到 768px 以下体验底部弹出层形态。</p>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.state {
  margin: 10px 0 0;
  font-size: 12px;
  color: var(--je-text-faint);
}
</style>
