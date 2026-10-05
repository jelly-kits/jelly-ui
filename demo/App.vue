<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  JeIcon,
  JeInput,
  JePopover,
  JeScrollbar,
  JeSegmented,
  useColorMode,
  useThemeTokens,
} from '@jelly-kits/jelly-ui'
import { navGroups, swapLocale, withLocale, type DemoNavGroup } from './router'
import { useDemoI18n } from './i18n'

/*
 * 主题色板：几个可修改的主要颜色，与组件语义色 token 一一对应。
 * 全部写到 <html>（documentElement）上，而不是某个外层容器 ——
 * 浮层组件把面板 Teleport 到 body，只有变量落在 <html> 上它们才吃得到；
 * 写在内容容器上时，Teleport 出去的面板会落回 :root 默认色。
 */
type ThemeColors = {
  primary: string
  primaryEnd: string
  success: string
  warning: string
  danger: string
  info: string
}

/** 与 src/theme/variables.css 的 :root 默认值保持一致 */
const DEFAULT_COLORS: ThemeColors = {
  primary: '#667eea',
  primaryEnd: '#764ba2',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#7c8db5',
}

/** 色板字段 → CSS 变量名 */
const COLOR_VARS: Record<keyof ThemeColors, string> = {
  primary: '--je-primary',
  primaryEnd: '--je-primary-end',
  success: '--je-success',
  warning: '--je-warning',
  danger: '--je-danger',
  info: '--je-info',
}

/** 调色面板里逐行展示的字段与文案 */
const COLOR_FIELDS: { key: keyof ThemeColors; label: string }[] = [
  { key: 'primary', label: '主色 primary' },
  { key: 'primaryEnd', label: '主色渐变末端' },
  { key: 'success', label: '成功 success' },
  { key: 'warning', label: '警告 warning' },
  { key: 'danger', label: '危险 danger' },
  { key: 'info', label: '信息 info' },
]

/** 快捷预设：只改主色两段渐变，其余语义色沿用当前值 */
const themes = {
  indigo: { label: '靛蓝', primary: '#667eea', end: '#764ba2' },
  emerald: { label: '翡翠', primary: '#10b981', end: '#059669' },
  sunset: { label: '日落', primary: '#f97316', end: '#db2777' },
}
type ThemeName = keyof typeof themes
const themeNames: ThemeName[] = ['indigo', 'emerald', 'sunset']

/** 预设名从模板 / DOM 传进来时是宽类型，先收窄回 ThemeName */
const isThemeName = (value: unknown): value is ThemeName =>
  typeof value === 'string' && (themeNames as string[]).includes(value)

/*
 * 色板的读写全部交给库（useThemeTokens）：变量落在 <html> 上、值存 localStorage，
 * 预览 iframe 的跨文档同步也由库的 storage 监听负责。
 * 这里只做面板的展示与交互 —— 没被覆盖的键回落到内置默认值（与 variables.css 的 :root 一致）。
 */
const { tokens, setThemeTokens, resetThemeTokens } = useThemeTokens()

const colors = computed<ThemeColors>(() => ({
  primary: tokens.value[COLOR_VARS.primary] ?? DEFAULT_COLORS.primary,
  primaryEnd: tokens.value[COLOR_VARS.primaryEnd] ?? DEFAULT_COLORS.primaryEnd,
  success: tokens.value[COLOR_VARS.success] ?? DEFAULT_COLORS.success,
  warning: tokens.value[COLOR_VARS.warning] ?? DEFAULT_COLORS.warning,
  danger: tokens.value[COLOR_VARS.danger] ?? DEFAULT_COLORS.danger,
  info: tokens.value[COLOR_VARS.info] ?? DEFAULT_COLORS.info,
}))

const setColor = (key: keyof ThemeColors, value: string) => {
  setThemeTokens({ ...tokens.value, [COLOR_VARS[key]]: value })
}

const onColorInput = (key: keyof ThemeColors, event: Event) => {
  setColor(key, (event.target as HTMLInputElement).value)
}

const resetColors = () => {
  resetThemeTokens()
}

const applyPreset = (value: string | number) => {
  if (!isThemeName(value)) return
  setThemeTokens({
    ...tokens.value,
    [COLOR_VARS.primary]: themes[value].primary,
    [COLOR_VARS.primaryEnd]: themes[value].end,
  })
}

/** 主色两段与某个预设完全一致时才回显该预设；自定义颜色后返回 null（不点亮任何预设） */
const activePreset = computed<ThemeName | null>(() => {
  const hit = themeNames.find(
    (name) =>
      themes[name].primary === colors.value.primary && themes[name].end === colors.value.primaryEnd,
  )
  return hit ?? null
})

/** 色块用的渐变；没命中预设（自定义中）时退回当前主色两段 */
const gradientOf = (value: string | number | null) => {
  const name = typeof value === 'string' && isThemeName(value) ? value : null
  const from = name ? themes[name].primary : colors.value.primary
  const to = name ? themes[name].end : colors.value.primaryEnd
  return `linear-gradient(135deg, ${from}, ${to})`
}

const menuOpen = ref(false)
/** 桌面端把侧边栏收成 0 宽；收起后品牌只留 logo */
const collapsed = ref(false)

/*
 * 明暗主题：交给库的 useColorMode() —— 它把 data-theme 落在 <html> 上、模式存 localStorage，
 * 'auto' 表示跟随系统（此时不写属性，由 variables.css 的媒体查询接管），
 * 预览 iframe 的跨文档同步也由库的 storage 监听负责。
 */
const { isDark, toggleColorMode } = useColorMode()

/*
 * 文档站语言：中文原文即 key，t() 未收录时回落中文（见 demo/i18n/index.ts）。
 * t 内部读的是模块级 ref，所以模板里用它就自动响应切换。
 */
const { t, locale, options: localeOptions } = useDemoI18n()

/**
 * 侧栏搜索：108 个条目光靠滚动很难找，按标题里的英文名 / 中文名做一次跨分组过滤。
 * 不输入时直接返回原始结构（引用不变），不产生额外开销。
 */
const query = ref('')

const hit = (title: string, keyword: string) => title.toLowerCase().includes(keyword)

const filteredGroups = computed<DemoNavGroup[]>(() => {
  const keyword = query.value.trim().toLowerCase()
  if (!keyword) return navGroups
  const groups: DemoNavGroup[] = []
  for (const group of navGroups) {
    // 组名本身命中（如「移动端」）时整组保留，否则按条目逐级过滤
    if (hit(group.title, keyword)) {
      groups.push(group)
      continue
    }
    const items = group.items.filter((item) => hit(item.title, keyword))
    const subgroups = group.subgroups
      .map((sub) => ({ ...sub, items: sub.items.filter((item) => hit(item.title, keyword)) }))
      .filter((sub) => sub.items.length > 0)
    if (items.length || subgroups.length) groups.push({ ...group, items, subgroups })
  }
  return groups
})

const hasResult = computed(() => filteredGroups.value.length > 0)

/** 调色面板的开关（JePopover 的 v-model） */
const paletteOpen = ref(false)

/** 主内容区自己滚（不再由窗口滚），换页时要手动回顶 */
const mainScrollRef = ref<{ setScrollTop: (value: number) => void } | null>(null)
const route = useRoute()
const router = useRouter()

/** 预览路由（iframe 内）走极简外壳：没有顶栏 / 侧栏，也就没有主内容区滚动容器 */
const isPreview = computed(() => route.meta.preview === true)

/** 品牌图标的落地页：显式带语言段，避免走一次「补语言段」的重定向 */
const homePath = computed(() => withLocale(locale.value, '/'))

/** 菜单 / 首页卡片拼链接用：语言段 + 无语言段的页面路径 */
const localePath = (path: string) => withLocale(locale.value, path)

/*
 * 切语言 = 换 URL 的语言段（语言状态由路由守卫按新 URL 同步），
 * 当前页面路径原样保留；已在目标语言时不动，免得 vue-router 报重复导航。
 * 注意用的是 route.path（不含查询串 / 锚点）—— 本库文档页不带查询参数，够用。
 */
const switchLocale = (value: string | number) => {
  const next = value === 'en-US' ? 'en-US' : 'zh-CN'
  if (next === locale.value) return
  void router.replace(swapLocale(route.path, next))
}

watch(
  () => route.path,
  () => mainScrollRef.value?.setScrollTop(0),
  { flush: 'post' },
)
</script>

<template>
  <!-- 预览外壳：iframe 内只挂路由，不渲染顶栏 / 侧栏，滚动同样交给 JeScrollbar -->
  <div v-if="isPreview" class="doc doc--bare">
    <je-scrollbar class="doc--bare__scroll">
      <RouterView />
    </je-scrollbar>
  </div>

  <div v-else class="doc" :class="{ 'is-collapsed': collapsed }">
    <header class="doc__topbar">
      <!-- 窄屏：抽屉开关 -->
      <button
        class="doc__menu"
        type="button"
        :aria-label="t(menuOpen ? '关闭菜单' : '打开菜单')"
        :aria-expanded="menuOpen"
        @click="menuOpen = !menuOpen"
      >
        <JeIcon name="menu" :size="18" />
      </button>

      <!-- 桌面端：侧边栏折叠 -->
      <button
        class="doc__collapse"
        type="button"
        :aria-label="t(collapsed ? '展开菜单' : '收起菜单')"
        :aria-expanded="!collapsed"
        @click="collapsed = !collapsed"
      >
        <JeIcon :name="collapsed ? 'chevrons-right' : 'chevrons-left'" :size="18" />
      </button>

      <RouterLink class="doc__brand" :to="homePath">
        <img class="doc__logo" src="/logo.svg" alt="" width="30" height="30" >
        <span class="doc__brand-text">Jelly UI</span>
      </RouterLink>

      <div class="doc__actions">
        <!--
          语言切换：中文原文即 key，未收录的条目回落中文，
          所以翻译可以按分组渐进推进、不会出现空白。
        -->
        <je-segmented
          class="doc__lang"
          :model-value="locale"
          :options="localeOptions"
          @update:model-value="switchLocale"
        />

        <!-- 仓库入口：外链到 GitHub，新标签页打开 -->
        <a
          class="doc__icon-btn"
          href="https://github.com/jelly-kits/jelly-ui"
          target="_blank"
          rel="noopener noreferrer"
          :aria-label="t('GitHub 仓库')"
          :title="t('GitHub 仓库')"
        >
          <JeIcon name="github" :size="18" />
        </a>

        <button
          class="doc__icon-btn"
          type="button"
          :aria-label="t(isDark ? '切换到浅色主题' : '切换到深色主题')"
          :title="t(isDark ? '切换到浅色主题' : '切换到深色主题')"
          @click="toggleColorMode"
        >
          <JeIcon :name="isDark ? 'sun' : 'moon'" :size="18" />
        </button>

        <!--
          调色板：可分别修改 UI 的几个主要颜色，写 <html> 上的 CSS 变量，
          连 Teleport 到 body 的浮层也一起变色。
        -->
        <je-popover v-model="paletteOpen" trigger="click" placement="bottom-end" :width="272">
          <button
            class="doc__icon-btn"
            type="button"
            :aria-label="t('主题配色')"
            :title="t('主题配色')"
            :aria-expanded="paletteOpen"
          >
            <JeIcon name="settings" :size="18" />
          </button>

          <template #content>
            <div class="doc__palette">
              <p class="doc__palette-title">{{ t('主题配色') }}</p>

              <label v-for="field in COLOR_FIELDS" :key="field.key" class="doc__color-row">
                <span class="doc__color-name">{{ t(field.label) }}</span>
                <span class="doc__color-value">{{ colors[field.key] }}</span>
                <input
                  class="doc__color-input"
                  type="color"
                  :value="colors[field.key]"
                  :aria-label="t(field.label)"
                  @input="onColorInput(field.key, $event)"
                >
              </label>

              <p class="doc__palette-title doc__palette-title--sub">{{ t('快捷配色') }}</p>
              <div class="doc__presets">
                <button
                  v-for="name in themeNames"
                  :key="name"
                  class="doc__preset"
                  type="button"
                  :class="{ 'is-active': activePreset === name }"
                  :title="t(themes[name].label)"
                  :aria-label="t(themes[name].label)"
                  :style="{ background: gradientOf(name) }"
                  @click="applyPreset(name)"
                />
              </div>

              <button class="doc__reset" type="button" @click="resetColors">
                <JeIcon name="refresh" :size="14" />
                {{ t('恢复默认') }}
              </button>
            </div>
          </template>
        </je-popover>
      </div>
    </header>

    <div class="doc__body">
      <aside class="doc__sidebar" :class="{ 'is-open': menuOpen }">
        <!-- 搜索框放在滚动区之外：条目有 100+，滚到下面时它要一直够得着 -->
        <div class="doc__search">
          <je-input
            v-model="query"
            size="small"
            type="search"
            prefix-icon="search"
            clearable
            :placeholder="t('搜索组件')"
            :aria-label="t('搜索组件')"
          />
        </div>

        <je-scrollbar class="doc__sidebar__scroll">
          <div class="doc__sidebar__inner">
            <p v-if="!hasResult" class="doc__search-empty">{{ t('没有匹配的组件') }}</p>

            <nav v-for="group in filteredGroups" :key="group.title" class="doc__nav">
              <p class="doc__group">{{ t(group.title) }}</p>
              <RouterLink
                v-for="item in group.items"
                :key="item.path"
                :to="localePath(item.path)"
                class="doc__link"
                @click="menuOpen = false"
              >
                {{ t(item.title) }}
              </RouterLink>

              <!-- 移动端这类条目过多的组再分一层（demoRoutes 的 subgroup） -->
              <template v-for="sub in group.subgroups" :key="sub.title">
                <p class="doc__subgroup">{{ t(sub.title) }}</p>
                <RouterLink
                  v-for="item in sub.items"
                  :key="item.path"
                  :to="localePath(item.path)"
                  class="doc__link"
                  @click="menuOpen = false"
                >
                  {{ t(item.title) }}
                </RouterLink>
              </template>
            </nav>
          </div>
        </je-scrollbar>
      </aside>

      <main class="doc__main">
        <je-scrollbar id="doc-scroll" ref="mainScrollRef" class="doc__main__scroll">
          <RouterView />
        </je-scrollbar>
      </main>
    </div>

    <div v-if="menuOpen" class="doc__scrim" aria-hidden="true" @click="menuOpen = false" />
  </div>
</template>

<style scoped>
.doc {
  display: flex;
  flex-direction: column;
  /* 整站不再由窗口滚动：主内容区自己滚，滚动条交给 JeScrollbar */
  height: 100vh;
  overflow: hidden;
  font-family: system-ui, -apple-system, sans-serif;
}

/*
 * 预览外壳：iframe 里没有顶栏 / 侧栏，整屏高度交给 JeScrollbar。
 * 用自绘滚动条与文档站主内容区保持一致，否则 iframe 里会露出浏览器原生的粗滚动条
 * （iframe 的滚动条属于它自己的文档，父页面无法用 CSS 改）。
 */
.doc--bare__scroll {
  flex: 1 1 0;
  min-height: 0;
}

.doc__topbar {
  position: relative;
  z-index: 200;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 16px;
  height: 60px;
  padding: 0 20px;
  /* 半透明顶栏：浅色主题下是磨砂白，深色主题下是磨砂深蓝 */
  background: color-mix(in srgb, var(--je-popup) 88%, transparent);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: var(--je-border);
}

.doc__menu,
.doc__collapse {
  display: none;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  color: var(--je-text-muted);
  background: none;
  border: none;
  border-radius: var(--je-radius-sm);
  cursor: pointer;
  transition: color 0.2s ease, background 0.2s ease;
}

.doc__menu:hover,
.doc__collapse:hover {
  color: var(--je-text);
  background: var(--je-surface-hover);
}

.doc__menu:focus-visible,
.doc__collapse:focus-visible {
  outline: 2px solid var(--je-primary);
  outline-offset: 2px;
}

/* 桌面端默认显示折叠按钮，窄屏换成抽屉开关 */
.doc__collapse {
  display: inline-flex;
}

.doc__brand {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  font-size: 17px;
  font-weight: 700;
  color: var(--je-text);
  text-decoration: none;
}

/* 品牌图形自带配色，不跟随换肤；深色顶栏上补一点辉光 */
.doc__logo {
  display: block;
  width: 30px;
  height: 30px;
  filter: drop-shadow(0 2px 8px color-mix(in srgb, var(--je-primary) 45%, transparent));
}

/* 品牌文字只在小尺寸屏幕上隐藏，与侧边栏是否收起无关 */
.doc__brand-text {
  white-space: nowrap;
}

/* 右上角：以后还要往里加控件，这里只负责排布 */
.doc__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

/* 语言切换：默认尺寸在 60px 顶栏里偏高，收一档 padding 与字号 */
.doc__lang :deep(.je-segmented__item) {
  padding: 6px 12px;
  font-size: 13px;
}

/* 顶栏图标按钮（明暗切换 / 主题配色 / GitHub 入口共用）：形态与 .doc__menu 对齐 */
.doc__icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  color: var(--je-text-muted);
  background: none;
  border: none;
  border-radius: var(--je-radius-sm);
  cursor: pointer;
  text-decoration: none;
  transition: color 0.2s ease, background 0.2s ease;
}

.doc__icon-btn:hover {
  color: var(--je-text);
  background: var(--je-surface-hover);
}

.doc__icon-btn:focus-visible {
  outline: 2px solid var(--je-primary);
  outline-offset: 2px;
}

/*
 * 调色面板。内容走 JePopover 的 content 插槽，随面板一起 Teleport 到 body，
 * 但插槽节点带的是本组件的 scope id，所以这些 scoped 规则照样命中。
 */
.doc__palette {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.doc__palette-title {
  margin: 0;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: var(--je-text-muted);
}

.doc__palette-title--sub {
  margin-top: 4px;
  padding-top: 10px;
  border-top: var(--je-border);
}

.doc__color-row {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.doc__color-name {
  flex: 1 1 auto;
  font-size: 12px;
  color: var(--je-text-muted);
}

/* 十六进制值：等宽字体，肉眼比对颜色变化 */
.doc__color-value {
  flex: 0 0 auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  text-transform: uppercase;
  color: var(--je-text-faint);
}

/* 原生取色器剥成一块圆角色板 */
.doc__color-input {
  flex: 0 0 auto;
  width: 24px;
  height: 24px;
  padding: 0;
  background: none;
  border: none;
  border-radius: 7px;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
}

.doc__color-input::-webkit-color-swatch-wrapper {
  padding: 0;
}

.doc__color-input::-webkit-color-swatch {
  border: none;
  border-radius: 7px;
  box-shadow: inset 0 0 0 1px var(--je-text-faint);
}

.doc__color-input::-moz-color-swatch {
  border: none;
  border-radius: 7px;
  box-shadow: inset 0 0 0 1px var(--je-text-faint);
}

.doc__color-input:focus-visible {
  outline: 2px solid var(--je-primary);
  outline-offset: 2px;
}

.doc__presets {
  display: flex;
  gap: 8px;
}

/* 预设色板：直接铺该预设的主色渐变 */
.doc__preset {
  width: 30px;
  height: 30px;
  padding: 0;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: inset 0 0 0 1px var(--je-text-faint);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.doc__preset:hover {
  transform: scale(1.08);
}

/* 命中当前主色两段时，外圈再套一层正文色 ring */
.doc__preset.is-active {
  box-shadow: inset 0 0 0 1px var(--je-text-faint), 0 0 0 2px var(--je-text);
}

.doc__preset:focus-visible {
  outline: 2px solid var(--je-primary);
  outline-offset: 2px;
}

.doc__reset {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  margin-top: 2px;
  padding: 7px 12px;
  font-family: inherit;
  font-size: 12px;
  color: var(--je-text-muted);
  background: var(--je-surface);
  border: none;
  border-radius: var(--je-radius-sm);
  cursor: pointer;
  transition: color 0.2s ease, background 0.2s ease;
}

.doc__reset:hover {
  color: var(--je-text);
  background: var(--je-surface-hover);
}

.doc__reset:focus-visible {
  outline: 2px solid var(--je-primary);
  outline-offset: 2px;
}

.doc__body {
  display: flex;
  /* 高度由上面的 100vh 列布局分配，两个子项都靠 stretch 撑满 -> 各自内部滚动 */
  flex: 1 1 auto;
  min-height: 0;
}

.doc__sidebar {
  flex: 0 0 240px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  min-height: 0;
  /* 收起时靠它把 240px 宽的导航裁掉 */
  overflow: hidden;
  border-right: var(--je-border);
  transition: flex-basis 0.32s var(--je-ease-out-back);
}

/* 收起：宽度收到 0，分隔线也一并隐去 */
.doc.is-collapsed .doc__sidebar {
  flex-basis: 0;
  border-right-color: transparent;
}

/*
 * 滚动交给 JeScrollbar。这里用 flex-basis: 0 而不是 flex: 1 1 auto：
 * basis auto 会退回到 height: 100%，而抽屉模式（fixed + top/bottom + height: auto）
 * 下百分比高度解析不稳，basis 拿不到确定值就撑成内容高度，于是既不出滚动条也滚不动。
 */
.doc__sidebar__scroll {
  flex: 1 1 0;
  min-height: 0;
}

/* 搜索框常驻在滚动区之上，不跟着条目滚走 */
.doc__search {
  flex: 0 0 auto;
  padding: 16px 16px 0;
}

.doc__sidebar__inner {
  padding: 16px 16px 40px;
}

.doc__search-empty {
  margin: 12px 10px;
  font-size: 13px;
  color: var(--je-text-faint);
}

.doc__nav + .doc__nav {
  margin-top: 22px;
}

.doc__group {
  margin: 0 0 8px 10px;
  font-size: 13px;
  font-weight: 700;
  color: var(--je-text);
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* 二级分组标题：比一级小一号、缩进更深，只做层级提示不抢视线 */
.doc__subgroup {
  margin: 12px 0 4px 10px;
  font-size: 12px;
  font-weight: 600;
  color: var(--je-text-faint);
  letter-spacing: 0.5px;
}

.doc__link {
  display: block;
  padding: 8px 10px;
  font-size: 13px;
  color: var(--je-text-muted);
  text-decoration: none;
  border-radius: 8px;
  transition: background 0.2s ease, color 0.2s ease;
}

.doc__link:hover {
  color: var(--je-text);
  background: var(--je-surface-hover);
}

.doc__link.router-link-exact-active {
  font-weight: 600;
  color: var(--je-text);
  background: color-mix(in srgb, var(--je-primary) 30%, transparent);
}

/* 主内容区：外层只管给定高度，滚动同样交给 JeScrollbar */
.doc__main {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.doc__main__scroll {
  flex: 1 1 0;
  min-height: 0;
}

.doc__scrim {
  display: none;
}

/* 窄屏：侧边栏改为抽屉，默认隐藏 */
@media (max-width: 900px) {
  .doc__menu {
    display: inline-flex;
  }

  /* 抽屉模式下一个折叠按钮没有意义，交给抽屉开关 */
  .doc__collapse {
    display: none;
  }

  /* 小尺寸屏幕：顶栏只留 logo，不放品牌文字 */
  .doc__brand-text {
    display: none;
  }

  .doc__sidebar {
    position: fixed;
    top: 60px;
    bottom: 0;
    left: 0;
    z-index: 210;
    width: 260px;
    /* 高度由 top / bottom 决定，交给 flex-basis:0 的子项分配剩余空间 */
    background: var(--je-popup);
    border-right: var(--je-border);
    transform: translateX(-100%);
    transition: transform 0.3s var(--je-ease-out-back);
  }

  .doc__sidebar.is-open {
    transform: translateX(0);
  }

  .doc__scrim {
    display: block;
    position: fixed;
    inset: 60px 0 0;
    z-index: 205;
    background: rgba(0, 0, 0, 0.45);
  }
}

/* 窄屏：顶栏的语言开关保持普通大小（库在 ≤768px 会给 JeSegmented 每格 88px 最小宽 + 44px 热区，
   对「中 / EN」这种两格小控件来说过大，这里按普通尺寸收回）。
   注意 .doc__lang 类就落在 .je-segmented 根上，改根变量不能用后代选择器 */
@media (max-width: 768px) {
  .doc__lang {
    --je-segmented-min: 0px;

    overflow: visible;
  }

  .doc__lang :deep(.je-segmented__item) {
    min-height: auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  .doc__sidebar {
    transition: none;
  }
}
</style>

<style>
/*
 * 组件大多是半透明表面，宿主必须给一层不透明底色。
 * 这里用库里的页面底色 token，明暗切换自动跟随。
 */
body {
  min-height: 100vh;
  margin: 0;
  /* 正文色兜底：演示内容里的裸 <p> / 文本也要跟着明暗翻转 */
  color: var(--je-text);
  background: linear-gradient(135deg, var(--je-bg-page-from) 0%, var(--je-bg-page-to) 100%);
  font-family: system-ui, -apple-system, sans-serif;
}
</style>