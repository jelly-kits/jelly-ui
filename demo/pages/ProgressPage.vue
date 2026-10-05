<script setup lang="ts">
import { computed, ref } from 'vue'
import { JeButton, JeProgress, JeSpace } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const value = ref(40)
const step = (delta: number) => {
  value.value = Math.min(100, Math.max(0, value.value + delta))
}

const circle = ref(66)
const stepCircle = (delta: number) => {
  circle.value = Math.min(100, Math.max(0, circle.value + delta))
}

const status = computed(() => {
  if (value.value >= 100) return 'success' as const
  if (value.value >= 80) return 'warning' as const
  return '' as const
})
</script>

<template>
  <DemoPage
    title="Progress 进度条"
    description="线性与环形两种形态，环形由内联 SVG 自绘。支持状态色、条纹滚动与不确定进度，并带完整的 progressbar 无障碍属性。"
  >
    <DemoBlock title="基础用法" description="窄屏下百分比文案会换行到进度条下方，字号自适应。">
      <je-progress :percentage="value" />
      <je-space>
        <je-button variant="ghost" @click="step(-10)">-10%</je-button>
        <je-button @click="step(10)">+10%</je-button>
      </je-space>
    </DemoBlock>

    <DemoBlock title="状态与自定义颜色" description="status 优先级高于 color，达到 100% 自动转为成功色。">
      <je-progress :percentage="value" :status="status" />
      <je-progress :percentage="60" status="warning" />
      <je-progress :percentage="80" status="danger" />
      <je-progress :percentage="45" color="#38bdf8" :stroke-width="12" />
    </DemoBlock>

    <DemoBlock title="条纹与不确定进度" description="striped 用重复线性渐变绘制条纹，animated 让条纹滚动；indeterminate 忽略百分比做无限滑动。">
      <je-progress :percentage="70" striped />
      <je-progress :percentage="70" striped animated status="success" />
      <je-progress :percentage="0" indeterminate />
    </DemoBlock>

    <DemoBlock title="环形" description="circle 类型用 SVG 的 stroke-dasharray / dashoffset 绘制，不依赖任何第三方库。">
      <je-space>
        <je-progress :percentage="circle" type="circle" />
        <je-progress :percentage="circle" type="circle" :stroke-width="12" status="success" />
        <je-progress :percentage="30" type="circle" indeterminate />
      </je-space>
      <je-space>
        <je-button variant="ghost" @click="stepCircle(-10)">-10%</je-button>
        <je-button @click="stepCircle(10)">+10%</je-button>
      </je-space>
    </DemoBlock>
  </DemoPage>
</template>
