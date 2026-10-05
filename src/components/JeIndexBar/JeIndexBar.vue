<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, provide, ref } from 'vue'
import { jeIndexBarKey, type JeIndexAnchorItem } from './types'

defineOptions({ name: 'JeIndexBar' })

const props = withDefaults(
  defineProps<{
    /** 右侧索引列表 */
    indexList?: (string | number)[]
    /** 锚点头部是否吸顶 */
    sticky?: boolean
    /** 吸顶时距离容器顶部的距离 */
    stickyOffsetTop?: number
    /** 高亮项的背景色，传任意 CSS 颜色 */
    highlightColor?: string
  }>(),
  {
    indexList: () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
    sticky: true,
    stickyOffsetTop: 0,
    highlightColor: undefined,
  },
)

const emit = defineEmits<{
  /** 点击某个索引 */
  select: [index: string | number]
  /** 当前高亮索引发生变化 */
  change: [index: string | number]
}>()

const contentRef = ref<HTMLElement | null>(null)
const active = ref<string | number | ''>('')

/** 锚点按挂载顺序入列，与 DOM 顺序一致，滚动判定才能提前 break */
let anchorList: JeIndexAnchorItem[] = []
let scrollerEl: HTMLElement | null = null

const sticky = computed(() => props.sticky)
const stickyOffsetTop = computed(() => props.stickyOffsetTop)

const rootStyle = computed(() =>
  props.highlightColor ? { '--je-index-bar-highlight': props.highlightColor } : undefined,
)

const register = (item: JeIndexAnchorItem) => {
  anchorList = anchorList.filter((anchor) => anchor.index !== item.index)
  anchorList.push(item)
}

const unregister = (index: string | number) => {
  anchorList = anchorList.filter((anchor) => anchor.index !== index)
}

const scrollerTop = () => (scrollerEl ? scrollerEl.getBoundingClientRect().top : 0)

const scrollToIndex = (index: string | number) => {
  const item = anchorList.find((anchor) => anchor.index === index)
  const el = item?.getEl()
  if (!el) return
  const delta = el.getBoundingClientRect().top - scrollerTop() - props.stickyOffsetTop
  if (scrollerEl) scrollerEl.scrollTop += delta
  else window.scrollBy(0, delta)
}

const updateActive = () => {
  const base = scrollerTop()
  let current: string | number | '' = active.value
  for (const item of anchorList) {
    const el = item.getEl()
    if (!el) continue
    const top = el.getBoundingClientRect().top - base
    if (top - props.stickyOffsetTop <= 1) current = item.index
    else break
  }
  if (current !== active.value) {
    active.value = current
    if (current !== '') emit('change', current)
  }
}

const select = (index: string | number) => {
  const changed = active.value !== index
  active.value = index
  emit('select', index)
  if (changed) emit('change', index)
  scrollToIndex(index)
}

/** 把 data 属性里的字符串还原成 indexList 中的原始值（可能是数字） */
const resolveIndex = (raw: string | null | undefined): string | number | '' => {
  if (!raw) return ''
  const found = props.indexList.find((item) => String(item) === raw)
  return found === undefined ? '' : found
}

const pickFromPoint = (clientX: number, clientY: number) => {
  const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null
  return resolveIndex(el?.closest('[data-je-index]')?.getAttribute('data-je-index'))
}

const onIndexTouchStart = (event: TouchEvent) => {
  const touch = event.touches[0]
  if (!touch) return
  const index = pickFromPoint(touch.clientX, touch.clientY)
  if (index !== '') select(index)
}

const onIndexTouchMove = (event: TouchEvent) => {
  // 手指在索引条上滑动时不要带动页面滚动
  if (event.cancelable) event.preventDefault()
  const touch = event.touches[0]
  if (!touch) return
  const index = pickFromPoint(touch.clientX, touch.clientY)
  if (index !== '' && index !== active.value) select(index)
}

/** 向上找最近的可滚动祖先，找不到就回退到 window */
const getScroller = (): HTMLElement | null => {
  let el = contentRef.value?.parentElement ?? null
  while (el) {
    const overflowY = window.getComputedStyle(el).overflowY
    if (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') return el
    el = el.parentElement
  }
  return null
}

onMounted(() => {
  scrollerEl = getScroller()
  const target: EventTarget = scrollerEl ?? window
  target.addEventListener('scroll', updateActive, { passive: true })
  window.addEventListener('resize', updateActive)
  nextTick(updateActive)
})

onBeforeUnmount(() => {
  const target: EventTarget = scrollerEl ?? window
  target.removeEventListener('scroll', updateActive)
  window.removeEventListener('resize', updateActive)
})

provide(jeIndexBarKey, {
  active,
  sticky,
  stickyOffsetTop,
  register,
  unregister,
  select,
})
</script>

<template>
  <div class="je-index-bar" :style="rootStyle">
    <div ref="contentRef" class="je-index-bar__content">
      <slot />
    </div>

    <ul
      class="je-index-bar__index"
      aria-label="索引"
      @touchstart.passive="onIndexTouchStart"
      @touchmove="onIndexTouchMove"
    >
      <li
        v-for="item in indexList"
        :key="item"
        class="je-index-bar__item"
        :class="{ 'is-active': active === item }"
        :data-je-index="item"
        @click="select(item)"
      >
        {{ item }}
      </li>
    </ul>
  </div>
</template>

<style scoped>
.je-index-bar {
  position: relative;
  display: flex;
  font-family: inherit;
  --je-index-bar-highlight: var(--je-primary);
}

.je-index-bar__content {
  flex: 1 1 auto;
  min-width: 0;
}

.je-index-bar__index {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0 6px;
  list-style: none;
  /* 手势由本节点的 touchmove 接管，禁止浏览器把它当成滚动 */
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

.je-index-bar__item {
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 18px;
  height: 18px;
  font-size: 11px;
  line-height: 1;
  color: var(--je-text-muted);
  cursor: pointer;
  border-radius: 50%;
  transition: color var(--je-duration) ease, background var(--je-duration) ease;
}

.je-index-bar__item.is-active {
  color: #fff;
  background: var(--je-index-bar-highlight);
}

@media (max-width: 768px) {
  /* 索引条本身是连续的滑动热区，单点热区不小于 20px 即可 */
  .je-index-bar__item {
    width: 22px;
    height: 22px;
    font-size: 12px;
  }
}
</style>
