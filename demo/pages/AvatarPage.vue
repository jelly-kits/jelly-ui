<script setup lang="ts">
import { JeAvatar } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

/** 内联 SVG，避免演示依赖外部图片资源 */
const AVATAR_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="#667eea"/><circle cx="40" cy="30" r="14" fill="#fff"/><path d="M12 80a28 28 0 0 1 56 0Z" fill="#fff"/></svg>',
)}`
</script>

<template>
  <DemoPage
    title="Avatar 头像"
    description="支持图片、图标与文字三种内容；图片加载失败时自动回退到图标或默认插槽。"
  >
    <DemoBlock title="基础用法">
      <div class="row">
        <je-avatar :src="AVATAR_IMAGE" alt="示例头像" />
        <je-avatar>A</je-avatar>
        <je-avatar icon="user" />
        <je-avatar icon="heart" />
      </div>
    </DemoBlock>

    <DemoBlock title="尺寸与形状">
      <div class="row">
        <je-avatar size="small" :src="AVATAR_IMAGE" />
        <je-avatar size="default" :src="AVATAR_IMAGE" />
        <je-avatar size="large" :src="AVATAR_IMAGE" />
        <je-avatar :size="64" :src="AVATAR_IMAGE" />
        <je-avatar shape="square" :src="AVATAR_IMAGE" />
      </div>
    </DemoBlock>

    <DemoBlock title="加载失败回退" description="传入不可用的地址时回退到 icon 或默认插槽文字。">
      <div class="row">
        <je-avatar src="/not-exist-avatar.png" />
        <je-avatar src="/not-exist-avatar.png">回退</je-avatar>
      </div>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
}
</style>
