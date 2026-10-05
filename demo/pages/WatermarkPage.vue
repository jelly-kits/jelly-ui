<script setup lang="ts">
import { JeButton, JeWatermark } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'
</script>

<template>
  <DemoPage
    title="Watermark 水印"
    description="用 canvas 生成平铺水印作为容器背景，支持文字 / 图片水印，并可定制角度、间距与颜色。"
  >
    <DemoBlock title="基础用法" description="默认跟随正文色，按固定透明度平铺，明暗主题下都留得住痕迹。">
      <je-watermark>
        <div class="panel">
          <p>水印会覆盖整个内容区域。</p>
          <je-button>按钮仍可正常点击</je-button>
        </div>
      </je-watermark>
    </DemoBlock>

    <DemoBlock title="多行文字与参数定制">
      <je-watermark
        :content="['Jelly UI', '内部资料']"
        :rotate="-12"
        :font-size="16"
        :gap-x="60"
        :gap-y="40"
        color="rgba(122, 132, 152, 0.28)"
      >
        <div class="panel">多行、间距更密的水印，可随容器尺寸变化自动重绘。</div>
      </je-watermark>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.panel {
  min-height: 160px;
  padding: 20px;
  background: var(--je-surface);
  border: var(--je-border);
  border-radius: var(--je-radius-lg);
}
</style>
