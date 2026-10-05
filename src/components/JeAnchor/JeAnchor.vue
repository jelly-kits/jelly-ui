<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, provide, ref, watch } from 'vue'
import JeScrollbar from '../JeScrollbar/JeScrollbar.vue'
import { useMediaQuery } from '../../core/useMediaQuery'
import { jeAnchorKey, type JeAnchorContext, type JeAnchorDirection } from './types'

defineOptions({ name: 'JeAnchor' })

const props = withDefaults(
  defineProps<{
    /** 滚动容器选择器，留空表示监听窗口 */
    container?: string
    /** 判定高亮的阈值：目标顶部进入容器该偏移内即视为当前项 */
    offset?: number
    /** 点击滚动后目标停留在容器顶部的位置，默认与 offset 一致 */
    targetOffset?: number
    direction?: JeAnchorDirection
  }>(),
  { container: '', offset: 0, direction: 'vertical' },
)

const emit = defineEmits<{
  change: [href: string]
  click: [href: string]
}>()

const activeHref = ref('')
/** 已登记的 href，顺序即子项在 DOM 中的顺序 */
const links = ref<string[]>([])

const direction = computed(() => props.direction)
const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
/** 横向锚点在窄屏会超出容器，用 JeScrollbar 承担左右滑动 */
const isHorizontal = computed(() => props.direction === 'horizontal')

const queryScroller = (): HTMLElement | null => {
  if (!props.container) return null
  return document.querySelector<HTMLElement>(props.container)
}

const queryTarget = (href: string): HTMLElement | null => {
  if (!href) return null
  try {
    return document.querySelector<HTMLElement>(href)
  } catch {
    // href 不是合法选择器时静默跳过
    return null
  }
}

const registerLink = (href: string) => {
  if (!links.value.includes(href)) links.value = [...links.value, href]
}

const unregisterLink = (href: string) => {
  links.value = links.value.filter((item) => item !== href)
}

/** 取最后一个已越过阈值的目标作为当前项 */
const updateActive = () => {
  const scroller = queryScroller()
  const containerTop = scroller ? scroller.getBoundingClientRect().top : 0
  let current = ''
  links.value.forEach((href) => {
    const target = queryTarget(href)
    if (!target) return
    if (target.getBoundingClientRect().top - containerTop <= props.offset) current = href
  })
  activeHref.value = current
}

const scrollTo = (href: string) => {
  const target = queryTarget(href)
  if (!target) return
  const behavior: ScrollBehavior = reducedMotion.value ? 'auto' : 'smooth'
  const offset = props.targetOffset ?? props.offset
  const targetTop = target.getBoundingClientRect().top
  const scroller = queryScroller()

  if (scroller) {
    const containerTop = scroller.getBoundingClientRect().top
    scroller.scrollTo({
      top: scroller.scrollTop + targetTop - containerTop - offset,
      behavior,
    })
  } else {
    window.scrollTo({ top: targetTop + window.scrollY - offset, behavior })
  }
}

/** 点击：派发事件 + 滚动 + 立即给出高亮反馈 */
const handleLinkClick = (href: string) => {
  emit('click', href)
  scrollTo(href)
  if (activeHref.value !== href) activeHref.value = href
}

let scrollerEl: HTMLElement | null = null
const onScroll = () => updateActive()

const attach = () => {
  scrollerEl = queryScroller()
  if (scrollerEl) {
    scrollerEl.addEventListener('scroll', onScroll, { passive: true })
  } else {
    window.addEventListener('scroll', onScroll, { passive: true })
  }
  window.addEventListener('resize', onScroll, { passive: true })
  updateActive()
}

const detach = () => {
  if (scrollerEl) {
    scrollerEl.removeEventListener('scroll', onScroll)
  } else {
    window.removeEventListener('scroll', onScroll)
  }
  window.removeEventListener('resize', onScroll)
  scrollerEl = null
}

const context: JeAnchorContext = {
  activeHref,
  direction,
  registerLink,
  unregisterLink,
  scrollTo: handleLinkClick,
}
provide(jeAnchorKey, context)

watch(
  () => props.container,
  () => {
    detach()
    attach()
  },
)

watch(links, () => updateActive())

watch(activeHref, (href) => {
  if (href) emit('change', href)
})

onMounted(attach)
onBeforeUnmount(detach)
</script>

<template>
  <nav class="je-anchor" :class="`je-anchor--${direction}`" aria-label="锚点导航">
    <JeScrollbar v-if="isHorizontal">
      <ul class="je-anchor__list">
        <slot />
      </ul>
    </JeScrollbar>
    <ul v-else class="je-anchor__list">
      <slot />
    </ul>
  </nav>
</template>

<style scoped>
.je-anchor {
  font-family: inherit;
}

.je-anchor__list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.je-anchor--horizontal .je-anchor__list {
  flex-direction: row;
  gap: 6px;
  padding-bottom: 2px;
  /* 按内容宽度铺开，超出容器时交给 JeScrollbar 横向滚动 */
  width: max-content;
}
</style>
