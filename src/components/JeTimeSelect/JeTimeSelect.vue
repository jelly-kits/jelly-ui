<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useId } from 'vue'
import { useClickOutside } from '../../core/useClickOutside'
import { useFloating } from '../../core/useFloating'
import { useIsMobile } from '../../core/useMediaQuery'
import { useScrollLock } from '../../core/useScrollLock'
import { useSheetDrag } from '../../core/useSheetDrag'
import { nextZIndex } from '../../core/useZIndex'
import { JeIcon } from '../JeIcon'
import type { JeTimeSelectValue } from './types'
import type { JeTeleportTarget } from '../../core/globalConfig'
import { useTeleportTarget } from '../JeConfigProvider/types'

defineOptions({ name: 'JeTimeSelect' })

const props = withDefaults(
  defineProps<{
    modelValue?: JeTimeSelectValue
    /** 起始时间，形如 "08:00" */
    start?: string
    /** 结束时间，形如 "20:00" */
    end?: string
    /** 步长，形如 "00:30" */
    step?: string
    placeholder?: string
    disabled?: boolean
    clearable?: boolean
    /** 可选下限（含） */
    minTime?: string
    /** 可选上限（含） */
    maxTime?: string
    /** 浮层挂载点：选择器或元素；false 表示就地渲染不传送。缺省时按 ConfigProvider → configureJelly → body 回退 */
    teleportTo?: JeTeleportTarget | false
  }>(),
  {
    modelValue: '',
    start: '08:00',
    end: '20:00',
    step: '00:30',
    placeholder: '请选择时间',
    disabled: false,
    clearable: true,
    teleportTo: undefined,
  },
)

/** 浮层挂载点，缺省时跟随 ConfigProvider / configureJelly，最终落到 body */
const teleportTarget = useTeleportTarget(() => props.teleportTo)

const emit = defineEmits<{
  'update:modelValue': [value: JeTimeSelectValue]
  change: [value: JeTimeSelectValue]
  clear: []
}>()

const uid = useId()
const rootRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const isOpen = ref(false)
const activeIndex = ref(-1)
const zIndex = ref(nextZIndex())

/** 窄屏切底部弹出层：挂到 body、锁滚动、可下拉关闭 */
const isMobile = useIsMobile()
const locked = computed(() => isMobile.value && isOpen.value)
useScrollLock(locked)

const sheet = useSheetDrag(() => close())

const { x, y } = useFloating({
  reference: triggerRef,
  floating: panelRef,
  open: isOpen,
  placement: () => 'bottom-start',
  offset: 8,
})

const pad = (value: number) => String(value).padStart(2, '0')

/** 把 "HH:mm" 换算成分钟数，非法输入返回 null */
const toMinutes = (value: string): number | null => {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim())
  if (!match) return null
  const hour = Number(match[1])
  const minute = Number(match[2])
  if (hour > 23 || minute > 59) return null
  return hour * 60 + minute
}

const toLabel = (minutes: number) => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`

/** 按 step 从 start 铺到 end，再用 minTime / maxTime 夹一遍 */
const options = computed(() => {
  const startMinutes = toMinutes(props.start)
  const endMinutes = toMinutes(props.end)
  const stepMinutes = toMinutes(props.step)
  if (startMinutes === null || endMinutes === null || stepMinutes === null || stepMinutes <= 0) {
    return []
  }
  const min = props.minTime ? toMinutes(props.minTime) : null
  const max = props.maxTime ? toMinutes(props.maxTime) : null

  const list: string[] = []
  for (let value = startMinutes; value <= endMinutes; value += stepMinutes) {
    if (min !== null && value < min) continue
    if (max !== null && value > max) continue
    list.push(toLabel(value))
  }
  return list
})

const hasValue = computed(() => !!props.modelValue)

const open = () => {
  sheet.reset()
  zIndex.value = nextZIndex()
  isOpen.value = true
  activeIndex.value = options.value.indexOf(props.modelValue)
}

const close = () => {
  if (!isOpen.value) return
  isOpen.value = false
}

const toggle = () => {
  if (props.disabled) return
  isOpen.value ? close() : open()
}

const select = (option: string) => {
  if (option !== props.modelValue) {
    emit('update:modelValue', option)
    emit('change', option)
  }
  close()
  triggerRef.value?.focus()
}

const clear = () => {
  emit('update:modelValue', '')
  emit('clear')
}

const moveActive = (step: number) => {
  const count = options.value.length
  if (count === 0) return
  // activeIndex 为 -1 时：向下从第一项开始，向上从最后一项开始
  const base = activeIndex.value < 0 ? (step > 0 ? -1 : 0) : activeIndex.value
  activeIndex.value = (base + step + count) % count
}

const commitActive = () => {
  const option = options.value[activeIndex.value]
  if (option) select(option)
}

const onTriggerKeydown = (event: KeyboardEvent) => {
  if (props.disabled) return

  switch (event.key) {
    case 'Escape':
      if (!isOpen.value) return
      event.preventDefault()
      close()
      break

    case 'ArrowDown':
    case 'ArrowUp':
      event.preventDefault()
      if (!isOpen.value) {
        open()
        return
      }
      moveActive(event.key === 'ArrowDown' ? 1 : -1)
      break

    case 'Enter':
    case ' ':
      event.preventDefault()
      if (!isOpen.value) {
        open()
        return
      }
      commitActive()
      break
  }
}

const onDocumentKeydown = (event: KeyboardEvent) => {
  if (event.key !== 'Escape' || !isOpen.value) return
  close()
}

useClickOutside([rootRef, panelRef], () => close())

onMounted(() => document.addEventListener('keydown', onDocumentKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onDocumentKeydown))

const panelStyle = computed(() => {
  if (isMobile.value) {
    if (!isOpen.value) return undefined
    return {
      transform: `translateY(${sheet.offset.value}px)`,
      transition: sheet.dragging.value ? 'none' : undefined,
    }
  }
  return { left: `${x.value}px`, top: `${y.value}px`, zIndex: zIndex.value }
})
</script>

<template>
  <div
    ref="rootRef"
    class="je-time-select"
    :class="{ 'is-open': isOpen, 'is-disabled': disabled }"
  >
    <div
      ref="triggerRef"
      class="je-time-select__trigger"
      :class="{ 'has-value': hasValue }"
      role="combobox"
      aria-haspopup="listbox"
      :aria-expanded="isOpen"
      :aria-controls="`${uid}-listbox`"
      :aria-activedescendant="isOpen && activeIndex >= 0 ? `${uid}-opt-${activeIndex}` : undefined"
      :tabindex="disabled ? -1 : 0"
      @click="toggle"
      @keydown="onTriggerKeydown"
    >
      <span class="je-time-select__label">{{ modelValue || placeholder }}</span>
      <button
        v-if="clearable && hasValue && !disabled"
        type="button"
        class="je-time-select__clear"
        aria-label="清除"
        @click.stop="clear"
      >
        <JeIcon name="close" :size="14" />
      </button>
      <span class="je-time-select__arrow" aria-hidden="true" />
    </div>

    <Teleport
      :to="teleportTarget === false ? 'body' : teleportTarget"
      :disabled="!isMobile || teleportTarget === false"
    >
      <div
        v-if="isMobile"
        class="je-time-select__scrim"
        :class="{ 'is-open': isOpen }"
        aria-hidden="true"
        @click="close"
      />

      <div
        :id="`${uid}-listbox`"
        ref="panelRef"
        class="je-time-select__list"
        :class="{ 'is-open': isOpen }"
        :style="panelStyle"
        role="listbox"
        :aria-label="placeholder"
        :aria-hidden="!isOpen"
      >
        <div
          v-if="isMobile"
          class="je-time-select__handle"
          aria-hidden="true"
          @pointerdown="sheet.onPointerDown"
          @pointermove="sheet.onPointerMove"
          @pointerup="sheet.onPointerUp"
          @pointercancel="sheet.onPointerUp"
        />

        <div
          v-for="(option, index) in options"
          :id="`${uid}-opt-${index}`"
          :key="option"
          class="je-time-select__item"
          :class="{ 'is-active': index === activeIndex }"
          role="option"
          :aria-selected="option === modelValue"
          @click="select(option)"
        >
          {{ option }}
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.je-time-select {
  position: relative;
  font-family: inherit;
  user-select: none;
}

.je-time-select__trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  box-sizing: border-box;
  padding: 14px 16px;
  font-size: 15px;
  color: var(--je-text-faint);
  background: var(--je-surface);
  border: var(--je-border);
  border-radius: var(--je-radius);
  cursor: pointer;
  outline: none;
  transition: border-color var(--je-duration) ease, background var(--je-duration) ease,
    box-shadow var(--je-duration) ease;
}

.je-time-select__trigger.has-value {
  color: var(--je-text);
}

/* 聚焦与展开共用同一套高亮 */
.je-time-select__trigger:focus-visible,
.je-time-select.is-open .je-time-select__trigger {
  border-color: var(--je-primary);
  background: color-mix(in srgb, var(--je-primary) 12%, transparent);
  box-shadow: 0 8px 24px color-mix(in srgb, var(--je-primary) 25%, transparent);
}

.je-time-select__label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.je-time-select__clear {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  color: var(--je-text-faint);
  background: none;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: color 0.2s ease, background 0.2s ease;
}

.je-time-select__clear:hover {
  color: var(--je-text);
  background: var(--je-surface-hover);
}

.je-time-select__arrow {
  flex-shrink: 0;
  width: 12px;
  height: 12px;
  margin-top: -4px;
  border-right: 2px solid var(--je-text-faint);
  border-bottom: 2px solid var(--je-text-faint);
  transform: rotate(45deg);
  transition: transform 0.4s var(--je-ease-overshoot), margin-top 0.4s var(--je-ease-overshoot),
    border-color var(--je-duration) ease;
}

.je-time-select.is-open .je-time-select__arrow {
  margin-top: 4px;
  border-color: var(--je-text);
  transform: rotate(-135deg);
}

.je-time-select.is-disabled .je-time-select__trigger {
  cursor: not-allowed;
  opacity: 0.5;
}

.je-time-select__list {
  position: fixed;
  z-index: 50;
  box-sizing: border-box;
  max-height: 264px;
  padding: 6px;
  overflow-y: auto;
  font-family: inherit;
  color: var(--je-text);
  background: var(--je-popup);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: var(--je-border);
  border-radius: var(--je-radius);
  box-shadow: var(--je-shadow-popup);
  transform-origin: top left;
  pointer-events: none;
  will-change: transform, opacity;
  opacity: 0;
  visibility: hidden;
  transform: scale(0.94) translateY(-6px);
  transition: transform 0.28s ease-in, opacity 0.2s ease-in, visibility 0s linear 0.28s;
}

.je-time-select__list.is-open {
  pointer-events: auto;
  visibility: visible;
  opacity: 1;
  transform: scale(1) translateY(0);
  transition: transform 0.38s var(--je-ease-out-back), opacity 0.24s ease-out;
}

.je-time-select__item {
  padding: 11px 14px;
  font-size: 14px;
  color: var(--je-text-muted);
  border-radius: var(--je-radius-sm);
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease,
    transform var(--je-duration) var(--je-ease-overshoot);
}

.je-time-select__item:hover,
.je-time-select__item.is-active {
  color: var(--je-text);
  background: color-mix(in srgb, var(--je-primary) 20%, transparent);
  transform: translateX(4px);
}

.je-time-select__item[aria-selected='true'] {
  color: var(--je-text);
  font-weight: 600;
  background: color-mix(in srgb, var(--je-primary) 35%, transparent);
}

.je-time-select__scrim {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(0, 0, 0, 0.45);
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.28s ease, visibility 0s linear 0.28s;
}

.je-time-select__scrim.is-open {
  opacity: 1;
  visibility: visible;
  transition: opacity 0.28s ease;
}

.je-time-select__handle {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 22px;
  cursor: grab;
  touch-action: none;
}

.je-time-select__handle::before {
  content: '';
  width: 40px;
  height: 4px;
  background: var(--je-border-color);
  border-radius: 999px;
}

/* 窄屏：面板改成贴底的弹出层，并预留给安全区 */
@media (max-width: 768px) {
  .je-time-select__list {
    position: fixed;
    top: auto;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 101;
    max-height: 72vh;
    padding: 4px 12px calc(14px + env(safe-area-inset-bottom, 0px));
    border-radius: 22px 22px 0 0;
    border-bottom: none;
    transform-origin: bottom center;
    /* 这里不能设 touch-action: none，否则选项列表在触屏上没法滚动；
       拖拽手势的 touch-action 由 .je-time-select__handle 单独承担 */
    transform: translateY(100%);
    transition: transform 0.32s ease-in, opacity 0.2s ease-in, visibility 0s linear 0.32s;
  }

  .je-time-select__list.is-open {
    transform: translateY(0);
    transition: transform 0.42s var(--je-ease-out-back), opacity 0.24s ease-out;
  }

  .je-time-select__item {
    display: flex;
    align-items: center;
    min-height: 48px;
    padding: 12px 16px;
    font-size: 15px;
  }

  /* 触屏没有 hover，位移高亮改由选中 / 键盘高亮承担 */
  .je-time-select__item:hover {
    transform: none;
  }

  .je-time-select__clear {
    width: 32px;
    height: 32px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .je-time-select__list,
  .je-time-select__list.is-open,
  .je-time-select__scrim,
  .je-time-select__arrow {
    transition: none;
  }
}
</style>
