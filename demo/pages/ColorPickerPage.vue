<script setup lang="ts">
import { ref } from 'vue'
import { JeColorPicker } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const primary = ref('#667EEA')
const withAlpha = ref('#764BA2CC')
const custom = ref('#22C55E')
const presets = ['#667EEA', '#764BA2', '#22C55E', '#F59E0B', '#EF4444', '#7C8DB5', '#0EA5E9', '#EC4899']
const active = ref('尚未取色')
</script>

<template>
  <DemoPage
    title="ColorPicker 颜色选择器"
    description="色相滑条 + 饱和度/明度取色面 + 预置色 + HEX 输入，颜色换算全部由组件内纯函数完成。桌面端为锚点浮层，窄屏切换为底部弹出层（可下拉关闭、锁定滚动、预留安全区）。"
  >
    <DemoBlock title="基础用法" description="拖动取色面或滑条时抛出 active-change，松手后提交 change。">
      <je-color-picker v-model="primary" @active-change="active = $event" />
      <p class="state">当前色：{{ primary }} · 实时：{{ active }}</p>
    </DemoBlock>

    <DemoBlock title="透明度与预置色" description="showAlpha 开启后输出 8 位 #RRGGBBAA；predefine 提供常用色板。">
      <je-color-picker v-model="withAlpha" show-alpha :predefine="presets" />
      <p class="state">带透明度：{{ withAlpha }}</p>
    </DemoBlock>

    <DemoBlock title="尺寸" description="size 可选 small / default / large。">
      <div class="row">
        <je-color-picker v-model="custom" size="small" />
        <je-color-picker v-model="custom" size="default" />
        <je-color-picker v-model="custom" size="large" />
      </div>
    </DemoBlock>

    <DemoBlock title="禁用态与移动端" description="禁用后无法展开面板；窄屏（≤768px）下面板贴底弹出，色块热区不小于 44px。">
      <je-color-picker v-model="primary" disabled />
      <p class="state">把视口缩到 768px 以下体验底部弹出层形态。</p>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.state {
  margin: 10px 0 0;
  font-size: 12px;
  color: var(--je-text-faint);
}
</style>
