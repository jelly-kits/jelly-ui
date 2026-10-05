<script setup lang="ts">
import { ref } from 'vue'
import { JeCollapse, JeCollapseItem, JeTag } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const active = ref<(string | number)[]>(['1'])
const accordionActive = ref<(string | number)[]>(['a'])
const lastChange = ref('—')

const onChange = (name: string | number, value: (string | number)[]) => {
  lastChange.value = `${name} → [${value.join(', ')}]`
}
</script>

<template>
  <DemoPage
    title="Collapse 折叠面板"
    description="点击标题展开 / 收起内容，支持手风琴模式与禁用项；键盘 Enter / Space 也可操作。"
  >
    <DemoBlock title="基础用法">
      <je-collapse v-model="active" @change="onChange">
        <je-collapse-item name="1" title="什么是 Jelly UI？">
          Jelly UI 是一个以果冻手感为特色的 Vue 3 组件库。
        </je-collapse-item>
        <je-collapse-item name="2" title="如何换肤？">
          覆盖 --je-primary 与 --je-primary-end 两个变量即可。
        </je-collapse-item>
        <je-collapse-item name="3" title="禁用项" disabled>禁用后无法展开。</je-collapse-item>
      </je-collapse>
      <p class="state">当前展开：{{ active.join(', ') || '无' }}；最近一次 change：{{ lastChange }}</p>
    </DemoBlock>

    <DemoBlock title="手风琴模式" description="同时只能展开一项，标题右侧可通过 extra 插槽放内容。">
      <je-collapse v-model="accordionActive" accordion>
        <je-collapse-item name="a" title="面板 A">内容 A</je-collapse-item>
        <je-collapse-item name="b" title="面板 B">
          <template #extra><je-tag type="info">补充</je-tag></template>
          内容 B
        </je-collapse-item>
      </je-collapse>
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
