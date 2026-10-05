<script setup lang="ts">
import { ref } from 'vue'
import { JeButton, JeImagePreview } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

/**
 * 演示用图片：仓库内置的静态插画（`public/images/*.svg`），不依赖任何外部图片服务。
 * 路径带上 `import.meta.env.BASE_URL` —— 脚本里的字符串不会被 Vite 按 base 改写，
 * 部署到 Pages 子路径时缺了前缀会 404。
 */
const gallery = [
  `${import.meta.env.BASE_URL}images/living-room.svg`,
  `${import.meta.env.BASE_URL}images/vegetables.svg`,
  `${import.meta.env.BASE_URL}images/mountain-lake.svg`,
]

/** 基础用法：点缩略图时先记下要打开的下标 */
const basic = ref(false)
const basicIndex = ref(0)
const openBasic = (index: number) => {
  basicIndex.value = index
  basic.value = true
}

/** 指定初始图 */
const startAt = ref(false)

/** 圆点指示器 */
const withDots = ref(false)

/** 循环切换 */
const looped = ref(false)

const lastChange = ref(0)
</script>

<template>
  <DemoPage
    title="ImagePreview 图片预览"
    description="全屏图片预览浮层，支持左右滑动切图、双指捏合缩放、双击放大、滚轮缩放与点击空白关闭。"
  >
    <DemoBlock title="基础用法" description="点击缩略图打开预览，顶部显示索引，滑动或按左右方向键切换。">
      <div class="grid">
        <button
          v-for="(item, index) in gallery"
          :key="index"
          type="button"
          class="thumb"
          @click="openBasic(index)"
        >
          <img :src="item" :alt="`缩略图 ${index + 1}`" >
        </button>
      </div>
      <je-image-preview
        v-model="basic"
        :images="gallery"
        :start-position="basicIndex"
        @change="lastChange = $event"
      />
      <p class="hint">最近切换到第 {{ lastChange + 1 }} 张</p>
    </DemoBlock>

    <DemoBlock title="指定初始图" description="startPosition 决定打开时停在第几张，每次打开都会重新取该值。">
      <je-button @click="startAt = true">从第 3 张开始预览</je-button>
      <je-image-preview v-model="startAt" :images="gallery" :start-position="2" />
    </DemoBlock>
    <DemoBlock title="圆点指示器" description="showIndicators 在底部渲染小圆点，可直接点击跳转。">
      <je-button variant="ghost" @click="withDots = true">打开带指示器的预览</je-button>
      <je-image-preview v-model="withDots" :images="gallery" show-indicators />
    </DemoBlock>

    <DemoBlock
      title="循环切换与缩放"
      description="infinite 让首尾可以循环；在图片上双指捏合或滚轮可缩放（maxZoom 控制上限），双击在原图与最大倍数之间切换。"
    >
      <je-button variant="ghost" @click="looped = true">打开循环预览</je-button>
      <je-image-preview
        v-model="looped"
        :images="gallery"
        infinite
        show-indicators
        :max-zoom="4"
        :swipe-duration="360"
      />
      <p class="hint">缩放范围：1 ~ 4 倍</p>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}

.thumb {
  padding: 0;
  overflow: hidden;
  cursor: pointer;
  background: var(--je-surface);
  border: var(--je-border);
  border-radius: var(--je-radius);
  outline: none;
  transition: transform var(--je-duration) var(--je-ease-out-back),
    border-color var(--je-duration) ease;
}

.thumb:hover {
  border-color: color-mix(in srgb, var(--je-primary) 60%, var(--je-border-color));
  transform: translateY(-2px);
}

.thumb:focus-visible {
  outline: 2px solid var(--je-primary);
  outline-offset: 2px;
}

.thumb img {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
}

.hint {
  margin: 14px 0 0;
  font-size: 13px;
  color: var(--je-text-faint);
}

@media (max-width: 768px) {
  .grid {
    grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
    gap: 10px;
  }
}
</style>