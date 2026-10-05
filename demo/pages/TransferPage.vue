<script setup lang="ts">
import { ref } from 'vue'
import { JeTransfer } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const data = [
  { key: 'a', label: '苹果' },
  { key: 'b', label: '香蕉' },
  { key: 'c', label: '樱桃' },
  { key: 'd', label: '榴莲（已下架）', disabled: true },
  { key: 'e', label: '蓝莓' },
  { key: 'f', label: '荔枝' },
]

const picked = ref<(string | number)[]>(['b', 'e'])
const withFilter = ref<(string | number)[]>([])
const log = ref('尚未操作')

const onLog = (value: (string | number)[], direction: string, keys: (string | number)[]) => {
  log.value = `${direction === 'right' ? '移入右侧' : '移入左侧'}：${keys.join('、')}，右侧现有 ${value.length} 项`
}
</script>

<template>
  <DemoPage
    title="Transfer 穿梭框"
    description="左右两栏互相搬运数据，支持全选与可搜索过滤。窄屏下两栏改为上下堆叠、搬运按钮横排，热区不小于 44px。"
  >
    <DemoBlock title="基础用法" description="点击条目勾选，再用中间按钮搬运；change 会回传方向与被移动的 key。">
      <je-transfer v-model="picked" :data="data" @change="onLog" />
      <p class="state">{{ log }}</p>
    </DemoBlock>

    <DemoBlock title="带搜索与自定义标题" description="filterable 打开后每栏顶部出现搜索框，搜索只影响当前显示与全选范围。">
      <je-transfer
        v-model="withFilter"
        :data="data"
        filterable
        :titles="['可选水果', '已选水果']"
        placeholder="搜索水果"
      />
    </DemoBlock>

    <DemoBlock title="禁用态" description="disabled 会同时禁用勾选、搜索与搬运按钮。">
      <je-transfer v-model="picked" :data="data" disabled />
    </DemoBlock>

    <DemoBlock
      title="移动端"
      description="窄屏（≤768px）下两栏上下堆叠，中间按钮横向排列，条目与按钮热区均不小于 44px。"
    >
      <p class="state">把视口缩到 768px 以下体验堆叠形态。</p>
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
