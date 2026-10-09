<script setup lang="ts">
import { JeIcon, JeText, type JeIconName } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'
import { demoRoutes, withLocale } from '../router'
import { useDemoI18n } from '../i18n'

/** 卡片链接要带当前语言段（demoRoutes 的 path 本身不含语言段） */
const { locale, t } = useDemoI18n()

const routes = demoRoutes.filter((route) => route.path !== '/')

/** 页头下方的外链入口：本项目的源码仓库，以及 uni-app 版的仓库与文档站 */
const links: { href: string; icon: JeIconName; label: string }[] = [
  { href: 'https://github.com/jelly-kits/jelly-ui', icon: 'github', label: 'GitHub 源码' },
  {
    href: 'https://github.com/jelly-kits/jelly-ui-uniapp',
    icon: 'github',
    label: 'uni-app 版仓库',
  },
  {
    href: 'https://jelly-kits.github.io/jelly-ui-uniapp/',
    icon: 'external-link',
    label: 'uni-app 版文档',
  },
]
</script>

<template>
  <DemoPage
    title="Jelly UI"
    logo
    description="基于「果冻」手感的 Vue 3 组件库原型：连续交互走弹簧内核，一次性动画交给 CSS，全部组件兼容移动端。"
  >
    <div class="home__links">
      <a
        v-for="link in links"
        :key="link.href"
        class="home__link"
        :href="link.href"
        target="_blank"
        rel="noopener noreferrer"
      >
        <je-icon :name="link.icon" :size="16" />
        <span>{{ t(link.label) }}</span>
      </a>
    </div>

    <DemoBlock title="组件总览" :description="`共 ${routes.length} 个组件，点击卡片进入对应文档页。`">
      <div class="home__grid">
        <RouterLink
          v-for="route in routes"
          :key="route.path"
          class="home__item"
          :to="withLocale(locale, route.path)"
        >
          <span class="home__item-title">{{ route.title }}</span>
          <span class="home__item-group">{{ route.group }}</span>
        </RouterLink>
      </div>
    </DemoBlock>

    <DemoBlock
      title="移动端适配"
      description="窄屏（≤768px）下，弹层自动切换为底部弹出层，并附带下拉关闭、滚动锁定与安全区留白。"
    >
      <div class="home__list">
        <je-text>触控热区不小于 44px</je-text>
        <je-text>不依赖 hover 也能完整操作</je-text>
        <je-text>弹层内边距包含 env(safe-area-inset)</je-text>
      </div>
    </DemoBlock>

    <DemoBlock title="换肤" description="右上角切换主题：只需覆盖 --je-primary / --je-primary-end 两个变量。">
      <je-text>组件内部不写死任何具体颜色，渐变、光晕、半透明强调色都由主色实时计算。</je-text>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
/* 页头下的外链入口 */
.home__links {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  /* 页头 description 自带 32px 下边距，这里补到与下方卡片一致的分隔 */
  margin-bottom: 36px;
}

.home__link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 600;
  color: var(--je-text);
  text-decoration: none;
  background: var(--je-surface);
  border: var(--je-border);
  border-radius: var(--je-radius);
  transition: background 0.2s ease, transform 0.2s var(--je-ease-out-back);
}

.home__link:hover {
  background: var(--je-surface-hover);
  transform: translateY(-2px);
}

.home__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}

.home__item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 16px;
  color: var(--je-text);
  text-decoration: none;
  background: var(--je-surface);
  border: var(--je-border);
  border-radius: var(--je-radius);
  transition: background 0.2s ease, transform 0.2s var(--je-ease-out-back);
}

.home__item:hover {
  background: var(--je-surface-hover);
  transform: translateY(-2px);
}

.home__item-title {
  font-size: 14px;
  font-weight: 600;
}

.home__item-group {
  font-size: 12px;
  color: var(--je-text-faint);
}

.home__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>