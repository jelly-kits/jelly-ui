<script setup lang="ts">
import { ref } from 'vue'
import {
  JeCheckboxGroup,
  JeField,
  type JeCheckboxOption,
} from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const topics: JeCheckboxOption[] = [
  { label: 'UI 设计', value: 'design' },
  { label: '前端开发', value: 'frontend' },
  { label: '动效与交互', value: 'animation' },
  { label: '产品思维', value: 'product' },
]

const picked = ref<(string | number)[]>(['design'])
</script>

<template>
  <DemoPage
    title="Checkbox 多选框"
    description="勾选与取消播放不同方向的一次性 pop 动画，勾号的描边进度由 CSS 过渡驱动。"
  >
    <DemoBlock title="基础用法">
      <je-field label="感兴趣的主题">
        <je-checkbox-group v-model="picked" :options="topics" />
      </je-field>
      <p class="state">当前值：[{{ picked.join(', ') }}]</p>
    </DemoBlock>

    <DemoBlock title="尺寸" description="large / default / small 三档，不传时取全局配置。">
      <je-field label="感兴趣的主题">
        <je-checkbox-group v-model="picked" :options="topics" size="large" />
      </je-field>
      <je-field label="感兴趣的主题">
        <je-checkbox-group v-model="picked" :options="topics" />
      </je-field>
      <je-field label="感兴趣的主题">
        <je-checkbox-group v-model="picked" :options="topics" size="small" />
      </je-field>
    </DemoBlock>

    <DemoBlock
      title="无底色无边框"
      description="background / border 置为 false，选项退成勾选框加文字，适合铺在已有底色的页面上。"
    >
      <je-field label="感兴趣的主题">
        <je-checkbox-group v-model="picked" :options="topics" :background="false" :border="false" />
      </je-field>
    </DemoBlock>

    <DemoBlock title="禁用">
      <je-field label="不可选择">
        <je-checkbox-group :options="topics" disabled />
      </je-field>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.state {
  margin: 10px 0 0;
  font-size: 12px;
  color: var(--je-text-faint);
}
</style>