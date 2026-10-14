<script setup lang="ts">
import { ref } from 'vue'
import { JeRate } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const score = ref(3)
const half = ref(2.5)
const readonly = ref(4)
</script>

<template>
  <DemoPage
    title="Rate 评分"
    description="用宽度裁切实现整星 / 半星；鼠标悬停可预览，触屏直接点击设值。"
  >
    <DemoBlock title="基础用法">
      <je-rate v-model="score" />
      <p class="state">当前评分：{{ score }}</p>
    </DemoBlock>

    <DemoBlock title="尺寸" description="size 可传档位或像素数值，不传时取全局配置。">
      <je-rate v-model="score" size="small" />
      <je-rate v-model="score" />
      <je-rate v-model="score" size="large" />
      <je-rate v-model="score" :size="30" />
    </DemoBlock>

    <DemoBlock title="自定义颜色" description="color 传任意 CSS 颜色，覆盖填充星星的默认 warning 色。">
      <je-rate v-model="score" color="#3b82f6" />
      <je-rate :model-value="4" color="#10b981" />
      <p class="state">当前评分：{{ score }}</p>
    </DemoBlock>

    <DemoBlock title="半星与再次点击清零">
      <je-rate v-model="half" allow-half clearable />
      <p class="state">当前评分：{{ half }}</p>
    </DemoBlock>

    <DemoBlock title="自定义数量 / 禁用">
      <je-rate v-model="readonly" :max="10" />
      <je-rate :model-value="3" disabled />
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