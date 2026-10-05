<script setup lang="ts">
import { ref } from 'vue'
import { JeIcon, JeNavBar } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const last = ref('暂无')
</script>

<template>
  <DemoPage
    title="NavBar 导航栏"
    description="移动端页面顶部的标题栏，支持左右操作区、返回箭头、顶部安全区留白与固定定位。"
  >
    <DemoBlock title="基础用法" description="leftArrow 默认开启，右侧文字按需传入。">
      <je-nav-bar
        title="页面标题"
        left-text="返回"
        right-text="更多"
        @click-left="last = '左侧返回'"
        @click-right="last = '右侧更多'"
      />
      <p class="hint">最近操作：{{ last }}</p>
    </DemoBlock>

    <DemoBlock title="标题与说明" description="description 放在主标题下方，用于补充上下文。">
      <je-nav-bar title="订单详情" description="订单号 20261002001" left-text="返回" />
    </DemoBlock>

    <DemoBlock title="自定义左右区域" description="left / right 插槽可放图标按钮等任意内容。">
      <je-nav-bar title="发现">
        <template #left>
          <button class="icon-btn" type="button" aria-label="菜单">
            <je-icon name="menu" :size="20" />
          </button>
        </template>
        <template #right>
          <button class="icon-btn" type="button" aria-label="搜索">
            <je-icon name="search" :size="20" />
          </button>
          <button class="icon-btn" type="button" aria-label="更多">
            <je-icon name="more" :size="20" />
          </button>
        </template>
      </je-nav-bar>
    </DemoBlock>

    <DemoBlock
      title="固定在顶部"
      description="fixed 让导航栏脱离文档流，placeholder 会把原来的高度补回内容里（演示区已限定高度并自行滚动）。"
    >
      <div class="nav-scope">
        <je-nav-bar title="固定导航栏" left-text="返回" fixed placeholder />
        <p v-for="n in 8" :key="n" class="nav-scope__line">滚动内容第 {{ n }} 行</p>
      </div>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.hint {
  margin: 12px 0 0;
  font-size: 13px;
  color: var(--je-text-faint);
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  color: var(--je-text);
  background: transparent;
  border: none;
  border-radius: var(--je-radius-sm);
  cursor: pointer;
}

.icon-btn:hover {
  background: var(--je-surface-hover);
}

/* 容器带 transform 会成为内部 fixed 元素的包含块，把演示限制在框内 */
.nav-scope {
  position: relative;
  height: 220px;
  overflow-y: auto;
  background: var(--je-popup);
  border: var(--je-border);
  border-radius: var(--je-radius);
  transform: translate(0);
}

.nav-scope__line {
  margin: 0;
  padding: 14px 16px;
  font-size: 14px;
  color: var(--je-text-muted);
  border-bottom: var(--je-border);
}
</style>
