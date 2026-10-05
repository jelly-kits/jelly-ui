<script setup lang="ts">
import { ref } from 'vue'
import { JeSwitch, type JeSwitchValue } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const enabled = ref<JeSwitchValue>(true)
const value = ref<JeSwitchValue>('on')
const busy = ref<JeSwitchValue>(true)
</script>

<template>
  <DemoPage
    title="Switch 开关"
    description="用 role=switch 标识状态，滑块位移带轻微过冲；窄屏保证 44px 触控热区。"
  >
    <DemoBlock title="基础用法">
      <je-switch v-model="enabled" active-text="开" inactive-text="关" />
      <p class="state">当前状态：{{ enabled }}</p>
    </DemoBlock>

    <DemoBlock title="自定义取值">
      <je-switch v-model="value" active-value="on" inactive-value="off" />
      <p class="state">当前值：{{ value }}</p>
    </DemoBlock>

    <DemoBlock title="加载与禁用">
      <je-switch v-model="busy" loading />
      <je-switch :model-value="false" disabled />
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