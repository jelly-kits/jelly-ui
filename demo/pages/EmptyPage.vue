<script setup lang="ts">
import { JeButton, JeEmpty, JeIcon } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'
</script>

<template>
  <DemoPage
    title="Empty 空状态"
    description="数据为空时的占位提示。默认插画为自绘内联 SVG，配色由主色现算，可随主题一起换肤。"
  >
    <DemoBlock title="基础用法" description="默认文案为「暂无数据」，imageSize 控制插画尺寸。">
      <je-empty />
    </DemoBlock>

    <DemoBlock title="自定义文案与操作" description="通过 description 与 extra 插槽给出下一步操作引导。">
      <je-empty description="暂无订单记录">
        <template #extra>
          <je-button>去逛逛</je-button>
        </template>
      </je-empty>
    </DemoBlock>

    <DemoBlock title="自定义插画" description="默认插槽可完全替换插画，作用域参数提供建议尺寸。">
      <je-empty description="没有搜索结果" :image-size="80">
        <template #default="{ size }">
          <je-icon name="search" :size="size" />
        </template>
      </je-empty>
    </DemoBlock>
  </DemoPage>
</template>
