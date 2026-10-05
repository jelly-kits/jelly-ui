<script setup lang="ts">
import { ref } from 'vue'
import { JeTabPane, JeTabs } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const basic = ref<string | number>('user')
const side = ref<string | number>('profile')
const card = ref<string | number>('c1')
const borderCard = ref<string | number>('b1')

const removable = ref([
  { name: 'tab1', label: '标签一' },
  { name: 'tab2', label: '标签二' },
  { name: 'tab3', label: '标签三' },
])
const editable = ref<string | number>('tab1')

const onRemove = (name: string | number) => {
  removable.value = removable.value.filter((pane) => pane.name !== name)
  if (editable.value === name) editable.value = removable.value[0]?.name ?? ''
}
</script>

<template>
  <DemoPage
    title="Tabs 标签页"
    description="分隔内容上有关联但属于不同类别的数据集合。支持 line / card / border-card 三种外观与上下左右四个方位，键盘方向键、Home / End 均可切换。"
  >
    <DemoBlock title="基础用法" description="下划线指示条会跟着激活项滑动。">
      <je-tabs v-model="basic">
        <je-tab-pane name="user" label="用户管理">用户管理的内容区域</je-tab-pane>
        <je-tab-pane name="config" label="配置管理">配置管理的内容区域</je-tab-pane>
        <je-tab-pane name="role" label="角色管理">角色管理的内容区域</je-tab-pane>
        <je-tab-pane name="task" label="定时任务">定时任务的内容区域</je-tab-pane>
      </je-tabs>
      <p class="state">当前标签：{{ basic }}</p>
    </DemoBlock>

    <DemoBlock title="外观与方位" description="左侧 tab（tabPosition=&quot;left&quot;）适合纵向层级较多的场景。">
      <je-tabs v-model="side" tab-position="left">
        <je-tab-pane name="profile" label="基本资料">基本资料面板</je-tab-pane>
        <je-tab-pane name="security" label="安全设置">安全设置面板</je-tab-pane>
        <je-tab-pane name="notice" label="消息通知">消息通知面板</je-tab-pane>
      </je-tabs>
    </DemoBlock>

    <DemoBlock title="卡片与边框卡片">
      <je-tabs v-model="card" type="card">
        <je-tab-pane name="c1" label="卡片一">卡片一的内容</je-tab-pane>
        <je-tab-pane name="c2" label="卡片二">卡片二的内容</je-tab-pane>
        <je-tab-pane name="c3" label="卡片三">卡片三的内容</je-tab-pane>
      </je-tabs>
      <je-tabs v-model="borderCard" type="border-card">
        <je-tab-pane name="b1" label="边框一">边框卡片一的内容</je-tab-pane>
        <je-tab-pane name="b2" label="边框二">边框卡片二的内容</je-tab-pane>
        <je-tab-pane name="b3" label="边框三">边框卡片三的内容</je-tab-pane>
      </je-tabs>
    </DemoBlock>

    <DemoBlock
      title="可关闭与禁用"
      description="关闭按钮触屏可点，键盘聚焦到 tab 后按 Delete 也能关闭。窄屏下 tab 条横向滚动，热区不小于 44px。"
    >
      <je-tabs v-model="editable" type="card" closable @tab-remove="onRemove">
        <je-tab-pane v-for="pane in removable" :key="pane.name" :name="pane.name" :label="pane.label">
          {{ pane.label }} 的内容
        </je-tab-pane>
      </je-tabs>
      <je-tabs v-model="basic">
        <je-tab-pane name="user" label="用户管理">用户管理的内容区域</je-tab-pane>
        <je-tab-pane name="config" label="配置管理" disabled>禁用项无法被选中</je-tab-pane>
      </je-tabs>
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
