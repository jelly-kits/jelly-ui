<script setup lang="ts">
import { ref } from 'vue'
import { JeButton, JeDrawer, JeSpace } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const right = ref(false)
const left = ref(false)
const top = ref(false)
const footerOpen = ref(false)

const logs = ref<string[]>([])

const onOpen = (name: string) => {
  logs.value = [`${name} 已打开`, ...logs.value].slice(0, 3)
}
</script>

<template>
  <DemoPage
    title="Drawer 抽屉"
    description="从屏幕边缘滑出的面板，支持上下左右四个方向。遮罩、锁定滚动、焦点陷阱与 Esc 关闭均已内置；窄屏下左右抽屉宽度收窄为 86vw。"
  >
    <DemoBlock title="基础用法" description="默认从右侧滑入，尺寸 320px，可点击遮罩或按 Esc 关闭。">
      <je-space>
        <je-button @click="right = true">右侧抽屉</je-button>
        <je-button @click="left = true">左侧抽屉</je-button>
      </je-space>
    </DemoBlock>

    <DemoBlock title="不同方向" description="direction 支持 rtl / ltr / ttb / btt，size 传字符串时原样使用。">
      <je-space>
        <je-button @click="top = true">从上滑入</je-button>
        <je-button @click="footerOpen = true">从下滑入</je-button>
      </je-space>
      <p class="state">打开记录：{{ logs.length ? logs.join('，') : '暂无' }}</p>
    </DemoBlock>

    <DemoBlock title="自定义页脚与内容" description="使用 header / footer 插槽，内容区超出时自动滚动。">
      <je-button @click="footerOpen = true">带页脚的抽屉</je-button>
    </DemoBlock>

    <je-drawer v-model="right" title="右侧抽屉" @open="onOpen('右侧抽屉')">
      <p>默认方向 rtl，从右侧滑入。面板内容较长时，内容区可独立滚动。</p>
      <p v-for="i in 8" :key="i">这是第 {{ i }} 段用于撑高内容区的占位文字。</p>
    </je-drawer>

    <je-drawer v-model="left" title="左侧抽屉" direction="ltr" @open="onOpen('左侧抽屉')">
      <p>direction 为 ltr，从左侧滑入。</p>
    </je-drawer>

    <je-drawer v-model="top" title="顶部抽屉" direction="ttb" size="40vh" @open="onOpen('顶部抽屉')">
      <p>direction 为 ttb，size 传入字符串 40vh。</p>
    </je-drawer>

    <je-drawer
      v-model="footerOpen"
      title="底部抽屉"
      direction="btt"
      size="50vh"
      @open="onOpen('底部抽屉')"
    >
      <p>从底部滑入，适合移动端操作面板。页脚插槽里放操作按钮。</p>
      <template #footer>
        <je-button variant="ghost" @click="footerOpen = false">取消</je-button>
        <je-button @click="footerOpen = false">确定</je-button>
      </template>
    </je-drawer>
  </DemoPage>
</template>

<style scoped>
.state {
  margin: 12px 0 0;
  font-size: 12px;
  color: var(--je-text-faint);
}
</style>
