<script setup lang="ts">
import { computed, ref } from 'vue'
import { JeScrollbar, JeSidebar, JeSidebarItem } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const active = ref('hot')

const categories = [
  {
    name: 'hot',
    title: '热门推荐',
    badge: 12,
    content: ['爆款单品', '限时秒杀', '本周热销', '新品首发', '清仓特价', '会员专享'],
  },
  { name: 'digital', title: '数码电器', content: ['手机', '电脑', '影音', '智能穿戴', '摄影摄像', '生活电器'] },
  { name: 'clothes', title: '服饰鞋包', dot: true, content: ['男装', '女装', '运动鞋', '箱包', '配饰', '童装'] },
  { name: 'food', title: '生鲜食品', content: ['水果', '蔬菜', '肉禽蛋', '水产', '乳品', '零食'] },
  { name: 'baby', title: '母婴玩具', content: ['纸尿裤', '婴儿车', '积木', '喂养用品', '洗护', '童车'] },
]

const currentCategory = computed(
  () => categories.find((item) => item.name === active.value) ?? categories[0],
)
</script>

<template>
  <DemoPage
    title="Sidebar 侧边导航"
    description="竖向分类导航，常用于「左分类右内容」的移动端商品页，选中项左侧带高亮指示条。"
  >
    <DemoBlock title="基础用法" description="v-model 记录选中项的 name，右侧内容随选中项切换。">
      <div class="layout">
        <je-sidebar v-model="active" class="sidebar">
          <je-sidebar-item
            v-for="item in categories"
            :key="item.name"
            :name="item.name"
            :title="item.title"
            :badge="item.badge"
            :dot="item.dot"
          />
        </je-sidebar>

        <je-scrollbar class="content">
          <div class="content__inner">
            <h4 class="content__title">{{ currentCategory.title }}</h4>
            <div v-for="name in currentCategory.content" :key="name" class="content__item">
              {{ name }}
            </div>
          </div>
        </je-scrollbar>
      </div>
      <p class="hint">当前分类：{{ currentCategory.title }}</p>
    </DemoBlock>

    <DemoBlock title="禁用某一项" description="disabled 的项不可点击，也不参与高亮。">
      <div class="layout">
        <je-sidebar v-model="active" class="sidebar">
          <je-sidebar-item name="hot" title="可选" />
          <je-sidebar-item name="locked" title="已下架" disabled />
          <je-sidebar-item name="digital" title="可选" />
        </je-sidebar>

        <je-scrollbar class="content">
          <div class="content__inner">
            <div class="content__item">右侧内容区（滚动试试）</div>
            <div v-for="n in 12" :key="n" class="content__item">占位内容 {{ n }}</div>
          </div>
        </je-scrollbar>
      </div>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.layout {
  display: flex;
  height: 260px;
  overflow: hidden;
  border: 1px solid var(--je-border-color);
  border-radius: var(--je-radius);
}

.sidebar {
  flex: 0 0 92px;
  border-radius: 0;
  background: var(--je-surface-hover);
}

.content {
  flex: 1 1 0;
  min-width: 0;
  background: var(--je-surface);
}

.content__inner {
  padding: 16px;
}

.content__title {
  margin: 0 0 12px;
  font-size: 15px;
}

.content__item {
  padding: 10px 0;
  font-size: 14px;
  color: var(--je-text-muted);
}

.hint {
  margin: 12px 0 0;
  font-size: 13px;
  color: var(--je-text-faint);
}
</style>
