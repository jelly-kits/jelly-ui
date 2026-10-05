<script setup lang="ts">
import { ref } from 'vue'
import { JeTag } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const closableTags = ref(['前端', '设计', '测试'])

const remove = (tag: string) => {
  closableTags.value = closableTags.value.filter((item) => item !== tag)
}
</script>

<template>
  <DemoPage
    title="Tag 标签"
    description="用于标记与分类，提供五种语义色、三种风格与三种尺寸，可关闭。"
  >
    <DemoBlock title="基础用法">
      <div class="row">
        <je-tag>默认</je-tag>
        <je-tag type="success">成功</je-tag>
        <je-tag type="info">信息</je-tag>
        <je-tag type="warning">警告</je-tag>
        <je-tag type="danger">危险</je-tag>
      </div>
    </DemoBlock>

    <DemoBlock title="风格与尺寸">
      <div class="row">
        <je-tag effect="light">light</je-tag>
        <je-tag effect="dark">dark</je-tag>
        <je-tag effect="plain">plain</je-tag>
      </div>
      <div class="row">
        <je-tag size="small">small</je-tag>
        <je-tag size="default">default</je-tag>
        <je-tag size="large">large</je-tag>
        <je-tag round type="success">圆角</je-tag>
      </div>
    </DemoBlock>

    <DemoBlock title="可关闭与禁用" description="点击右侧关闭按钮触发 close 事件。">
      <div class="row">
        <je-tag v-for="tag in closableTags" :key="tag" closable @close="remove(tag)">
          {{ tag }}
        </je-tag>
        <span v-if="closableTags.length === 0" class="empty">已全部关闭</span>
      </div>
      <div class="row">
        <je-tag closable disabled>禁用</je-tag>
        <je-tag type="warning" disabled>禁用</je-tag>
      </div>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.empty {
  font-size: 13px;
  color: var(--je-text-faint);
}
</style>
