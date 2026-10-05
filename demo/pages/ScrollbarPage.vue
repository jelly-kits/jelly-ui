<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { JeButton, JeScrollbar, JeSlider, JeSpace } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const items = Array.from({ length: 20 }, (_, i) => i + 1)

/** 最大高度：动态增删条目，内容超出 400px 才出现滚动条 */
const count = ref(3)
const add = () => {
  count.value += 1
}
const remove = () => {
  if (count.value > 0) count.value -= 1
}

/** 手动滚动：外层滑块控制内层滚动条位置，滚动条位置反向回传 */
const scrollbarRef = ref<{ setScrollTop: (v: number) => void } | null>(null)
const innerRef = ref<HTMLElement | null>(null)
const maxScroll = ref(0)
const scrollTop = ref(0)

onMounted(() => {
  maxScroll.value = (innerRef.value?.clientHeight ?? 0) - 380
})

const onChange = (value: number | number[]) => {
  scrollbarRef.value?.setScrollTop(value as number)
}

const maxLabel = computed(() => `${maxScroll.value} px`)
</script>

<template>
  <DemoPage
    title="Scrollbar 滚动条"
    description="替换浏览器原生滚动条：原生滑块被隐藏，改用两条自绘轨道。滑块长度按内容比例实时计算，可拖动、可点轨道跳转，悬停或滚动时才浮出；容器尺寸与内容增减都由 ResizeObserver 自动跟随。"
  >
    <DemoBlock title="基础用法" description="height 固定高度；不传 height 时撑满父容器。">
      <je-scrollbar height="400px">
        <p v-for="item in items" :key="item" class="scrollbar-demo-item">{{ item }}</p>
      </je-scrollbar>
    </DemoBlock>

    <DemoBlock title="横向滚动" description="内容宽度超出容器时出现横向滑块，纵向则不会。">
      <je-scrollbar>
        <div class="scrollbar-flex-content">
          <p v-for="item in 50" :key="item" class="scrollbar-demo-item is-square">{{ item }}</p>
        </div>
      </je-scrollbar>
    </DemoBlock>

    <DemoBlock title="最大高度" description="max-height 让容器随内容伸展，超过上限才出现滚动条。">
      <je-space class="toolbar">
        <je-button @click="add">增加条目</je-button>
        <je-button variant="ghost" @click="remove">删除条目</je-button>
      </je-space>
      <je-scrollbar max-height="400px">
        <p v-for="item in count" :key="item" class="scrollbar-demo-item">{{ item }}</p>
      </je-scrollbar>
    </DemoBlock>

    <DemoBlock
      title="手动滚动"
      description="通过 setScrollTop 手动控制滚动位置，scroll 事件把距离回传出来。"
    >
      <je-scrollbar ref="scrollbarRef" height="400px" always @scroll="scrollTop = $event.scrollTop">
        <div ref="innerRef">
          <p v-for="item in items" :key="item" class="scrollbar-demo-item">{{ item }}</p>
        </div>
      </je-scrollbar>
      <je-slider
        class="slider"
        :model-value="scrollTop"
        :max="Math.max(maxScroll, 1)"
        @update:model-value="onChange"
      />
      <p class="state">当前滚动距离 {{ scrollTop }} px / 上限 {{ maxLabel }}</p>
    </DemoBlock>

    <DemoBlock title="常驻显示" description="always 让滑块一直可见，适合滚动区不明显或需要强调的场景。">
      <je-scrollbar height="220px" always>
        <p v-for="item in items" :key="item" class="scrollbar-demo-item">{{ item }}</p>
      </je-scrollbar>
    </DemoBlock>

    <DemoBlock title="原生滚动条" description="native 只把组件当滚动容器用，保留浏览器原生滑块。">
      <je-scrollbar height="220px" native>
        <p v-for="item in items" :key="item" class="scrollbar-demo-item">{{ item }}</p>
      </je-scrollbar>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.scrollbar-demo-item {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 50px;
  margin: 10px;
  text-align: center;
  border-radius: 8px;
  background: color-mix(in srgb, var(--je-primary) 18%, transparent);
  color: color-mix(in srgb, var(--je-primary) 55%, var(--je-text));
}

.scrollbar-flex-content {
  display: flex;
  width: fit-content;
}

.scrollbar-demo-item.is-square {
  flex-shrink: 0;
  width: 100px;
}

.toolbar {
  margin-bottom: 12px;
}

.slider {
  margin-top: 16px;
}

.state {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--je-text-faint);
}
</style>