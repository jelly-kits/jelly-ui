<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { JeFloatingBubble } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

/** 与组件内置尺寸保持一致：PC 52px、窄屏 56px */
const bubbleSize = () => (window.innerWidth <= 768 ? 56 : 52)

/**
 * 悬浮球是 position: fixed 且默认 Teleport 到 body，直接按视口摆位会盖住文档站的保留区
 * —— 左侧 240px 侧边菜单、右侧 390px 本页目录列、顶部 60px 顶栏（顶栏 z-index 更高，
 * 球吸到 y=0 会被它整个盖住）。这里量出这几块之间的「安全带」，三个球只在带内活动；
 * 保留区收起时（窄屏）自然退回视口本身。
 */
const safeBand = () => {
  const sidebar = document.querySelector('.doc__sidebar')
  const aside = document.querySelector('.demo-page__aside')
  const topbar = document.querySelector('.doc__topbar')
  const size = bubbleSize()
  const gap = 16
  const left = Math.max(sidebar?.getBoundingClientRect().right ?? 0, 0) + gap
  const asideRect = aside?.getBoundingClientRect()
  const asideLeft = asideRect && asideRect.width > 0 ? asideRect.left : window.innerWidth
  return {
    left,
    right: Math.max(left, asideLeft - size - gap),
    top: (topbar?.getBoundingClientRect().bottom ?? 0) + gap,
  }
}

/** 把坐标收回安全带：拖拽中与吸附后都会经过这里，所以球不会停到菜单 / 目录列 / 顶栏上 */
const intoBand = (point: { x: number; y: number }) => {
  const { left, right, top } = safeBand()
  return { x: Math.min(Math.max(point.x, left), right), y: Math.max(point.y, top) }
}

const offset = ref({ x: 0, y: 260 })
const verticalOffset = ref({ x: 0, y: 380 })
const cornerOffset = ref({ x: 0, y: 0 })
const clicks = ref(0)

/** 初始铺位：右侧两颗贴内容列右边，客服球贴内容列左边 */
const place = () => {
  const { left, right } = safeBand()
  offset.value = intoBand({ x: right, y: 260 })
  verticalOffset.value = intoBand({ x: right, y: 380 })
  cornerOffset.value = intoBand({ x: left, y: window.innerHeight - 140 })
}

/** 窗口尺寸变化时把坐标重新收回安全带（纵向只在被顶栏盖住时下移，不重置用户的拖动结果） */
const reclamp = () => {
  offset.value = intoBand(offset.value)
  verticalOffset.value = intoBand(verticalOffset.value)
  cornerOffset.value = intoBand(cornerOffset.value)
}

const onClick = () => {
  clicks.value += 1
}

onMounted(() => {
  place()
  window.addEventListener('resize', reclamp)
})

onBeforeUnmount(() => window.removeEventListener('resize', reclamp))
</script>

<template>
  <DemoPage
    title="FloatingBubble 悬浮球"
    description="可拖拽的悬浮球，松手后自动吸附到最近的边；位移小于阈值则视为点击。"
  >
    <DemoBlock title="自由拖拽并吸附" description="axis=xy 允许任意方向拖动，magnetic=x 松手后吸附到左右边。">
      <p class="hint">页面上出现的悬浮球可直接拖动，点击计数：{{ clicks }}</p>
      <je-floating-bubble
        :offset="offset"
        axis="xy"
        magnetic="x"
        icon="plus"
        @update:offset="offset = intoBand($event)"
        @click="onClick"
      />
    </DemoBlock>

    <DemoBlock title="仅纵向拖拽" description="axis=y 时横向位置固定，适合始终贴边停靠的客服 / 回顶入口。">
      <p class="hint">这个悬浮球只能上下拖动。</p>
      <je-floating-bubble
        :offset="verticalOffset"
        axis="y"
        magnetic="y"
        icon="message"
        :gap="32"
        @update:offset="verticalOffset = intoBand($event)"
      />
    </DemoBlock>

    <DemoBlock title="自定义内容" description="不传 icon 时可用默认插槽放入任意内容，也可以完全用样式改外观。">
      <p class="hint">悬浮球支持插槽自定义，例如放一个「客服」文字入口。</p>
      <je-floating-bubble
        :offset="cornerOffset"
        axis="y"
        @update:offset="cornerOffset = intoBand($event)"
      >
        <span class="bubble-text">客服</span>
      </je-floating-bubble>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.hint {
  margin: 12px 0 0;
  font-size: 13px;
  color: var(--je-text-faint);
}

.bubble-text {
  font-size: 13px;
  color: #fff;
}
</style>
