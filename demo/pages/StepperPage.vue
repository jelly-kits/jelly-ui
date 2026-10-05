<script setup lang="ts">
import { ref } from 'vue'
import { JeStepper } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const count = ref(1)
const stepValue = ref(1)
const price = ref(1)
const limited = ref(5)
const guarded = ref(1)
const log = ref('暂无')

const beforeChange = (next: number, current: number) => {
  log.value = `询问：${current} → ${next}`
  return window.confirm(`确定要从 ${current} 改为 ${next} 吗？`)
}
</script>

<template>
  <DemoPage
    title="Stepper 步进器"
    description="数量加减控件，支持长按连步、整数 / 小数约束、边界拦截与异步 beforeChange 钩子。"
  >
    <DemoBlock title="基础用法" description="默认最小值为 1，长按加减按钮可连续步进。">
      <je-stepper v-model="count" />
      <p class="hint">当前数量：{{ count }}</p>
    </DemoBlock>

    <DemoBlock title="自定义步长与小数" description="step 决定每次增减的幅度，decimalLength 固定小数位数。">
      <je-stepper v-model="stepValue" :step="5" :min="0" :input-width="56" />
      <je-stepper v-model="price" :step="0.5" :min="0" :decimal-length="2" :input-width="64" />
      <p class="hint">步长 5：{{ stepValue }}；步长 0.5：{{ price.toFixed(2) }}</p>
    </DemoBlock>

    <DemoBlock title="限制范围" description="到达 min / max 后继续点击会触发 overlimit 并禁用对应按钮。">
      <je-stepper v-model="limited" :min="1" :max="10" />
      <p class="hint">取值范围 1 ~ 10</p>
    </DemoBlock>

    <DemoBlock title="变更前拦截" description="beforeChange 返回 false（或 resolve false）则放弃本次改动，适合二次确认。">
      <je-stepper v-model="guarded" :before-change="beforeChange" />
      <p class="hint">{{ log }}</p>
    </DemoBlock>

    <DemoBlock title="禁用输入框 / 整体禁用">
      <je-stepper v-model="count" disable-input />
      <je-stepper v-model="count" disabled />
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.je-stepper + .je-stepper {
  margin-left: 16px;
}

.hint {
  margin: 12px 0 0;
  font-size: 13px;
  color: var(--je-text-faint);
}
</style>
