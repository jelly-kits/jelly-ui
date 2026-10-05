<script setup lang="ts">
import { ref } from 'vue'
import { JeDatePicker, JeField } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

/** 与组件 emit 的联合类型保持一致 */
type PickerValue = Date | string | null | [Date | string | null, Date | string | null]

const date = ref<PickerValue>(null)
const datetime = ref<PickerValue>(null)
const range = ref<PickerValue>(null)
const fixed = ref<PickerValue>('2024-06-18')
const disabled = ref<PickerValue>(null)

/** 周末不可选 */
const disabledDate = (value: Date) => value.getDay() === 0 || value.getDay() === 6

const show = (value: PickerValue) => {
  if (value === null) return 'null'
  if (Array.isArray(value)) {
    return value
      .map((item) => (item instanceof Date ? item.toLocaleDateString() : item ?? '--'))
      .join(' ~ ')
  }
  return value instanceof Date ? value.toLocaleString() : value
}
</script>

<template>
  <DemoPage
    title="DatePicker 日期选择器"
    description="支持日期 / 日期时间 / 日期区间三种形态。datetime 走两步：先在日历里选日期，再在时间步骤里调时与分，点「确定」才写回 v-model。窄屏下自动切换为底部弹出层，日期格子热区不小于 44px。"
  >
    <DemoBlock title="基础用法" description="把视口缩到 768px 以下即可看到底部弹出层形态。">
      <je-field label="选择日期">
        <je-date-picker v-model="date" />
      </je-field>
      <p class="state">当前值：{{ show(date) }}</p>
    </DemoBlock>

    <DemoBlock
      title="日期时间"
      description="两步式：点日历里的某一天进入第二步，滚动时 / 分两列挑选，点「确定」才提交并收起，「上一步」可以回去改日期；中途不会往 v-model 写半成品。"
    >
      <je-field label="选择日期时间">
        <je-date-picker v-model="datetime" type="datetime" />
      </je-field>
      <p class="state">当前值：{{ show(datetime) }}</p>
    </DemoBlock>

    <DemoBlock title="日期区间" description="并排两个日历，先点起点再点终点，区间内高亮。">
      <je-field label="入住区间">
        <je-date-picker v-model="range" type="daterange" placeholder="请选择日期范围" />
      </je-field>
      <p class="state">当前值：{{ show(range) }}</p>
    </DemoBlock>

    <DemoBlock title="禁用态与自定义规则" description="weekStart 默认为 1（周一），可通过 disabledDate 置灰不可选日期。">
      <je-field label="周末不可选">
        <je-date-picker v-model="disabled" :disabled-date="disabledDate" />
      </je-field>
      <je-field label="禁用">
        <je-date-picker v-model="fixed" disabled />
      </je-field>
      <p class="state">当前值：{{ show(disabled) }} · 固定值：{{ show(fixed) }}</p>
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
