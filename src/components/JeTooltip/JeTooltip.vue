<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useId } from 'vue'
import { useClickOutside } from '../../core/useClickOutside'
import { useFloating } from '../../core/useFloating'
import { useIsMobile } from '../../core/useMediaQuery'
import { nextZIndex } from '../../core/useZIndex'
import type { JeTooltipPlacement } from './types'
import type { JeTeleportTarget } from '../../core/globalConfig'
import { useTeleportTarget } from '../JeConfigProvider/types'

defineOptions({ name: 'JeTooltip', inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    /** 文本内容，也可用 #content 插槽自定义 */
    content?: string
    placement?: JeTooltipPlacement
    disabled?: boolean
    /** 与触发元素的间距 */
    offset?: number
    /** 移入后延迟展开（毫秒） */
    openDelay?: number
    /** 移出后延迟收起（毫秒） */
    closeDelay?: number
    /** 浮层挂载点：选择器或元素；false 表示就地渲染不传送。缺省时按 ConfigProvider → configureJelly → body 回退 */
    teleportTo?: JeTeleportTarget | false
  }>(),
  {
    content: '',
    placement: 'top',
    disabled: false,
    offset: 10,
    openDelay: 120,
    closeDelay: 80,
    teleportTo: undefined,
  },
)

/** 浮层挂载点，缺省时跟随 ConfigProvider / configureJelly，最终落到 body */
const teleportTarget = useTeleportTarget(() => props.teleportTo)

const uid = useId()
const triggerRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const isOpen = ref(false)
const zIndex = ref(nextZIndex())

const isMobile = useIsMobile()

const { x, y, placement, arrowCross } = useFloating({
  reference: triggerRef,
  floating: panelRef,
  open: isOpen,
  placement: () => props.placement,
  offset: props.offset,
})

/** 实际方位的「边」，箭头样式与朝向按它切换 */
const side = computed(() => placement.value.split('-')[0])

const panelStyle = computed(() => ({
  left: `${x.value}px`,
  top: `${y.value}px`,
  zIndex: zIndex.value,
}))

const arrowStyle = computed(() =>
  side.value === 'top' || side.value === 'bottom'
    ? { left: `${arrowCross.value}px` }
    : { top: `${arrowCross.value}px` },
)

let openTimer: ReturnType<typeof setTimeout> | null = null
let closeTimer: ReturnType<typeof setTimeout> | null = null

const clearTimers = () => {
  if (openTimer !== null) {
    clearTimeout(openTimer)
    openTimer = null
  }
  if (closeTimer !== null) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
}

const show = () => {
  if (props.disabled) return
  clearTimers()
  openTimer = setTimeout(() => {
    openTimer = null
    zIndex.value = nextZIndex()
    isOpen.value = true
  }, props.openDelay)
}

const hide = () => {
  clearTimers()
  closeTimer = setTimeout(() => {
    closeTimer = null
    isOpen.value = false
  }, props.closeDelay)
}

/**
 * 窄屏没有 hover，改成点一下切换；
 * 桌面端点击不做任何事，避免干扰触发元素自身的点击行为。
 */
const onTriggerClick = () => {
  if (!isMobile.value || props.disabled) return
  clearTimers()
  if (isOpen.value) {
    isOpen.value = false
    return
  }
  zIndex.value = nextZIndex()
  isOpen.value = true
}

useClickOutside([triggerRef, panelRef], () => {
  if (!isMobile.value) return
  clearTimers()
  isOpen.value = false
})

onBeforeUnmount(clearTimers)
</script>

<template>
  <span
    ref="triggerRef"
    class="je-tooltip__trigger"
    v-bind="$attrs"
    :aria-describedby="isOpen ? uid : undefined"
    @mouseenter="!isMobile && show()"
    @mouseleave="!isMobile && hide()"
    @focusin="!isMobile && show()"
    @focusout="!isMobile && hide()"
    @click="onTriggerClick"
  >
    <slot />
  </span>

  <Teleport :to="teleportTarget === false ? 'body' : teleportTarget" :disabled="teleportTarget === false">
    <div
      :id="uid"
      ref="panelRef"
      class="je-tooltip__panel"
      :class="[`is-${side}`, { 'is-open': isOpen }]"
      :style="panelStyle"
      role="tooltip"
      :aria-hidden="!isOpen"
    >
      <span class="je-tooltip__text">
        <slot name="content">{{ content }}</slot>
      </span>
      <span class="je-tooltip__arrow" :style="arrowStyle" aria-hidden="true" />
    </div>
  </Teleport>
</template>

<style scoped>
.je-tooltip__trigger {
  display: inline-flex;
  align-items: center;
  font-family: inherit;
}

.je-tooltip__panel {
  position: fixed;
  z-index: 2000;
  max-width: 260px;
  padding: 8px 12px;
  font-family: inherit;
  font-size: 13px;
  line-height: 1.5;
  color: var(--je-text);
  background: var(--je-popup);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: var(--je-border);
  border-radius: var(--je-radius-sm);
  box-shadow: var(--je-shadow-popup);
  pointer-events: none;
  will-change: transform, opacity;
  opacity: 0;
  visibility: hidden;
  transform: scale(0.9);
  transition: transform 0.24s var(--je-ease-out-back), opacity 0.18s ease,
    visibility 0s linear 0.24s;
}

.je-tooltip__panel.is-open {
  opacity: 1;
  visibility: visible;
  transform: scale(1);
  transition: transform 0.28s var(--je-ease-out-back), opacity 0.18s ease;
}

/* 从触发元素那一侧「长出来」，缩放原点要贴住箭头 */
.je-tooltip__panel.is-top {
  transform-origin: bottom center;
}

.je-tooltip__panel.is-bottom {
  transform-origin: top center;
}

.je-tooltip__panel.is-left {
  transform-origin: right center;
}

.je-tooltip__panel.is-right {
  transform-origin: left center;
}

.je-tooltip__text {
  display: block;
  word-break: break-word;
}

/* 箭头是一个旋转 45° 的小方块，只画朝外的两条边 */
.je-tooltip__arrow {
  position: absolute;
  width: 10px;
  height: 10px;
  background: var(--je-popup);
  border: 1px solid var(--je-border-color);
}

.je-tooltip__panel.is-top .je-tooltip__arrow {
  bottom: -6px;
  transform: translateX(-50%) rotate(45deg);
  border-top: none;
  border-left: none;
}

.je-tooltip__panel.is-bottom .je-tooltip__arrow {
  top: -6px;
  transform: translateX(-50%) rotate(45deg);
  border-right: none;
  border-bottom: none;
}

.je-tooltip__panel.is-left .je-tooltip__arrow {
  right: -6px;
  transform: translateY(-50%) rotate(45deg);
  border-bottom: none;
  border-left: none;
}

.je-tooltip__panel.is-right .je-tooltip__arrow {
  left: -6px;
  transform: translateY(-50%) rotate(45deg);
  border-top: none;
  border-right: none;
}

/*
 * 减弱动效时全部瞬切。
 * 必须把 .is-open 状态类也列进来：它的选择器特异性比单个基础类高，
 * 只写基础类的话状态规则里的 transition 会反压回来，减弱动效实际不生效。
 */
@media (prefers-reduced-motion: reduce) {
  .je-tooltip__panel,
  .je-tooltip__panel.is-open {
    transition: none;
  }
}
</style>
