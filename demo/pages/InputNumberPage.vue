<script setup lang="ts">
import { ref } from 'vue'
import { JeField, JeInputNumber } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const quantity = ref<number | null>(1)
const price = ref<number | null>(9.9)
const limited = ref<number | null>(5)
</script>

<template>
  <DemoPage
    title="InputNumber 计数器"
    description="支持步长、范围与精度控制；窄屏下加减按钮热区会放大到 48px。"
  >
    <DemoBlock title="基础用法">
      <je-field label="数量">
        <je-input-number v-model="quantity" :min="0" :max="99" />
      </je-field>
      <p class="state">当前值：{{ quantity ?? 'null' }}</p>
    </DemoBlock>

    <DemoBlock title="步长与精度">
      <je-field label="单价（步长 0.5，两位小数）">
        <je-input-number v-model="price" :step="0.5" :precision="2" :min="0" />
      </je-field>
    </DemoBlock>

    <DemoBlock title="禁用与无按钮">
      <je-field label="限制在 1 ~ 10">
        <je-input-number v-model="limited" :min="1" :max="10" />
      </je-field>
      <je-field label="隐藏加减按钮">
        <je-input-number :controls="false" :model-value="42" />
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