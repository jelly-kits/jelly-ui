<script setup lang="ts">
import { ref } from 'vue'
import { JeCarousel, JeCarouselItem } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const current = ref(0)

const slides = [
  { name: '山', from: '#667eea', to: '#764ba2' },
  { name: '海', from: '#22c55e', to: '#0ea5e9' },
  { name: '城', from: '#f59e0b', to: '#ef4444' },
]

const bg = (from: string, to: string) => `linear-gradient(135deg, ${from}, ${to})`
</script>

<template>
  <DemoPage
    title="Carousel 走马灯"
    description="支持自动播放、循环、指示点与箭头。窄屏下 hover 箭头自动常显，并可用手指左右（或上下）滑动翻页。"
  >
    <DemoBlock title="基础用法" description="关掉自动播放，手动点击指示点切换。">
      <je-carousel v-model="current" :autoplay="false" height="220px">
        <je-carousel-item v-for="slide in slides" :key="slide.name" :name="slide.name">
          <div class="slide" :style="{ background: bg(slide.from, slide.to) }">{{ slide.name }}</div>
        </je-carousel-item>
      </je-carousel>
      <p class="state">当前序号：{{ current }}</p>
    </DemoBlock>

    <DemoBlock title="自动播放" description="interval 控制间隔毫秒数，鼠标移入会暂停。">
      <je-carousel :interval="2000" height="220px">
        <je-carousel-item v-for="slide in slides" :key="slide.name">
          <div class="slide" :style="{ background: bg(slide.from, slide.to) }">{{ slide.name }}</div>
        </je-carousel-item>
      </je-carousel>
    </DemoBlock>

    <DemoBlock
      title="指示点与箭头"
      description="indicatorPosition 可选 inside / outside / none；arrow 为 always 时箭头常显，trigger 为 hover 时指示点跟随悬停切换。"
    >
      <je-carousel
        :autoplay="false"
        :loop="false"
        height="200px"
        indicator-position="outside"
        arrow="always"
        trigger="hover"
      >
        <je-carousel-item v-for="slide in slides" :key="slide.name">
          <div class="slide" :style="{ background: bg(slide.from, slide.to) }">{{ slide.name }}</div>
        </je-carousel-item>
      </je-carousel>
    </DemoBlock>

    <DemoBlock
      title="垂直方向"
      description="direction 为 vertical 时轨道沿 Y 轴位移，触摸滑动方向也随之变成上下；指示点改为贴右侧竖排，选中态是拉高而不是拉宽。indicatorPosition 为 outside 时指示点移到可视区右侧单独占一列。"
    >
      <je-carousel direction="vertical" :autoplay="false" height="200px">
        <je-carousel-item v-for="slide in slides" :key="slide.name">
          <div class="slide" :style="{ background: bg(slide.from, slide.to) }">{{ slide.name }}</div>
        </je-carousel-item>
      </je-carousel>

      <je-carousel direction="vertical" :autoplay="false" height="200px" indicator-position="outside">
        <je-carousel-item v-for="slide in slides" :key="slide.name">
          <div class="slide" :style="{ background: bg(slide.from, slide.to) }">{{ slide.name }}</div>
        </je-carousel-item>
      </je-carousel>
    </DemoBlock>

    <DemoBlock title="移动端说明" description="缩到 768px 以下：箭头即使配了 hover 也会常显；手指拖动超过约 50px 即翻页，松开未超阈值则回弹。">
      <p class="state">指示点热区固定 44px，满足触控最小点击面积。</p>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.slide {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 28px;
  font-weight: 700;
  color: #ffffff;
}

.state {
  margin: 10px 0 0;
  font-size: 12px;
  color: var(--je-text-faint);
}
</style>
