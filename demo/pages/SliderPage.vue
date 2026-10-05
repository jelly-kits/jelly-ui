<script setup lang="ts">
import { computed, ref } from 'vue'
import { JeField, JeSlider } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

/** Slider 的 v-model 同时支持单值与区间，因此这里用联合类型 */
const volume = ref<number | number[]>(40)
const price = ref<number | number[]>([20, 70])
const disabled = ref<number | number[]>(60)

const volumeLabel = computed(() =>
  Array.isArray(volume.value) ? `音量：${volume.value[0]}` : `音量：${volume.value}`,
)

const priceLabel = computed(() =>
  Array.isArray(price.value)
    ? `价格区间：${price.value[0]} ~ ${price.value[1]}`
    : `价格：${price.value}`,
)
</script>

<template>
  <DemoPage
    title="Slider 滑块"
    description="基于 Pointer 事件实现，拖拽时禁用浏览器滚动；把手带 44px 透明热区，并支持键盘方向键。"
  >
    <DemoBlock title="单值">
      <je-field :label="volumeLabel">
        <je-slider v-model="volume" />
      </je-field>
    </DemoBlock>

    <DemoBlock title="范围">
      <je-field :label="priceLabel">
        <je-slider v-model="price" :min="0" :max="100" />
      </je-field>
    </DemoBlock>

    <DemoBlock title="步长与禁用">
      <je-field label="步长 10">
        <je-slider :model-value="30" :step="10" />
      </je-field>
      <je-field label="禁用">
        <je-slider v-model="disabled" disabled />
      </je-field>
    </DemoBlock>
  </DemoPage>
</template>