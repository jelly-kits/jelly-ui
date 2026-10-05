<script setup lang="ts">
import { ref } from 'vue'
import { JeButton, JeMenu, JeMenuItem, JeSubMenu } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const verticalActive = ref<string | number>('dashboard')
const horizontalActive = ref<string | number>('guide')
const collapseActive = ref<string | number>('articles')
const disabledActive = ref<string | number>('a')

const collapse = ref(false)
const lastSelect = ref('')

/** select 事件同时给出 index 与从根开始的 indexPath */
const onSelect = (index: string | number) => {
  lastSelect.value = String(index)
}
</script>

<template>
  <DemoPage
    title="Menu 导航菜单"
    description="纵向菜单的子菜单用高度过渡展开，横向菜单与折叠态改用 useFloating 弹出浮层；支持方向键移动、Enter 选中、ArrowLeft / Escape 收起。折叠态只显示图标并用 Tooltip 提示标题。"
  >
    <DemoBlock title="纵向菜单" description="默认 uniqueOpened，同时只展开一个子菜单；子菜单可再嵌套。">
      <je-menu v-model="verticalActive" class="menu-box" @select="onSelect">
        <je-menu-item index="dashboard" icon="home">工作台</je-menu-item>
        <je-sub-menu index="content" icon="folder">
          <template #title>内容管理</template>
          <je-menu-item index="articles">文章列表</je-menu-item>
          <je-menu-item index="drafts">草稿箱</je-menu-item>
          <je-sub-menu index="media">
            <template #title>素材库</template>
            <je-menu-item index="images">图片</je-menu-item>
            <je-menu-item index="videos">视频</je-menu-item>
          </je-sub-menu>
        </je-sub-menu>
        <je-menu-item index="settings" icon="settings">系统设置</je-menu-item>
      </je-menu>
      <p class="state">当前选中：{{ verticalActive }}；最近一次 select：{{ lastSelect || '—' }}</p>
    </DemoBlock>

    <DemoBlock title="横向菜单" description="子菜单向下弹出浮层，点击浮层外或选中某项后自动收起。">
      <je-menu v-model="horizontalActive" mode="horizontal">
        <je-menu-item index="guide" icon="home">指南</je-menu-item>
        <je-sub-menu index="components">
          <template #title>组件</template>
          <je-menu-item index="menu">Menu 菜单</je-menu-item>
          <je-menu-item index="affix">Affix 固钉</je-menu-item>
          <je-menu-item index="backtop">Backtop 回到顶部</je-menu-item>
        </je-sub-menu>
        <je-menu-item index="about" icon="info">关于</je-menu-item>
      </je-menu>
      <p class="state">当前选中：{{ horizontalActive }}</p>
    </DemoBlock>

    <DemoBlock title="折叠态" description="仅纵向模式有效：折叠后只剩图标，悬停图标用 Tooltip 显示标题。">
      <je-button class="toggle" @click="collapse = !collapse">
        {{ collapse ? '展开菜单' : '折叠菜单' }}
      </je-button>
      <je-menu v-model="collapseActive" :collapse="collapse" class="menu-box">
        <je-menu-item index="dashboard" icon="home">工作台</je-menu-item>
        <je-sub-menu index="content" icon="folder">
          <template #title>内容管理</template>
          <je-menu-item index="articles">文章列表</je-menu-item>
          <je-menu-item index="drafts">草稿箱</je-menu-item>
        </je-sub-menu>
        <je-menu-item index="settings" icon="settings">系统设置</je-menu-item>
      </je-menu>
    </DemoBlock>

    <DemoBlock title="禁用项" description="禁用的菜单项与子菜单不响应点击，也不会进入方向键序列。">
      <je-menu v-model="disabledActive" class="menu-box">
        <je-menu-item index="a" icon="home">可用项</je-menu-item>
        <je-menu-item index="b" icon="lock" disabled>禁用项</je-menu-item>
        <je-sub-menu index="c" icon="folder" disabled>
          <template #title>禁用子菜单</template>
          <je-menu-item index="c1">子项</je-menu-item>
        </je-sub-menu>
      </je-menu>
      <p class="state">当前选中：{{ disabledActive }}</p>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.menu-box {
  max-width: 240px;
}

.toggle {
  margin-bottom: 14px;
}

.state {
  margin: 12px 0 0;
  font-size: 12px;
  color: var(--je-text-faint);
}
</style>
