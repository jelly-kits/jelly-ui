<script setup lang="ts">
import { computed, provide, ref } from 'vue'
import { useRoute } from 'vue-router'
import { JeAnchor, JeAnchorLink, JeBacktop, JeScrollbar, JeSegmented } from '@jelly-kits/jelly-ui'
import { componentApi, pageApi, pageSource, type ComponentApi } from '../api-data'
import ApiSection from './ApiSection.vue'
import DemoPreviewFrame from './DemoPreviewFrame.vue'
import { apiGroupId, apiSectionId, componentLabel, visibleApiGroups } from './apiGroups'
import { DEMO_PAGE_KEY, type DemoAnchor } from './demoCode'
import { useDemoI18n } from '../i18n'

const props = defineProps<{
  title: string
  description?: string
  logo?: boolean
  /** 关掉全站的回到顶部按钮：页面自己就在演示回顶（如 Backtop 文档页）时，避免与示例按钮叠在同一位置 */
  hideBacktop?: boolean
}>()

/** 中文原文即 key，未收录回落中文（见 demo/i18n/index.ts） */
const { t } = useDemoI18n()

/** 页面标题与 API 小节在正文里的锚点 id */
const PAGE_TOP_ID = 'demo-page-top'
const API_ID = 'demo-page-api'

/** API 小节及其子项的排序基数：远大于演示块序号，又给 100 的步长留足子项空间 */
const API_ORDER_BASE = 1e6

/** 页面自身源码，示例代码框据此截取每个演示块的写法 */
const rawPages = import.meta.glob('../pages/*.vue', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const sourceByFile: Record<string, string> = {}
for (const [path, text] of Object.entries(rawPages)) {
  sourceByFile[path.slice(path.lastIndexOf('/') + 1)] = text
}

const route = useRoute()

/** 预览路由下（iframe 内）只留演示块本身：不要页面标题、右侧目录与第三列留白 */
const isPreview = computed(() => route.meta.preview === true)

/**
 * 查表键：pageApi / pageSource 的键是**不带语言段**的页面路径
 * （scripts/gen-api.mjs 按 demoRoutes 的 path 生成），所以读路由的 meta.basePath 而不是带语言段的 route.path。
 * 预览态（iframe 内）刻意取空串：与「语言进路由」之前的行为一致，示例代码与 API 表都不进移动端预览。
 */
const lookupKey = computed(() => {
  if (isPreview.value) return ''
  return (route.meta.basePath as string | undefined) ?? route.path
})

/** 页面自身源码，示例代码框据此截取每个演示块的写法 */
const source = computed(() => sourceByFile[pageSource[lookupKey.value] ?? ''] ?? null)

/** 各演示块挂载时登记进来的目录锚点 */
const anchors = ref<DemoAnchor[]>([])

let blockIndex = 0
provide(DEMO_PAGE_KEY, {
  source,
  nextIndex: () => {
    const current = blockIndex
    blockIndex += 1
    return current
  },
  registerAnchor: (anchor) => {
    if (!anchors.value.some((item) => item.id === anchor.id)) {
      anchors.value = [...anchors.value, anchor]
    }
  },
  unregisterAnchor: (id) => {
    anchors.value = anchors.value.filter((item) => item.id !== id)
  },
})

/** 该页要展示的组件 API，组件没有对应分组时 ApiSection 内部会自己跳过 */
const apiGroups = computed<{ name: string; api: ComponentApi }[]>(() => {
  const list: { name: string; api: ComponentApi }[] = []
  for (const name of pageApi[lookupKey.value] ?? []) {
    const api = componentApi[name]
    if (api) list.push({ name, api })
  }
  return list
})

/**
 * 右侧本页目录：页面标题 + 各演示块标题 + API 小节（API 下再挂两级子项），顺序与正文一致。
 * 子项：二级是组件（如 Button），三级是组件内的 API 分组（属性 / 事件 / 插槽 / 方法）。
 */
const tocItems = computed<DemoAnchor[]>(() => {
  const list: DemoAnchor[] = [{ id: PAGE_TOP_ID, title: t(props.title), order: -1, level: 1 }]
  // 演示块登记的是中文原文，这里过一遍 t()，切语言时目录跟着变
  for (const anchor of anchors.value) list.push({ ...anchor, title: t(anchor.title), level: 1 })

  if (apiGroups.value.length) {
    list.push({ id: API_ID, title: 'API', order: API_ORDER_BASE, level: 1 })
    apiGroups.value.forEach((item, index) => {
      const base = API_ORDER_BASE + (index + 1) * 100
      list.push({
        id: apiSectionId(item.name),
        title: componentLabel(item.name),
        order: base,
        level: 2,
      })
      visibleApiGroups(item.api).forEach((group, groupIndex) => {
        list.push({
          id: apiGroupId(item.name, group.key),
          title: t(group.short),
          order: base + groupIndex + 1,
          level: 3,
        })
      })
    })
  }

  return list.sort((a, b) => a.order - b.order)
})

/** 第三列的两种形态。默认是本页目录，切到预览时才挂载 iframe（避免每个页都多启一个应用实例） */
type AsideMode = 'toc' | 'preview'

/** 形态落在 localStorage：它只是文档站的阅读偏好，换页 / 刷新后应当保持 */
const ASIDE_MODE_KEY = 'je-demo-aside'

const readAsideMode = (): AsideMode => (localStorage.getItem(ASIDE_MODE_KEY) === 'preview' ? 'preview' : 'toc')

const asideMode = ref<AsideMode>(readAsideMode())
/** 选项文案过 t()：写成 computed 才能跟着语言切换更新 */
const asideOptions = computed(() => [
  { label: t('本页目录'), value: 'toc' },
  { label: t('移动端预览'), value: 'preview' },
])

/**
 * 目录列的高度上限，交给 JeScrollbar 的 max-height 模式（根元素 height: auto、只有 wrap 被 max-height 封顶）。
 * 不能用 flex: 1 1 0 去分配：aside 是 sticky 且只有 max-height、没有确定高度，
 * 百分比高度的子级解析不出高度，wrap 会退回内容高、被根的 overflow: hidden 裁掉（目录看着像空的）。
 * 数值 = aside 的 max-height（100vh - 108，见样式注释）再减掉分段开关与其间距 48 + 16。
 */
const TOC_MAX_HEIGHT = 'calc(100vh - 172px)'

const setAsideMode = (value: string | number) => {
  asideMode.value = value === 'preview' ? 'preview' : 'toc'
  localStorage.setItem(ASIDE_MODE_KEY, asideMode.value)
}
</script>

<template>
  <article class="demo-page" :class="{ 'is-preview': isPreview }">
    <div class="demo-page__content">
      <div
        v-if="!isPreview"
        :id="PAGE_TOP_ID"
        class="demo-page__head"
        :class="{ 'has-logo': logo }"
      >
        <img v-if="logo" class="demo-page__logo" src="/logo.svg" alt="Jelly UI" width="56" height="56" >
        <div class="demo-page__headings">
          <h1 class="demo-page__title">{{ t(title) }}</h1>
          <p v-if="description" class="demo-page__desc">{{ t(description) }}</p>
        </div>
      </div>
      <slot />

      <section v-if="!isPreview && apiGroups.length" class="demo-page__api">
        <h2 :id="API_ID" class="demo-page__api-title">API</h2>
        <ApiSection
          v-for="item in apiGroups"
          :key="item.name"
          :name="item.name"
          :api="item.api"
        />
      </section>
    </div>

    <aside
      v-if="!isPreview"
      class="demo-page__aside"
      :class="{ 'is-preview': asideMode === 'preview' }"
    >
      <je-segmented
        class="demo-page__switch"
        block
        :model-value="asideMode"
        :options="asideOptions"
        @update:model-value="setAsideMode"
      />

      <!--
        本页目录：锚点挂在真正滚动的 #doc-scroll 上（JeScrollbar 的 wrap）；
        offset 40 略大于正文 32px 的上内边距，滚到顶时页面标题才算「已进入阈值」而被点亮。
        目录列比视口高时在这里自己滚（同样是 JeScrollbar），否则底部的 API 子项永远够不着。
      -->
      <je-scrollbar
        v-if="asideMode === 'toc'"
        class="demo-page__toc"
        :max-height="TOC_MAX_HEIGHT"
      >
        <je-anchor container="#doc-scroll" :offset="40">
          <je-anchor-link
            v-for="item in tocItems"
            :key="item.id"
            :class="`is-level-${item.level}`"
            :href="`#${item.id}`"
            :title="item.title"
          />
        </je-anchor>
      </je-scrollbar>

      <!-- 移动端预览：iframe 有自己的视口，390px 下 useIsMobile() 才会成立 -->
      <demo-preview-frame v-else />
    </aside>

    <!--
      全站回到顶部：所有页面都走 DemoPage，挂这一处即覆盖全部路由。
      真正的滚动元素是主内容区的 #doc-scroll（JeScrollbar 的 wrap），必须显式指给它 ——
      窗口本身不滚，target 缺省会退回 window 而永远不显示。
      两种页面不渲染：① 预览态（iframe 内）没有 #doc-scroll，也没有回顶需求；
      ② 传了 hide-backtop 的页面（Backtop 文档页自己就有示例按钮，叠上去会重合）。
    -->
    <je-backtop v-if="!isPreview && !hideBacktop" target="#doc-scroll" />
  </article>
</template>

<style scoped>
/* 正文 + 右侧第三列：整行居中，正文列自己封顶到阅读舒适宽度 */
.demo-page {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 40px;
  padding: 32px 28px 64px;
}

.demo-page__content {
  flex: 1 1 auto;
  min-width: 0;
  max-width: 904px;
}

/*
 * 第三列跟随主内容区滚动：sticky 的包含块就是 #doc-scroll（真正的滚动元素），
 * top 相对的是滚动视口而不是元素本身，所以滚动时这一列钉在顶部。
 * min-width: 0 与放开换行缺一不可：锚点链接自带 white-space: nowrap，
 * flex 项的 min-width: auto 会取内容的 min-content，把这一列撑到最长标题的宽度。
 * max-height 是给目录用的：sticky 元素比视口高时底部会被切掉且无法滚动，
 * 所以这里按「滚动视口高度 - 上下边距」封顶（视口 = 100vh - 顶栏 60），内部再自己滚。
 * 列宽两种形态**一致**（预览要装下 390px 的手机视口，目录列跟着同宽），
 * 这样在「本页目录 ⇄ 移动端预览」间切换时整行布局不跳动。
 */
.demo-page__aside {
  flex: 0 0 390px;
  min-width: 0;
  position: sticky;
  top: 24px;
  max-height: calc(100vh - 108px);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 预览形态不封高（手机视口比目录长）；列宽已由上面的 390px 定死，这里只放开高度 */
.demo-page__aside.is-preview {
  max-height: none;
}

/* 形态开关始终可见，不参与滚动 */
.demo-page__switch {
  flex: 0 0 auto;
}

/*
 * 目录列：高度完全交给 JeScrollbar 的 max-height 模式（根 height: auto、wrap 被 max-height 封顶），
 * 这里只让它按内容占位、不参与 flex 伸缩 —— 一旦改成 flex: 1 1 0 / 百分比高度，
 * 在「sticky + 只有 max-height」的父级里解析不出高度，wrap 会退回内容高被根裁掉，目录就空了。
 */
.demo-page__toc {
  flex: 0 0 auto;
}

/* 锚点链接自带 nowrap，长标题会把列撑宽 */
.demo-page__aside :deep(.je-anchor__link) {
  white-space: normal;
}

/*
 * 目录层级缩进：二级（组件）与三级（API 分组）依次内收，靠缩进体现主次。
 * 这两级条目也多、字号小，顺带把锚点 44px 的触控热区收窄成目录密度。
 */
.demo-page__aside :deep(.je-anchor__item.is-level-2 .je-anchor__link),
.demo-page__aside :deep(.je-anchor__item.is-level-3 .je-anchor__link) {
  min-height: 30px;
  padding-top: 4px;
  padding-bottom: 4px;
  font-size: 13px;
}

.demo-page__aside :deep(.je-anchor__item.is-level-2 .je-anchor__link) {
  padding-left: 30px;
}

.demo-page__aside :deep(.je-anchor__item.is-level-3 .je-anchor__link) {
  padding-left: 42px;
}

/* 预览态（iframe 内）：只剩演示块，去掉居中留白与 904px 上限 */
.demo-page.is-preview {
  display: block;
  padding: 16px;
}

.demo-page.is-preview .demo-page__content {
  max-width: none;
}

/* 带 logo 的首页头图：图形与标题并排 */
.demo-page__head.has-logo {
  display: flex;
  align-items: center;
  gap: 18px;
}

.demo-page__logo {
  display: block;
  flex-shrink: 0;
  width: 56px;
  height: 56px;
  filter: drop-shadow(0 6px 18px color-mix(in srgb, var(--je-primary) 40%, transparent));
}

.demo-page__headings {
  min-width: 0;
}

.demo-page__title {
  margin: 0 0 8px;
  font-size: 26px;
  font-weight: 700;
  color: var(--je-text);
}

.demo-page__desc {
  margin: 0 0 32px;
  font-size: 14px;
  line-height: 1.7;
  color: var(--je-text-faint);
}

.demo-page__api {
  padding-top: 28px;
  border-top: var(--je-border);
}

.demo-page__api-title {
  margin: 0 0 20px;
  font-size: 22px;
  font-weight: 700;
  color: var(--je-text);
}

/* 放不下第三列时整列收起，正文回到整宽居中 */
@media (max-width: 1200px) {
  .demo-page__aside {
    display: none;
  }
}

@media (max-width: 768px) {
  .demo-page {
    padding: 20px 16px 48px;
  }
}
</style>