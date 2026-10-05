<script setup lang="ts">
import { computed, inject, nextTick, provide, ref, useId } from 'vue'
import { useClickOutside } from '../../core/useClickOutside'
import { useFloating } from '../../core/useFloating'
import { nextZIndex } from '../../core/useZIndex'
import { JeIcon, type JeIconName } from '../JeIcon'
import { JeTooltip } from '../JeTooltip'
import {
  jeMenuKey,
  jeMenuParentKey,
  type JeMenuIndex,
  type JeMenuParentContext,
} from './types'

defineOptions({ name: 'JeSubMenu' })

const props = withDefaults(
  defineProps<{
    index: JeMenuIndex
    disabled?: boolean
    icon?: JeIconName
  }>(),
  { disabled: false, icon: undefined },
)

const menu = inject(jeMenuKey)
const parent = inject(jeMenuParentKey, undefined)

const uid = useId()
const titleRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const zIndex = ref(nextZIndex())

const horizontal = computed(() => menu?.horizontal.value ?? false)
const opened = computed(() => menu?.isOpened(props.index) ?? false)
/** 浮层模式：横向菜单，或折叠后的纵向菜单 */
const popup = computed(() => horizontal.value || !!menu?.collapse.value)
/** 处于浮层内时不再隐藏文字 */
const collapsed = computed(
  () => !!menu && !horizontal.value && menu.collapse.value && !(parent?.popup.value ?? false),
)

const arrowIcon = computed<JeIconName>(() => (horizontal.value ? 'chevron-down' : 'chevron-right'))

const path = computed<JeMenuIndex[]>(() => [...(parent?.path.value ?? []), props.index])

/** 让浮层内的项也带上路径前缀与浮层标记 */
const childContext: JeMenuParentContext = {
  path,
  popup,
  closePopup: () => menu?.closeMenu(props.index),
}
provide(jeMenuParentKey, childContext)

const { x, y } = useFloating({
  reference: titleRef,
  floating: panelRef,
  open: computed(() => popup.value && opened.value),
  placement: () => (horizontal.value ? 'bottom-start' : 'right-start'),
  offset: 4,
})

const panelStyle = computed(() =>
  popup.value && opened.value ? { left: `${x.value}px`, top: `${y.value}px`, zIndex: zIndex.value } : undefined,
)

const open = () => {
  if (opened.value) return
  zIndex.value = nextZIndex()
  menu?.openMenu(props.index)
}

const close = () => menu?.closeMenu(props.index)

const toggle = () => {
  if (props.disabled) return
  if (opened.value) close()
  else open()
}

useClickOutside([titleRef, panelRef], () => {
  if (!popup.value || !opened.value) return
  close()
})

const focusFirstItem = () => {
  panelRef.value?.querySelector<HTMLElement>('[role="menuitem"]')?.focus()
}

const onTitleKeydown = (event: KeyboardEvent) => {
  if (props.disabled) return

  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    toggle()
    return
  }

  if (event.key === 'ArrowRight') {
    event.preventDefault()
    open()
    if (popup.value) nextTick(focusFirstItem)
    return
  }

  if (event.key === 'ArrowLeft' || event.key === 'Escape') {
    if (!opened.value) return
    event.preventDefault()
    event.stopPropagation()
    close()
  }
}
</script>

<template>
  <div
    class="je-submenu"
    :class="{
      'is-opened': opened,
      'is-popup': popup,
      'is-horizontal': horizontal,
      'is-disabled': disabled,
    }"
  >
    <div
      :id="`${uid}-title`"
      ref="titleRef"
      class="je-submenu__title"
      :class="{ 'is-active': opened, 'is-collapse': collapsed }"
      role="menuitem"
      aria-haspopup="true"
      :aria-expanded="opened"
      :aria-controls="`${uid}-panel`"
      :tabindex="disabled ? -1 : 0"
      :aria-disabled="disabled || undefined"
      @click="toggle"
      @keydown="onTitleKeydown"
    >
      <JeTooltip class="je-submenu__tip" placement="right" :disabled="!collapsed">
        <span class="je-submenu__body">
          <span v-if="icon" class="je-submenu__icon">
            <JeIcon :name="icon" :size="18" />
          </span>
          <span class="je-submenu__label"><slot name="title" /></span>
          <JeIcon class="je-submenu__arrow" :name="arrowIcon" :size="16" />
        </span>
        <template #content><slot name="title" /></template>
      </JeTooltip>
    </div>

    <div
      :id="`${uid}-panel`"
      ref="panelRef"
      class="je-submenu__list"
      :class="{ 'is-open': opened }"
      :style="panelStyle"
      role="menu"
      :aria-labelledby="`${uid}-title`"
    >
      <div class="je-submenu__inner">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.je-submenu {
  position: relative;
}

.je-submenu__title {
  display: flex;
  align-items: center;
  box-sizing: border-box;
  min-height: 44px;
  padding: 10px 14px;
  font-size: 14px;
  color: var(--je-text-muted);
  border-radius: var(--je-radius-sm);
  cursor: pointer;
  outline: none;
  transition: background var(--je-duration) ease, color var(--je-duration) ease;
}

.je-submenu__title:hover,
.je-submenu__title.is-active {
  color: var(--je-text);
  background: var(--je-surface-hover);
}

.je-submenu__title:focus-visible {
  outline: 2px solid var(--je-primary);
  outline-offset: -2px;
}

.je-submenu.is-disabled .je-submenu__title {
  cursor: not-allowed;
  opacity: 0.5;
}

.je-submenu.is-disabled .je-submenu__title:hover {
  background: none;
}

.je-submenu__tip {
  flex: 1 1 auto;
  min-width: 0;
}

.je-submenu__body {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-width: 0;
}

.je-submenu__icon {
  display: inline-flex;
  flex-shrink: 0;
  color: var(--je-text-faint);
}

.je-submenu__title:hover .je-submenu__icon,
.je-submenu__title.is-active .je-submenu__icon {
  color: var(--je-text);
}

.je-submenu__label {
  flex: 1 1 auto;
  overflow: hidden;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.je-submenu__arrow {
  flex-shrink: 0;
  color: var(--je-text-faint);
  transition: transform 0.3s var(--je-ease-overshoot);
}

/* 纵向内联展开时箭头由「右」转向「下」 */
.je-submenu:not(.is-popup) .je-submenu__title.is-active .je-submenu__arrow {
  transform: rotate(90deg);
}

/* 横向菜单展开弹层时箭头翻向上方 */
.je-submenu.is-horizontal .je-submenu__title.is-active .je-submenu__arrow {
  transform: rotate(180deg);
}

/* 折叠态：只剩图标居中，标题文字隐藏（Tooltip 内容被传送出去，不受影响） */
.je-submenu__title.is-collapse {
  justify-content: center;
  padding: 10px 0;
}

.je-submenu__title.is-collapse .je-submenu__body {
  justify-content: center;
}

.je-submenu__title.is-collapse .je-submenu__tip {
  flex: 0 0 auto;
}

.je-submenu__title.is-collapse .je-submenu__label,
.je-submenu__title.is-collapse .je-submenu__arrow {
  display: none;
}

/* 纵向内联展开：用 grid-template-rows 0fr → 1fr 做高度过渡，无需测量高度 */
.je-submenu__list {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  visibility: hidden;
  transition: grid-template-rows 0.3s ease, opacity 0.25s ease, visibility 0s linear 0.3s;
}

.je-submenu__list.is-open {
  grid-template-rows: 1fr;
  opacity: 1;
  visibility: visible;
  transition: grid-template-rows 0.32s var(--je-ease-out-back), opacity 0.28s ease;
}

.je-submenu__inner {
  min-height: 0;
  overflow: hidden;
}

/* 纵向内联展开时子项缩进，形成层级感 */
.je-submenu:not(.is-popup) .je-submenu__inner {
  padding-left: 14px;
}

/* 浮层模式：横向菜单 / 折叠后的纵向菜单，用 useFloating 定位 */
.je-submenu.is-popup .je-submenu__list {
  position: fixed;
  display: block;
  z-index: 2000;
  min-width: 180px;
  padding: 6px;
  background: var(--je-popup);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: var(--je-border);
  border-radius: var(--je-radius);
  box-shadow: var(--je-shadow-popup);
  transform-origin: top left;
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  transform: scale(0.94);
  transition: transform 0.24s ease-in, opacity 0.2s ease-in, visibility 0s linear 0.24s;
}

.je-submenu.is-popup .je-submenu__list.is-open {
  pointer-events: auto;
  opacity: 1;
  visibility: visible;
  transform: scale(1);
  transition: transform 0.28s var(--je-ease-out-back), opacity 0.22s ease-out;
}

.je-submenu.is-popup .je-submenu__inner {
  overflow: visible;
  padding-left: 0;
}

@media (max-width: 768px) {
  .je-submenu__title {
    min-height: 48px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .je-submenu__title,
  .je-submenu__arrow,
  .je-submenu__list,
  .je-submenu__list.is-open,
  .je-submenu.is-popup .je-submenu__list,
  .je-submenu.is-popup .je-submenu__list.is-open {
    transition: none;
  }
}
</style>
