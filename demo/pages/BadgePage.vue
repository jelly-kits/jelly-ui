<script setup lang="ts">
import { ref } from 'vue'
import { JeAvatar, JeBadge, JeButton } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const count = ref(5)
</script>

<template>
  <DemoPage
    title="Badge 徽标"
    description="在头像或按钮右上角显示数字或小圆点，数字超过 max 时折叠为 99+。"
  >
    <DemoBlock title="基础用法">
      <div class="row">
        <je-badge :value="count"><je-avatar /></je-badge>
        <je-badge :value="120" :max="99"><je-avatar /></je-badge>
        <je-badge is-dot><je-avatar /></je-badge>
        <je-badge value="新"><je-button>按钮</je-button></je-badge>
      </div>
    </DemoBlock>

    <DemoBlock title="语义色与自定义色">
      <div class="row">
        <je-badge :value="1" type="primary"><je-avatar /></je-badge>
        <je-badge :value="2" type="success"><je-avatar /></je-badge>
        <je-badge :value="3" type="warning"><je-avatar /></je-badge>
        <je-badge :value="4" type="info"><je-avatar /></je-badge>
        <je-badge :value="5" color="#0ea5e9"><je-avatar /></je-badge>
      </div>
    </DemoBlock>

    <DemoBlock title="隐藏与独立显示" description="hidden 可临时隐藏角标；不传插槽时角标独立显示。">
      <div class="row">
        <je-badge :value="count" :hidden="count > 10"><je-avatar /></je-badge>
        <je-badge :value="count" />
        <je-badge :value="count" :max="9" />
      </div>
      <div class="row">
        <je-button @click="count += 1">增加</je-button>
      </div>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 20px;
}
</style>
