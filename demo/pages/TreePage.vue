<script setup lang="ts">
import { ref } from 'vue'
import { JeTree } from '@jelly-kits/jelly-ui'
import type { JeTreeNode } from '../../src/components/JeTree/types'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const treeData: JeTreeNode[] = [
  {
    key: 'design',
    label: '设计中心',
    icon: 'folder',
    children: [
      { key: 'design-ui', label: '界面设计', icon: 'image' },
      { key: 'design-token', label: '设计令牌', icon: 'star' },
      {
        key: 'design-research',
        label: '用户研究',
        icon: 'target',
        children: [{ key: 'design-interview', label: '访谈记录' }],
      },
    ],
  },
  {
    key: 'dev',
    label: '研发中心',
    icon: 'code',
    children: [
      { key: 'dev-fe', label: '前端组', icon: 'layers' },
      { key: 'dev-be', label: '服务端组', icon: 'database' },
      { key: 'dev-qa', label: '测试组', disabled: true },
    ],
  },
  { key: 'ops', label: '运维中心', icon: 'cloud' },
]

const selected = ref<Array<string | number>>([])
const lastCheck = ref('')

const onCheckChange = (node: JeTreeNode, isChecked: boolean) => {
  lastCheck.value = `${node.label} ${isChecked ? '已勾选' : '已取消'}`
}
</script>

<template>
  <DemoPage
    title="Tree 树形控件"
    description="递归渲染的树，支持展开、勾选与键盘操作（方向键移动 / 展开收起、Enter 或空格选中）。窄屏行高不低于 44px。"
  >
    <DemoBlock title="基础用法" description="点击节点选中；点击箭头展开收起，也可用键盘操作。">
      <je-tree v-model="selected" :data="treeData" default-expand-all />
      <p class="state">已选节点：{{ selected.length ? selected.join(', ') : '无' }}</p>
    </DemoBlock>

    <DemoBlock title="多选 + 父子级联" description="勾选父节点会级联勾选子节点，子节点全选时父节点自动选中（含半选态）。">
      <je-tree
        v-model="selected"
        :data="treeData"
        checkable
        multiple
        default-expand-all
        @check-change="onCheckChange"
      />
      <p class="state">最近一次勾选：{{ lastCheck || '暂无' }}</p>
    </DemoBlock>

    <DemoBlock
      title="手风琴模式 + 严格勾选"
      description="同一层级一次只展开一个节点；check-strictly 时父子勾选互不影响。"
    >
      <je-tree
        v-model="selected"
        :data="treeData"
        checkable
        multiple
        accordion
        check-strictly
        :default-expanded-keys="['design']"
      />
    </DemoBlock>

    <DemoBlock title="空数据">
      <je-tree :data="[]" empty-text="没有可选的节点" />
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
