<script setup lang="ts">
import { JeButton, JeDivider, JeSpace } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'
</script>

<template>
  <DemoPage
    title="Space 间距"
    description="用 flex + gap 统一控制子元素间距，避免手动写 margin。窄屏建议开启 wrap 防止横向溢出。"
  >
    <DemoBlock title="水平 / 垂直">
      <je-space>
        <je-button>确定</je-button>
        <je-button variant="ghost">取消</je-button>
      </je-space>
      <je-divider />
      <je-space direction="vertical" align="start">
        <je-button>第一行</je-button>
        <je-button variant="ghost">第二行</je-button>
      </je-space>
    </DemoBlock>

    <DemoBlock title="自定义间距与换行">
      <je-space :size="[24, 12]" wrap>
        <je-button v-for="n in 6" :key="n" variant="ghost">按钮 {{ n }}</je-button>
      </je-space>
    </DemoBlock>
  </DemoPage>
</template>