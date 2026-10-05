<script setup lang="ts">
import { JeText } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'
</script>

<template>
  <DemoPage title="Text 文本" description="带语义色的文本容器，支持尺寸、加粗与单行省略。">
    <DemoBlock title="语义色">
      <div class="text-list">
        <je-text>默认文本</je-text>
        <je-text type="primary">主要文本</je-text>
        <je-text type="success">成功文本</je-text>
        <je-text type="warning">警告文本</je-text>
        <je-text type="danger">危险文本</je-text>
        <je-text type="info">信息文本</je-text>
      </div>
    </DemoBlock>

    <DemoBlock title="尺寸与加粗">
      <div class="text-list">
        <je-text size="small">小号文本</je-text>
        <je-text>默认文本</je-text>
        <je-text size="large">大号文本</je-text>
        <je-text bold>加粗文本</je-text>
      </div>
    </DemoBlock>

    <DemoBlock title="单行省略">
      <je-text truncated>
        这是一段很长的文本，超出容器宽度后会被截断并显示省略号，用于列表标题等场景。
      </je-text>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.text-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>