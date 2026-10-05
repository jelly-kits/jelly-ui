<script setup lang="ts">
import { ref } from 'vue'
import { JeTabbar, JeTabbarItem } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const active = ref('home')
const activeIcon = ref('star')
const fixedActive = ref('home')
const changed = ref<string | number>('home')
</script>

<template>
  <DemoPage
    title="Tabbar 底部导航"
    description="应用中固定在底部的标签栏，配合 TabbarItem 使用；选中态只改变文字与图标颜色，不铺底色。"
  >
    <DemoBlock title="基础用法" description="v-model 绑定当前选中的 name，切换时同步更新。">
      <div class="tabbar-scope">
        <je-tabbar v-model="active" :fixed="false" @change="changed = $event">
          <je-tabbar-item name="home" icon="home" text="首页" />
          <je-tabbar-item name="search" icon="search" text="搜索" />
          <je-tabbar-item name="bell" icon="bell" text="消息" :badge="3" />
          <je-tabbar-item name="user" icon="user" text="我的" />
        </je-tabbar>
      </div>
      <p class="hint">当前选中：{{ changed }}</p>
    </DemoBlock>

    <DemoBlock title="独立图标与小红点" description="activeIcon 指定选中时的图标，dot 显示不带数字的小红点。">
      <div class="tabbar-scope">
        <je-tabbar v-model="activeIcon" :fixed="false">
          <je-tabbar-item name="star" icon="star" active-icon="heart" text="收藏" />
          <je-tabbar-item name="inbox" icon="inbox" active-icon="mail" text="收件箱" dot />
          <je-tabbar-item name="settings" icon="settings" active-icon="shield" text="设置" badge="99+" />
        </je-tabbar>
      </div>
    </DemoBlock>

    <DemoBlock
      title="固定在底部"
      description="fixed 默认开启，placeholder 会把导航栏高度补在内容末尾，避免最后一条被盖住（演示区已限定高度）。"
    >
      <div class="tabbar-scope tabbar-scope--tall">
        <p v-for="n in 6" :key="n" class="tabbar-scope__line">内容第 {{ n }} 行</p>
        <je-tabbar v-model="fixedActive" fixed placeholder>
          <je-tabbar-item name="home" icon="home" text="首页" />
          <je-tabbar-item name="search" icon="search" text="搜索" />
          <je-tabbar-item name="user" icon="user" text="我的" />
        </je-tabbar>
      </div>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.hint {
  margin: 12px 0 0;
  font-size: 13px;
  color: var(--je-text-faint);
}

/* 容器带 transform 会成为内部 fixed 元素的包含块，把演示限制在框内 */
.tabbar-scope {
  position: relative;
  overflow: hidden;
  background: var(--je-surface);
  border: var(--je-border);
  border-radius: var(--je-radius);
  transform: translate(0);
}

.tabbar-scope--tall {
  height: 240px;
  overflow-y: auto;
}

.tabbar-scope__line {
  margin: 0;
  padding: 14px 16px;
  font-size: 14px;
  color: var(--je-text-muted);
  border-bottom: var(--je-border);
}
</style>
