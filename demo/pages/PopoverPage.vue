<script setup lang="ts">
import { ref } from 'vue'
import { JeButton, JePopover } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const count = ref(0)
const clickOpen = ref(false)

const places = [
  { label: '上方', placement: 'top' },
  { label: '右侧', placement: 'right' },
  { label: '下方末尾', placement: 'bottom-end' },
] as const
</script>

<template>
  <DemoPage
    title="Popover 气泡卡片"
    description="比 Tooltip 更重的浮层：可带标题、内容可交互。窄屏下自动改为点击切换，面板宽度收敛到视口内。"
  >
    <DemoBlock title="基础用法" description="鼠标移入触发，可移入面板继续操作（面板内容可交互）。">
      <je-popover title="果冻提示" placement="bottom">
        <template #content>
          <p class="line">移入面板不会收起，点击下面的按钮试试：</p>
          <je-button variant="ghost" @click="count += 1">点了 {{ count }} 次</je-button>
        </template>
        <span class="anchor">悬停查看</span>
      </je-popover>
    </DemoBlock>

    <DemoBlock title="点击触发" description="trigger 设为 click，适合承载表单等较重的内容。">
      <je-popover v-model="clickOpen" trigger="click" title="筛选条件" placement="bottom-start" :width="300">
        <template #content>
          <p class="line">点击外部或按 Esc 关闭。</p>
          <p class="line">当前状态：{{ clickOpen ? '展开' : '收起' }}</p>
        </template>
        <je-button variant="ghost">点击展开</je-button>
      </je-popover>
    </DemoBlock>

    <DemoBlock title="方位与禁用" description="placement 支持 top / bottom / left / right 及其 -start / -end 变体。">
      <div class="row">
        <je-popover v-for="item in places" :key="item.placement" :placement="item.placement">
          <template #content>{{ `placement = ${item.placement}` }}</template>
          <span class="anchor">{{ item.label }}</span>
        </je-popover>
        <je-popover disabled>
          <template #content>不会弹出</template>
          <span class="anchor is-disabled">禁用态</span>
        </je-popover>
      </div>
    </DemoBlock>

    <DemoBlock title="移动端" description="窄屏（≤768px）下悬停失效，改为点击切换；点外部关闭，面板最大宽度为 calc(100vw - 24px)。">
      <p class="line">把视口缩到 768px 以下即可体验。</p>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.anchor {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0 16px;
  font-size: 14px;
  color: var(--je-text-muted);
  background: var(--je-surface);
  border: var(--je-border);
  border-radius: var(--je-radius);
  cursor: pointer;
}

.anchor.is-disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.line {
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
  color: var(--je-text-muted);
}
</style>
