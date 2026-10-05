<script setup lang="ts">
import { ref } from 'vue'
import { JeAnchor, JeAnchorLink, JeScrollbar } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

/** 当前高亮的 href，由 change 事件回填 */
const active = ref('')

const sections = [
  { id: 'anchor-sec-1', title: '第一节 · 简介', text: '锚点用于在长内容中快速跳转，滚动时会自动高亮当前所在的区块。' },
  { id: 'anchor-sec-2', title: '第二节 · 主题换肤', text: '高亮色来自主色 token，覆盖 --je-primary 即可整块换色。' },
  { id: 'anchor-sec-3', title: '第三节 · 移动端', text: '窄屏下横向锚点可以左右滑动，触控热区不小于 44px。' },
]
</script>

<template>
  <DemoPage
    title="Anchor 锚点"
    description="容器内滚动时自动高亮当前区块，点击链接平滑滚动到目标；开启「减弱动效」偏好时会瞬间跳转。"
  >
    <DemoBlock
      title="容器内滚动"
      description="container 指向一个 max-height + overflow 的容器，offset 是判定高亮的阈值。"
    >
      <div class="anchor-demo">
        <je-anchor
          class="anchor-demo__nav"
          container="#anchor-demo-scroll"
          :offset="12"
          @change="active = $event"
        >
          <je-anchor-link v-for="item in sections" :key="item.id" :href="`#${item.id}`">
            {{ item.title }}
          </je-anchor-link>
        </je-anchor>

        <je-scrollbar id="anchor-demo-scroll" class="anchor-demo__scroll" :max-height="260">
          <section v-for="item in sections" :id="item.id" :key="item.id" class="anchor-demo__section">
            <h4>{{ item.title }}</h4>
            <p>{{ item.text }}</p>
            <p>{{ item.text }}</p>
          </section>
        </je-scrollbar>
      </div>
      <p class="state">当前高亮：{{ active || '（滚动或点击试试）' }}</p>
    </DemoBlock>

    <DemoBlock
      title="横向锚点"
      description="direction 设为 horizontal，指示条移到下方；窄屏时整条可横向滑动。"
    >
      <je-anchor direction="horizontal" container="#anchor-h-scroll" :offset="8">
        <je-anchor-link href="#anchor-h-1" title="概览" />
        <je-anchor-link href="#anchor-h-2" title="用法" />
        <je-anchor-link href="#anchor-h-3" title="API" />
        <je-anchor-link href="#anchor-h-4" title="示例" />
      </je-anchor>
      <je-scrollbar id="anchor-h-scroll" class="anchor-demo__scroll anchor-demo__scroll--wide" :max-height="220">
        <section id="anchor-h-1" class="anchor-demo__section">
          <h4>概览</h4>
          <p>横向锚点适合层级较浅、标签较短的场景。</p>
        </section>
        <section id="anchor-h-2" class="anchor-demo__section">
          <h4>用法</h4>
          <p>与纵向写法一致，只切换 direction。</p>
        </section>
        <section id="anchor-h-3" class="anchor-demo__section">
          <h4>API</h4>
          <p>props：container / offset / targetOffset / direction；events：change / click。</p>
        </section>
        <section id="anchor-h-4" class="anchor-demo__section">
          <h4>示例</h4>
          <p>点击标签即可跳转到对应区块。</p>
        </section>
      </je-scrollbar>
    </DemoBlock>

    <DemoBlock title="移动端说明">
      <p class="tip">
        窄屏下横向锚点会变成可横向滑动的条带（隐藏滚动条），每个链接的触控热区不小于
        44px；纵向锚点宽度自适应父容器。拖动容器滚动时高亮实时跟随，组件卸载会清理 scroll 监听。
      </p>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.anchor-demo {
  display: flex;
  gap: 18px;
  align-items: flex-start;
}

.anchor-demo__nav {
  flex: 0 0 auto;
}

.anchor-demo__scroll {
  flex: 1;
  min-width: 0;
}

.anchor-demo__scroll--wide {
  margin-top: 14px;
}

.anchor-demo__section {
  /* 每节至少与滚动容器（260px）等高，最后一节才能滚到容器顶部被判定为当前项 */
  min-height: 280px;
  padding-bottom: 12px;
  padding-right: 10px;
}

.anchor-demo__section h4 {
  margin: 0 0 8px;
  font-size: 14px;
  color: var(--je-text);
}

.anchor-demo__section p {
  margin: 0 0 10px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--je-text-faint);
}

.state,
.tip {
  margin: 12px 0 0;
  font-size: 13px;
  line-height: 1.7;
  color: var(--je-text-faint);
}

@media (max-width: 768px) {
  .anchor-demo {
    flex-direction: column;
    gap: 12px;
  }

  .anchor-demo__nav {
    width: 100%;
  }

  .anchor-demo__scroll {
    width: 100%;
  }
}
</style>
