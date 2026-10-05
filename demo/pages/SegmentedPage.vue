<script setup lang="ts">
import { ref } from 'vue'
import { JeSegmented, type JeSegmentedOption } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const view = ref<string | number>('list')
const size = ref<string | number>('medium')

const views: JeSegmentedOption[] = [
  { label: '列表', value: 'list' },
  { label: '网格', value: 'grid' },
  { label: '时间线', value: 'timeline' },
]

const sizes: JeSegmentedOption[] = [
  { label: '小', value: 'small' },
  { label: '中', value: 'medium' },
  { label: '大', value: 'large', disabled: true },
]
</script>

<template>
  <DemoPage
    title="Segmented 分段控制器"
    description="选中态滑块带过冲缓动；窄屏下每格最小 88px，超出可横向滑动。"
  >
    <DemoBlock title="基础用法">
      <je-segmented v-model="view" :options="views" />
      <p class="state">当前视图：{{ view }}</p>
    </DemoBlock>

    <DemoBlock title="含有禁用项">
      <je-segmented v-model="size" :options="sizes" />
      <p class="state">当前尺寸：{{ size }}</p>
    </DemoBlock>

    <DemoBlock title="撑满宽度">
      <je-segmented v-model="view" :options="views" block />
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