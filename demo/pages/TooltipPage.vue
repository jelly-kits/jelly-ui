<script setup lang="ts">
import { JeButton, JeTooltip } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const placements = ['top', 'bottom', 'left', 'right'] as const
</script>

<template>
  <DemoPage
    title="Tooltip 文字提示"
    description="悬停 / 聚焦时展示的轻量提示。桌面端用 hover 展开，窄屏没有 hover 改为点击切换，浮层定位与箭头朝向自动跟随可用空间翻转。"
  >
    <DemoBlock title="四个方向" description="placement 控制优先展示方向，空间不足时会自动翻转到对侧。">
      <div class="row">
        <je-tooltip
          v-for="p in placements"
          :key="p"
          :placement="p"
          :content="`提示方向：${p}`"
        >
          <je-button variant="ghost">{{ p }}</je-button>
        </je-tooltip>
      </div>
    </DemoBlock>

    <DemoBlock title="自定义内容" description="默认用 content 传文本，也可用 #content 插槽放富文本。">
      <je-tooltip placement="top">
        <template #content>
          <strong>多行提示</strong>
          <br />
          支持通过插槽渲染任意内容。
        </template>
        <je-button>悬停查看</je-button>
      </je-tooltip>
    </DemoBlock>

    <DemoBlock title="延迟与禁用" description="openDelay / closeDelay 控制进出场延迟；disabled 时完全不展示。">
      <div class="row">
        <je-tooltip content="无延迟" :open-delay="0" :close-delay="0">
          <je-button variant="ghost">立即出现</je-button>
        </je-tooltip>
        <je-tooltip content="这条不会出现" disabled>
          <je-button variant="ghost">已禁用</je-button>
        </je-tooltip>
      </div>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
</style>
