<script setup lang="ts">
import { ref } from 'vue'
import { JeTreeSelect } from '@jelly-kits/jelly-ui'
import type { JeTreeNode } from '../../src/components/JeTree/types'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const treeData: JeTreeNode[] = [
  {
    key: 'east',
    label: '华东大区',
    children: [
      { key: 'east-hz', label: '杭州分部' },
      { key: 'east-sh', label: '上海分部' },
    ],
  },
  {
    key: 'south',
    label: '华南大区',
    children: [
      { key: 'south-sz', label: '深圳分部' },
      { key: 'south-gz', label: '广州分部', disabled: true },
    ],
  },
  { key: 'north', label: '华北大区', children: [{ key: 'north-bj', label: '北京分部' }] },
]

const value = ref<string | number | null>(null)
const fixed = ref<string | number | null>('east-sh')
const lastChange = ref('')
</script>

<template>
  <DemoPage
    title="TreeSelect 树选择"
    description="基于 Tree 的单选下拉。桌面端是锚点浮层，窄屏自动切换为底部弹出层：可下拉关闭、锁定页面滚动并预留安全区。"
  >
    <DemoBlock title="基础用法" description="点击箭头展开，选中节点后自动收起；右侧图标可清空。">
      <je-tree-select v-model="value" :data="treeData" @change="lastChange = String($event)" />
      <p class="state">当前值：{{ value ?? 'null' }}｜最近变化：{{ lastChange || '暂无' }}</p>
    </DemoBlock>

    <DemoBlock title="已有默认值 + 手风琴展开">
      <je-tree-select v-model="fixed" :data="treeData" accordion />
      <p class="state">当前值：{{ fixed ?? 'null' }}</p>
    </DemoBlock>

    <DemoBlock title="禁用与不可清空">
      <je-tree-select :data="treeData" disabled placeholder="不可选择" />
      <je-tree-select v-model="fixed" :data="treeData" :clearable="false" />
    </DemoBlock>

    <DemoBlock title="空数据" description="没有可选节点时展示内置空状态。">
      <je-tree-select :data="[]" placeholder="暂无组织" />
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
