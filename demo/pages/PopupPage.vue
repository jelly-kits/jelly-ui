<script setup lang="ts">
import { ref } from 'vue'
import { JeButton, JePopup } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const center = ref(false)
const bottom = ref(false)
const top = ref(false)
const left = ref(false)
const right = ref(false)
const round = ref(false)
</script>

<template>
  <DemoPage
    title="Popup 弹出层"
    description="通用弹出容器，支持中心 / 上下左右五个方向，自带遮罩、滚动锁定与焦点圈定。"
  >
    <DemoBlock title="居中弹出" description="默认 position 为 center，适合对话框类内容。">
      <je-button variant="ghost" @click="center = true">居中弹出</je-button>
      <je-popup v-model="center" closeable>
        <div class="panel">这是一段居中弹出的内容</div>
      </je-popup>
    </DemoBlock>

    <DemoBlock title="底部弹出（移动端常用）" description="position=bottom 配合 round 得到贴底的圆角面板。">
      <je-button variant="ghost" @click="bottom = true">底部弹出</je-button>
      <je-popup v-model="bottom" position="bottom" round safe-area-inset-bottom>
        <div class="panel panel--tall">
          <h4 class="panel__title">选择支付方式</h4>
          <p class="panel__text">底部面板自动预留安全区，圆角只作用在顶部两条边。</p>
        </div>
      </je-popup>
    </DemoBlock>

    <DemoBlock title="上下左右四向" description="top / left / right 分别从对应方向滑入。">
      <div class="toolbar">
        <je-button size="small" variant="ghost" @click="top = true">顶部</je-button>
        <je-button size="small" variant="ghost" @click="left = true">左侧</je-button>
        <je-button size="small" variant="ghost" @click="right = true">右侧</je-button>
      </div>
      <je-popup v-model="top" position="top" round>
        <div class="panel">顶部弹出</div>
      </je-popup>
      <je-popup v-model="left" position="left">
        <div class="panel panel--tall">左侧弹出</div>
      </je-popup>
      <je-popup v-model="right" position="right">
        <div class="panel panel--tall">右侧弹出</div>
      </je-popup>
    </DemoBlock>

    <DemoBlock title="关闭按钮与遮罩设置" description="closeable 显示关闭按钮，closeOnClickOverlay 控制点击遮罩是否关闭。">
      <je-button variant="ghost" @click="round = true">带关闭按钮</je-button>
      <je-popup v-model="round" position="bottom" round closeable close-icon-position="top-right">
        <div class="panel panel--tall">
          <h4 class="panel__title">可关闭面板</h4>
          <p class="panel__text">点击右上角图标或遮罩都可以关闭。</p>
        </div>
      </je-popup>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.panel {
  padding: 22px;
  font-size: 14px;
  color: var(--je-text);
  background: var(--je-popup);
}

.panel--tall {
  min-height: 180px;
}

.panel__title {
  margin: 0 0 8px;
  font-size: 16px;
}

.panel__text {
  margin: 0;
  color: var(--je-text-muted);
}

.toolbar {
  display: flex;
  gap: 10px;
}
</style>
