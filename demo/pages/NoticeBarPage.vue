<script setup lang="ts">
import { ref } from 'vue'
import { JeButton, JeNoticeBar } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const log = ref('暂无')

const shortText = '今日下单满 99 元立减 20 元'
const longText =
  '受台风影响，华东地区部分线路配送时效可能延迟 1 ~ 2 天，给您带来的不便敬请谅解，详情请咨询在线客服。'

const closed = ref(false)
</script>

<template>
  <DemoPage
    title="NoticeBar 通知栏"
    description="横向滚动的公告条，内容超出宽度时自动跑马灯，支持可关闭、可点击与自定义配色。"
  >
    <DemoBlock title="基础用法" description="文字超出容器宽度时自动横向滚动，未超出则静态展示。">
      <je-notice-bar :text="shortText" />
      <div class="gap" />
      <je-notice-bar :text="longText" />
    </DemoBlock>

    <DemoBlock title="可关闭与可点击" description="mode 用空格组合 link 与 closeable，分别派发 click 与 close。">
      <je-notice-bar
        v-if="!closed"
        :text="longText"
        mode="link closeable"
        @click="log = '点击了通知栏'"
        @close="closed = true"
      />
      <div v-else class="placeholder">通知栏已关闭</div>
      <div class="toolbar">
        <je-button size="small" variant="ghost" @click="closed = false">重置</je-button>
      </div>
      <p class="hint">{{ log }}</p>
    </DemoBlock>

    <DemoBlock title="自定义配色与图标" description="color / background 传任意 CSS 颜色，leftIcon 可换成任意内置图标。">
      <je-notice-bar
        text="这是一条自定义配色的通知"
        color="#fff"
        background="linear-gradient(135deg, var(--je-primary), var(--je-primary-end))"
        left-icon="bell"
      />
      <div class="gap" />
      <je-notice-bar text="多行换行展示的通知内容，超长文本会完整折行而不是滚动。" wrapable background="rgba(103, 194, 58, 0.14)" color="var(--je-success)" />
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.gap {
  height: 12px;
}

.hint {
  margin: 12px 0 0;
  font-size: 13px;
  color: var(--je-text-faint);
}

.toolbar {
  margin-top: 12px;
}

.placeholder {
  padding: 10px 15px;
  border-radius: var(--je-radius);
  font-size: 14px;
  color: var(--je-text-faint);
  background: var(--je-surface-hover);
}
</style>
