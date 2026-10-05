<script setup lang="ts">
import { JeAside, JeContainer, JeFooter, JeHeader, JeMain } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'
</script>

<template>
  <DemoPage
    title="Container 布局容器"
    description="用于快速搭建页面的基本结构：Container 是外层容器，按直接子元素自动决定排列方向——含 Header 或 Footer 时纵向，否则横向；Header / Aside / Main / Footer 依次是顶栏、侧栏、主区域与底栏。除 Header / Aside / Footer 的宽高外不带任何样式，背景与边框由使用方决定。"
  >
    <DemoBlock
      title="顶栏 + 主区域"
      description="子元素里出现 Header，容器自动变为纵向；顶栏高度默认 60px，可用 height 调整。"
    >
      <div class="frame">
        <je-container>
          <je-header class="demo-header">Header</je-header>
          <je-main class="demo-main">Main</je-main>
        </je-container>
      </div>
    </DemoBlock>

    <DemoBlock
      title="顶栏 + 主区域 + 底栏"
      description="Header 与 Footer 高度固定、不参与剩余空间分配，Main 自动占满中间部分。"
    >
      <div class="frame">
        <je-container>
          <je-header class="demo-header" :height="52">Header</je-header>
          <je-main class="demo-main">Main</je-main>
          <je-footer class="demo-footer" :height="48">Footer</je-footer>
        </je-container>
      </div>
    </DemoBlock>

    <DemoBlock
      title="侧边栏 + 主区域 + 侧边栏"
      description="没有 Header / Footer 时容器横向排列；Aside 宽度默认 300px，用 width 改成需要的宽度。"
    >
      <div class="frame">
        <je-container>
          <je-aside class="demo-aside" :width="120">Aside</je-aside>
          <je-main class="demo-main">Main</je-main>
          <je-aside class="demo-aside" :width="120">Aside</je-aside>
        </je-container>
      </div>
    </DemoBlock>

    <DemoBlock
      title="嵌套容器"
      description="Container 可以直接嵌套：外层含 Header / Footer 所以纵向，内层只有 Aside 与 Main 所以横向。"
    >
      <div class="frame frame--tall">
        <je-container>
          <je-header class="demo-header">Header</je-header>
          <je-container>
            <je-aside class="demo-aside" :width="140">Aside</je-aside>
            <je-main class="demo-main">Main</je-main>
          </je-container>
          <je-footer class="demo-footer">Footer</je-footer>
        </je-container>
      </div>
    </DemoBlock>

    <DemoBlock
      title="指定方向"
      description="direction 可显式覆盖自动判定：左侧不传 direction，两个 Main 并列；右侧传 vertical，改为上下堆叠。"
    >
      <div class="pair">
        <div class="pair__item">
          <div class="frame frame--short">
            <je-container>
              <je-main class="demo-main">Main</je-main>
              <je-main class="demo-main">Main</je-main>
            </je-container>
          </div>
          <p class="pair__label">自动（横向）</p>
        </div>
        <div class="pair__item">
          <div class="frame frame--short">
            <je-container direction="vertical">
              <je-main class="demo-main">Main</je-main>
              <je-main class="demo-main">Main</je-main>
            </je-container>
          </div>
          <p class="pair__label">direction="vertical"</p>
        </div>
      </div>
    </DemoBlock>

    <DemoBlock title="移动端说明">
      <p class="tip">
        容器本身是纯布局元素：窄屏（≤768px）只把 Header / Footer / Main 的左右内边距收到 16px，不会擅自改变排列方向，避免
        Aside 的宽度约定被悄悄破坏。手机上要改成上下堆叠，请显式传 direction="vertical"，或配合栅格用 Row / Col
        的 xs 断点自行控制。
      </p>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
/* 给容器一个确定高度，否则 flex 布局没有可分配的空间 */
.frame {
  display: flex;
  flex-direction: column;
  height: 200px;
  overflow: hidden;
  border: var(--je-border);
  border-radius: var(--je-radius);
}

.frame--tall {
  height: 280px;
}

.frame--short {
  height: 140px;
}

.demo-header,
.demo-footer {
  display: flex;
  align-items: center;
  font-size: 13px;
  font-weight: 600;
  color: var(--je-text);
  background: color-mix(in srgb, var(--je-primary) 26%, transparent);
}

.demo-aside {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: var(--je-text-muted);
  background: color-mix(in srgb, var(--je-primary) 12%, transparent);
}

.demo-main {
  font-size: 13px;
  color: var(--je-text-muted);
  background: var(--je-surface-hover);
}

.pair {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.pair__label {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--je-text-faint);
}

.tip {
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
  color: var(--je-text-faint);
}

@media (max-width: 768px) {
  .pair {
    grid-template-columns: 1fr;
  }
}
</style>
