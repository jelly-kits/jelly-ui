<script setup lang="ts">
import { ref } from 'vue'
import { JeButton, JeSkeleton, JeSkeletonItem, JeSpace } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const loading = ref(true)

const toggle = () => {
  loading.value = !loading.value
}
</script>

<template>
  <DemoPage
    title="Skeleton 骨架屏"
    description="在内容加载完成前占位，减少布局跳动。loading 为 true 时显示骨架，为 false 时渲染默认插槽内容。"
  >
    <DemoBlock title="基础用法" description="默认 3 行文本 + 标题占位，点按钮切换加载状态。">
      <je-button @click="toggle">{{ loading ? '显示内容' : '显示骨架' }}</je-button>
      <je-skeleton :loading="loading">
        <p class="content">内容已加载完成：这是一段真实的正文文本，用于对比骨架屏效果。</p>
      </je-skeleton>
    </DemoBlock>

    <DemoBlock title="头像与行数" description="avatar 显示左侧圆形占位，rows 控制文本行数。">
      <je-skeleton :loading="true" avatar :rows="2" />
      <je-skeleton :loading="true" :rows="4" :title="false" />
    </DemoBlock>

    <DemoBlock title="静态与圆角" description="animated=false 关闭微光动画，round 让占位块变为胶囊圆角。">
      <je-skeleton :loading="true" :animated="false" avatar :rows="2" />
      <je-skeleton :loading="true" round :rows="2" :title="false" />
    </DemoBlock>

    <DemoBlock title="单独使用 Item" description="SkeletonItem 提供 text / circle / rect / button 四种形态。">
      <je-space direction="vertical" fill>
        <je-skeleton-item variant="text" width="60%" />
        <je-skeleton-item variant="rect" height="72" />
        <je-space>
          <je-skeleton-item variant="circle" :width="40" :height="40" />
          <je-skeleton-item variant="button" width="96" />
        </je-space>
      </je-space>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.content {
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  color: var(--je-text-muted);
}
</style>
