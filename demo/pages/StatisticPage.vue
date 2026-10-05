<script setup lang="ts">
import { ref } from 'vue'
import { JeButton, JeStatistic } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const amount = ref(12888)

const add = () => {
  amount.value += 1000
}
const randomize = () => {
  amount.value = Math.round(Math.random() * 90000) + 1000
}
const reset = () => {
  amount.value = 0
}
</script>

<template>
  <DemoPage
    title="Statistic 统计数值"
    description="展示统计数据，支持精度控制、千分位分隔与前后缀插槽；value 变化时数字会滚动到新值。"
  >
    <DemoBlock title="基础用法">
      <je-statistic title="活跃用户" :value="12888" />
    </DemoBlock>

    <DemoBlock title="精度与前缀后缀">
      <div class="row">
        <je-statistic title="销售额" :value="1299.5" :precision="2" prefix="￥" />
        <je-statistic title="转化率" :value="86.5" :precision="1" suffix="%" />
        <je-statistic title="温度" :value="-12.34" :precision="1" suffix="℃" />
      </div>
    </DemoBlock>

    <DemoBlock title="关闭千分位 / 自定义分隔符">
      <div class="row">
        <je-statistic title="原始值" :value="1234567" :use-group-separator="false" />
        <je-statistic title="点分隔" :value="1234567" separator="." />
      </div>
    </DemoBlock>

    <DemoBlock
      title="数值变化动画"
      description="value 变化时数字滚动到新值（走弹簧内核，几乎不过冲）；右侧那个关掉了 animation，直接跳变。"
    >
      <div class="row">
        <je-statistic title="今日成交额" :value="amount" prefix="￥" />
        <je-statistic title="直接跳变" :value="amount" prefix="￥" :animation="false" />
      </div>
      <div class="actions">
        <je-button size="small" @click="add">+ 1,000</je-button>
        <je-button size="small" variant="ghost" @click="randomize">随机</je-button>
        <je-button size="small" variant="ghost" @click="reset">归零</je-button>
      </div>
    </DemoBlock>

    <DemoBlock title="插槽用法">
      <je-statistic :value="9988">
        <template #title>今日访问</template>
        <template #prefix>PV</template>
        <template #suffix>次</template>
      </je-statistic>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.row {
  display: flex;
  flex-wrap: wrap;
  gap: 32px;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
