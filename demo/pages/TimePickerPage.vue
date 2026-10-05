<script setup lang="ts">
import { ref } from 'vue'
import { JeField, JeTimePicker } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const time = ref<string | null>(null)
const stepped = ref<string | null>('09:30')
</script>

<template>
  <DemoPage
    title="TimePicker 时间选择器"
    description="双列滚轮选择小时与分钟，点中的单元格播放 pop 动画。窄屏下切换为底部弹出层。"
  >
    <DemoBlock title="基础用法">
      <je-field label="活动时间">
        <je-time-picker v-model="time" />
      </je-field>
      <p class="state">当前值：{{ time ?? 'null' }}</p>
    </DemoBlock>

    <DemoBlock title="自定义步长">
      <je-field label="半小时粒度（分钟步长 30）">
        <je-time-picker v-model="stepped" :minute-step="30" />
      </je-field>
    </DemoBlock>

    <DemoBlock title="禁用">
      <je-field label="不可选择">
        <je-time-picker disabled />
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