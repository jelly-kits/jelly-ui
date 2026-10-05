<script setup lang="ts">
import { JeIcon, JeLink, JeSpace } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'
</script>

<template>
  <DemoPage
    title="Link 链接"
    description="文字链接，支持语义色与下划线策略。触屏设备没有 hover，hover 下划线会自动降级为常显。"
  >
    <DemoBlock title="语义色">
      <je-space :size="20" wrap>
        <je-link>默认链接</je-link>
        <je-link type="primary">主要链接</je-link>
        <je-link type="success">成功链接</je-link>
        <je-link type="warning">警告链接</je-link>
        <je-link type="danger">危险链接</je-link>
        <je-link type="info">信息链接</je-link>
      </je-space>
    </DemoBlock>

    <DemoBlock title="下划线与禁用">
      <je-space :size="20" wrap>
        <je-link underline="always">始终下划线</je-link>
        <je-link underline="never">从不显示下划线</je-link>
        <je-link disabled>禁用链接</je-link>
      </je-space>
    </DemoBlock>

    <DemoBlock title="带图标">
      <je-space :size="20" wrap>
        <je-link type="primary">
          <template #icon><je-icon name="external-link" :size="14" /></template>
          外部链接
        </je-link>
        <je-link type="info">
          <template #icon><je-icon name="mail" :size="14" /></template>
          发送邮件
        </je-link>
      </je-space>
    </DemoBlock>
  </DemoPage>
</template>