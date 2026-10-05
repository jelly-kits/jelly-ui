<script setup lang="ts">
import { ref } from 'vue'
import { JeButton, JeFloatingPanel } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const basicOpen = ref(false)
const basicHeight = ref(140)

const anchorOpen = ref(false)
const anchorHeight = ref(200)

const titledOpen = ref(false)
const titledHeight = ref(160)

const scrollOpen = ref(false)
const scrollHeight = ref(200)
</script>

<template>
  <DemoPage
    title="FloatingPanel 浮动面板"
    description="贴底的可拖拽浮动面板，拖动顶部抓手实时改变高度，松手后吸附到最近的高度档位。"
  >
    <DemoBlock
      title="基础用法"
      description="默认取第二个档位作为初始高度，拖动抓手实时改变高度，松手吸附到 140 / 280 中最近的一个。"
    >
      <div class="scope">
        <div class="scope__stage">
          <je-button block @click="basicOpen = true">打开浮动面板</je-button>
          <p class="scope__hint">当前高度：{{ basicHeight }}px（档位 140 / 280）</p>
        </div>
        <je-floating-panel
          v-if="basicOpen"
          v-model="basicHeight"
          :anchors="[140, 280]"
          @close="basicOpen = false"
        >
          <p v-for="n in 6" :key="n" class="line">面板内容第 {{ n }} 行</p>
          <div class="scope__stage">
            <je-button size="small" variant="ghost" block @click="basicOpen = false">
              收起面板
            </je-button>
          </div>
        </je-floating-panel>
      </div>
    </DemoBlock>

    <DemoBlock
      title="多档位吸附"
      description="anchors 传入多个档位（px），拖拽被夹在最小与最大档位之间，heightChange 随吸附结果派发。"
    >
      <div class="scope">
        <div class="scope__stage">
          <je-button block variant="ghost" @click="anchorOpen = true">带 4 个档位打开</je-button>
          <p class="scope__hint">
            当前高度：{{ anchorHeight }}px（档位 100 / 200 / 320 / 400）
          </p>
        </div>
        <je-floating-panel
          v-if="anchorOpen"
          v-model="anchorHeight"
          :anchors="[100, 200, 320, 400]"
          @close="anchorOpen = false"
        >
          <p v-for="n in 8" :key="n" class="line">拖动抓手，松手会吸附到最近档位（第 {{ n }} 行）</p>
        </je-floating-panel>
      </div>
    </DemoBlock>

    <DemoBlock
      title="带标题与关闭按钮"
      description="title 展示标题，closeable 打开右上角关闭按钮，close 事件交给父级收起面板。"
    >
      <div class="scope">
        <div class="scope__stage">
          <je-button block variant="ghost" @click="titledOpen = true">打开带标题的面板</je-button>
          <p class="scope__hint">当前高度：{{ titledHeight }}px</p>
        </div>
        <je-floating-panel
          v-if="titledOpen"
          v-model="titledHeight"
          :anchors="[160, 300]"
          title="订单详情"
          closeable
          @close="titledOpen = false"
        >
          <p v-for="n in 6" :key="n" class="line">订单信息第 {{ n }} 行</p>
        </je-floating-panel>
      </div>
    </DemoBlock>

    <DemoBlock
      title="内容可滚动"
      description="内容区由内置 Scrollbar 包裹，抓手拖拽与内容滚动互不干扰。"
    >
      <div class="scope">
        <div class="scope__stage">
          <je-button block variant="ghost" @click="scrollOpen = true">打开长内容面板</je-button>
          <p class="scope__hint">当前高度：{{ scrollHeight }}px</p>
        </div>
        <je-floating-panel
          v-if="scrollOpen"
          v-model="scrollHeight"
          :anchors="[200, 380]"
          title="长列表"
          closeable
          @close="scrollOpen = false"
        >
          <p v-for="n in 30" :key="n" class="line">可滚动的列表项 {{ n }}</p>
        </je-floating-panel>
      </div>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
/* 容器带 transform 会成为内部 fixed 元素的包含块，把演示限制在框内 */
.scope {
  position: relative;
  height: 420px;
  overflow-y: auto;
  background: var(--je-surface);
  border: var(--je-border);
  border-radius: var(--je-radius);
  transform: translate(0);
}

.scope__stage {
  padding: 16px;
}

.scope__hint {
  margin: 12px 0 0;
  font-size: 13px;
  color: var(--je-text-faint);
}

.line {
  margin: 0;
  padding: 12px 16px;
  font-size: 14px;
  color: var(--je-text-muted);
  border-bottom: var(--je-border);
}
</style>