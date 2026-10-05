<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, provide, ref, watch } from 'vue'
import JeIcon from '../JeIcon/JeIcon.vue'
import {
  jeTabsKey,
  type JeTabName,
  type JeTabPaneState,
  type JeTabsContext,
  type JeTabsPosition,
  type JeTabsType,
} from './types'

defineOptions({ name: 'JeTabs' })

const props = withDefaults(
  defineProps<{
    modelValue?: JeTabName
    type?: JeTabsType
    tabPosition?: JeTabsPosition
    /** tab 等分撑满 */
    stretch?: boolean
    /** 所有 tab 均可关闭 */
    closable?: boolean
  }>(),
  { type: 'line', tabPosition: 'top', stretch: false, closable: false },
)

const emit = defineEmits<{
  'update:modelValue': [value: JeTabName]
  'tab-click': [name: JeTabName]
  'tab-change': [name: JeTabName]
  'tab-remove': [name: JeTabName]
}>()

/** 未受控时的内部激活项 */
const innerValue = ref<JeTabName | undefined>(undefined)

/** 子项注册表：保持模板顺序，getState 每次读取都会跟踪子项 props */
const registry = ref<{ uid: string; getState: () => JeTabPaneState }[]>([])
const panes = computed(() => registry.value.map((entry) => entry.getState()))

const activeName = computed<JeTabName | undefined>(() => props.modelValue ?? innerValue.value)
const isVertical = computed(() => props.tabPosition === 'left' || props.tabPosition === 'right')

const registerPane: JeTabsContext['registerPane'] = (uid, getState) => {
  if (registry.value.some((entry) => entry.uid === uid)) return
  registry.value = [...registry.value, { uid, getState }]
}

const unregisterPane: JeTabsContext['unregisterPane'] = (uid) => {
  registry.value = registry.value.filter((entry) => entry.uid !== uid)
}

const isActive = (name: JeTabName) => activeName.value !== undefined && name === activeName.value
const isClosable = (pane: JeTabPaneState) => props.closable || pane.closable

const activate = (name: JeTabName) => {
  const pane = panes.value.find((item) => item.name === name)
  if (!pane || pane.disabled) return
  emit('tab-click', name)
  if (name === activeName.value) return
  if (props.modelValue === undefined) innerValue.value = name
  emit('update:modelValue', name)
  emit('tab-change', name)
}

const remove = (name: JeTabName) => {
  emit('tab-remove', name)
}

/** 未受控时，自动落到第一个可用面板 */
watch(
  panes,
  (list) => {
    if (props.modelValue !== undefined) return
    if (list.some((pane) => pane.name === innerValue.value)) return
    innerValue.value = list.find((pane) => !pane.disabled)?.name
  },
  { immediate: true },
)

const navRef = ref<HTMLElement | null>(null)
/** line 指示条几何信息 */
const ink = ref({ left: 0, top: 0, width: 0, height: 0 })
const inkVisible = ref(false)

/** 量出激活 tab 相对 tab 条的几何位置，指示条才能滑过去 */
const updateInk = () => {
  const nav = navRef.value
  const name = activeName.value
  const pane = name === undefined ? undefined : panes.value.find((item) => item.name === name)
  const tab = pane ? document.getElementById(`${pane.uid}-tab`) : null
  if (props.type !== 'line' || !nav || !tab) {
    inkVisible.value = false
    return
  }

  const navRect = nav.getBoundingClientRect()
  const tabRect = tab.getBoundingClientRect()

  if (isVertical.value) {
    const width = 2
    ink.value = {
      // 指示条贴向内容区一侧
      left: props.tabPosition === 'right' ? 0 : nav.scrollWidth - width,
      top: tabRect.top - navRect.top + nav.scrollTop,
      width,
      height: tabRect.height,
    }
  } else {
    const height = 2
    ink.value = {
      left: tabRect.left - navRect.left + nav.scrollLeft,
      // 指示条贴向内容区一侧
      top: props.tabPosition === 'bottom' ? 0 : nav.scrollHeight - height,
      width: tabRect.width,
      height,
    }
  }
  inkVisible.value = true
}

watch([activeName, panes, () => props.type, () => props.tabPosition], () => {
  void nextTick(updateInk)
})

onMounted(() => {
  void nextTick(updateInk)
  window.addEventListener('resize', updateInk)
})

onBeforeUnmount(() => window.removeEventListener('resize', updateInk))

const onKeydown = (event: KeyboardEvent) => {
  const list = panes.value.filter((pane) => !pane.disabled)
  if (list.length === 0) return

  const currentIndex = list.findIndex((pane) => isActive(pane.name))
  const prevKey = isVertical.value ? 'ArrowUp' : 'ArrowLeft'
  const nextKey = isVertical.value ? 'ArrowDown' : 'ArrowRight'

  let nextIndex: number
  if (event.key === prevKey) {
    nextIndex = currentIndex <= 0 ? list.length - 1 : currentIndex - 1
  } else if (event.key === nextKey) {
    nextIndex = currentIndex === -1 || currentIndex === list.length - 1 ? 0 : currentIndex + 1
  } else if (event.key === 'Home') {
    nextIndex = 0
  } else if (event.key === 'End') {
    nextIndex = list.length - 1
  } else {
    return
  }

  event.preventDefault()
  const target = list[nextIndex]
  if (!target) return
  activate(target.name)
  document.getElementById(`${target.uid}-tab`)?.focus()
}

/** 可关闭时，聚焦在 tab 上按 Delete 即可关闭 */
const onTabDelete = (pane: JeTabPaneState) => {
  if (!isClosable(pane)) return
  remove(pane.name)
}

const context: JeTabsContext = { registerPane, unregisterPane, isActive }
provide(jeTabsKey, context)
</script>

<template>
  <div
    class="je-tabs"
    :class="[
      `je-tabs--${type}`,
      `je-tabs--${tabPosition}`,
      { 'is-stretch': stretch, 'is-closable': closable },
    ]"
  >
    <div
      ref="navRef"
      class="je-tabs__nav"
      role="tablist"
      :aria-orientation="isVertical ? 'vertical' : 'horizontal'"
      @keydown="onKeydown"
    >
      <button
        v-for="pane in panes"
        :id="`${pane.uid}-tab`"
        :key="pane.uid"
        type="button"
        class="je-tabs__tab"
        role="tab"
        :aria-selected="isActive(pane.name)"
        :aria-controls="`${pane.uid}-panel`"
        :tabindex="isActive(pane.name) ? 0 : -1"
        :disabled="pane.disabled"
        @click="activate(pane.name)"
        @keydown.delete="onTabDelete(pane)"
      >
        <span class="je-tabs__label">
          <component :is="pane.labelRender" v-if="pane.labelRender" />
          <template v-else>{{ pane.label }}</template>
        </span>
        <span
          v-if="isClosable(pane)"
          class="je-tabs__close"
          aria-hidden="true"
          @click.stop="remove(pane.name)"
        >
          <JeIcon name="close" :size="12" />
        </span>
      </button>

      <span
        v-if="type === 'line'"
        class="je-tabs__ink"
        :class="{ 'is-visible': inkVisible }"
        :style="{
          left: `${ink.left}px`,
          top: `${ink.top}px`,
          width: `${ink.width}px`,
          height: `${ink.height}px`,
        }"
        aria-hidden="true"
      />
    </div>

    <div class="je-tabs__content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.je-tabs {
  display: flex;
  box-sizing: border-box;
  font-family: inherit;
  color: var(--je-text);
}

.je-tabs--top {
  flex-direction: column;
}

.je-tabs--bottom {
  flex-direction: column-reverse;
}

.je-tabs--left {
  flex-direction: row;
}

.je-tabs--right {
  flex-direction: row-reverse;
}

/* tab 条 */
.je-tabs__nav {
  position: relative;
  display: flex;
  flex-shrink: 0;
  gap: 4px;
}

.je-tabs--left .je-tabs__nav,
.je-tabs--right .je-tabs__nav {
  flex-direction: column;
}

.je-tabs__tab {
  position: relative;
  display: inline-flex;
  gap: 6px;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  min-height: 36px;
  padding: 8px 16px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  color: var(--je-text-faint);
  white-space: nowrap;
  background: none;
  border: none;
  border-radius: var(--je-radius-sm) var(--je-radius-sm) 0 0;
  cursor: pointer;
  outline: none;
  transition: color var(--je-duration) ease, background var(--je-duration) ease;
}

.je-tabs__tab:hover:not(:disabled) {
  color: var(--je-text-muted);
}

.je-tabs__tab[aria-selected='true'] {
  color: var(--je-text);
}

.je-tabs__tab:focus-visible {
  outline: 2px solid var(--je-primary);
  outline-offset: -2px;
}

.je-tabs__tab:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.je-tabs__label {
  overflow: hidden;
  text-overflow: ellipsis;
}

.je-tabs__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  color: currentColor;
  border-radius: 50%;
  transition: background var(--je-duration) ease;
}

.je-tabs__close:hover {
  background: color-mix(in srgb, var(--je-primary) 40%, transparent);
}

/* line 类型的滑动指示条 */
.je-tabs__ink {
  position: absolute;
  background: linear-gradient(135deg, var(--je-primary), var(--je-primary-end));
  border-radius: 999px;
  opacity: 0;
  pointer-events: none;
  transition: left 0.36s var(--je-ease-out-back), top 0.36s var(--je-ease-out-back),
    width 0.36s var(--je-ease-out-back), height 0.36s var(--je-ease-out-back),
    opacity 0.2s ease;
}

.je-tabs__ink.is-visible {
  opacity: 1;
}

/* 横向时等分 */
.je-tabs--top.is-stretch .je-tabs__tab,
.je-tabs--bottom.is-stretch .je-tabs__tab {
  flex: 1 1 0;
}

.je-tabs__content {
  flex: 1 1 auto;
  min-width: 0;
}

/* card：tab 本身是卡片，内容区带边框 */
.je-tabs--card .je-tabs__tab {
  border: var(--je-border);
  border-bottom-color: transparent;
  background: var(--je-surface);
}

.je-tabs--card .je-tabs__tab[aria-selected='true'] {
  background: var(--je-surface-hover);
}

.je-tabs--card .je-tabs__content {
  padding: 16px;
  border: var(--je-border);
  border-radius: 0 var(--je-radius) var(--je-radius) var(--je-radius);
}

/* border-card：整块带边框，tab 之间用竖线分隔 */
.je-tabs--border-card {
  background: var(--je-surface);
  border: var(--je-border);
  border-radius: var(--je-radius);
}

.je-tabs--border-card .je-tabs__nav {
  gap: 0;
}

.je-tabs--border-card .je-tabs__tab {
  border-radius: 0;
}

.je-tabs--border-card .je-tabs__tab[aria-selected='true'] {
  background: color-mix(in srgb, var(--je-primary) 22%, transparent);
}

/* 窄屏：tab 条横向滚动，热区拉到 44px */
@media (max-width: 768px) {
  .je-tabs--top .je-tabs__nav,
  .je-tabs--bottom .je-tabs__nav {
    max-width: 100%;
    overflow-x: auto;
    overflow-y: hidden;
    overscroll-behavior-x: contain;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
  }

  .je-tabs--top .je-tabs__nav::-webkit-scrollbar,
  .je-tabs--bottom .je-tabs__nav::-webkit-scrollbar {
    display: none;
  }

  .je-tabs__tab {
    min-height: 44px;
  }

  /* 触屏没有 hover，关闭按钮给一个更明确的常驻底色 */
  .je-tabs__close {
    background: color-mix(in srgb, var(--je-primary) 28%, transparent);
  }
}

@media (prefers-reduced-motion: reduce) {
  .je-tabs__tab,
  .je-tabs__close,
  .je-tabs__ink {
    transition: none;
  }
}
</style>
