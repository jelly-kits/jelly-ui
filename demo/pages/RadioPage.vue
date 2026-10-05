<script setup lang="ts">
import { ref } from 'vue'
import { JeField, JeRadioGroup, type JeRadioOption } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const modes: JeRadioOption[] = [
  { label: '线上参与', value: 'online' },
  { label: '线下参与', value: 'offline' },
  { label: '线上线下结合', value: 'hybrid' },
]

const mode = ref<string | number | null>('online')
</script>

<template>
  <DemoPage
    title="Radio 单选框"
    description="原生 radio 保留语义与方向键行为，选中圆圈播放一次性 pop 动画。"
  >
    <DemoBlock title="基础用法">
      <je-field label="参与方式">
        <je-radio-group v-model="mode" :options="modes" />
      </je-field>
      <p class="state">当前值：{{ mode ?? 'null' }}</p>
    </DemoBlock>

    <DemoBlock title="禁用">
      <je-field label="不可选择">
        <je-radio-group :options="modes" disabled />
      </je-field>
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