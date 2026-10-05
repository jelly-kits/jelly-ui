<script setup lang="ts">
import { JeDivider, JeText } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'
</script>

<template>
  <DemoPage
    title="Divider 分割线"
    description="支持水平 / 垂直方向，水平方向可插入文字并指定位置。"
  >
    <DemoBlock title="基础用法">
      <je-text>上方内容</je-text>
      <je-divider />
      <je-text>下方内容</je-text>
    </DemoBlock>

    <DemoBlock title="带文字与位置">
      <je-divider content-position="left">左侧</je-divider>
      <je-divider content-position="center">居中</je-divider>
      <je-divider content-position="right">右侧</je-divider>
    </DemoBlock>

    <DemoBlock title="虚线样式 / 垂直分割">
      <je-divider border-style="dashed">虚线</je-divider>
      <div>
        <je-text>文本</je-text>
        <je-divider direction="vertical" />
        <je-text>链接</je-text>
        <je-divider direction="vertical" border-style="dotted" />
        <je-text>更多</je-text>
      </div>
    </DemoBlock>
  </DemoPage>
</template>