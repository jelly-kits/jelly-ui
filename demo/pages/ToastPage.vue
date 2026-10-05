<script setup lang="ts">
import { ref } from 'vue'
import { JeButton, JeSpace, JeToast } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

type ToastVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'

const visible = ref(false)
const shortVisible = ref(false)
const variant = ref<ToastVariant>('primary')
const variantVisible = ref(false)

const showVariant = (value: ToastVariant) => {
  variant.value = value
  variantVisible.value = true
}
</script>

<template>
  <DemoPage
    title="Toast 提示"
    description="轻量提示条，出现时带回弹缩放，默认 1.8 秒后自动隐藏。"
  >
    <DemoBlock title="基础用法">
      <je-button @click="visible = true">显示提示</je-button>
    </DemoBlock>

    <DemoBlock title="语义类型" description="variant 决定皮肤，与 Button / Text 的语义色一一对应。">
      <je-space wrap>
        <je-button @click="showVariant('primary')">主要</je-button>
        <je-button variant="success" @click="showVariant('success')">成功</je-button>
        <je-button variant="warning" @click="showVariant('warning')">警告</je-button>
        <je-button variant="danger" @click="showVariant('danger')">危险</je-button>
        <je-button variant="info" @click="showVariant('info')">信息</je-button>
        <je-button variant="default" @click="showVariant('default')">默认</je-button>
      </je-space>
    </DemoBlock>

    <DemoBlock title="自定义时长">
      <je-space>
        <je-button @click="shortVisible = true">0.6 秒后消失</je-button>
      </je-space>
    </DemoBlock>

    <je-toast v-model="visible">提交成功</je-toast>
    <je-toast v-model="shortVisible" :duration="600" message="这是一条短提示" />
    <je-toast v-model="variantVisible" :variant="variant" message="这是一条语义提示" />
  </DemoPage>
</template>