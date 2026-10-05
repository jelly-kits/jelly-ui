<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import JeIcon from '../JeIcon/JeIcon.vue'
import { useFocusTrap } from '../../core/useFocusTrap'
import { useScrollLock } from '../../core/useScrollLock'
import { useSheetDrag } from '../../core/useSheetDrag'
import { nextZIndex } from '../../core/useZIndex'
import type { JePickerColumn, JePickerOption } from './types'
import type { JeTeleportTarget } from '../../core/globalConfig'
import { useTeleportTarget } from '../JeConfigProvider/types'

defineOptions({ name: 'JePicker' })

const props = withDefaults(
  defineProps<{
    /** 每列已选中的值，长度与 columns 对应 */
    modelValue?: (string | number)[]
    /** 列定义 */
    columns?: JePickerColumn[]
    /** 面板标题 */
    title?: string
    /** 未选择时触发按钮上的占位文字 */
    placeholder?: string
    /** 禁用整个选择器 */
    disabled?: boolean
    /** 确认按钮文字 */
    confirmText?: string
    /** 取消按钮文字 */
    cancelText?: string
    /** 是否显示顶部工具栏（取消 / 标题 / 确认） */
    showToolbar?: boolean
    /** 每列可见的选项行数，建议用奇数 */
    visibleItemCount?: number
    /** 单行高度 */
    itemHeight?: number
    /** 点击遮罩关闭 */
    closeOnClickModal?: boolean
    /** 浮层挂载点：选择器或元素；false 表示就地渲染不传送。缺省时按 ConfigProvider → configureJelly → body 回退 */
    teleportTo?: JeTeleportTarget | false
  }>(),
  {
    modelValue: () => [],
    columns: () => [],
    title: '',
    placeholder: '请选择',
    disabled: false,
    confirmText: '确认',
    cancelText: '取消',
    showToolbar: true,
    visibleItemCount: 5,
    itemHeight: 44,
    closeOnClickModal: true,
    teleportTo: undefined,
  },
)

/** 浮层挂载点，缺省时跟随 ConfigProvider / configureJelly，最终落到 body */
const teleportTarget = useTeleportTarget(() => props.teleportTo)

const emit = defineEmits<{
  'update:modelValue': [values: (string | number)[]]
  /** 某一列滚动停下后 */
  change: [values: (string | number)[], options: (JePickerOption | undefined)[]]
  /** 点击确认 */
  confirm: [values: (string | number)[], options: (JePickerOption | undefined)[]]
  /** 点击取消或遮罩 */
  cancel: []
}>()

const uid = useId()
const panelRef = ref<HTMLElement | null>(null)
const isOpen = ref(false)
const zIndex = ref(nextZIndex())

/** 打开期间的临时选择，确认才写回 modelValue */
const pending = ref<(string | number)[]>([])

const selectedIndexes = computed(() =>
  props.columns.map((column, index) => {
    const position = column.options.findIndex((option) => option.value === pending.value[index])
    return position >= 0 ? position : 0
  }),
)

const selectedOptions = computed(() =>
  props.columns.map((column, index) =>
    column.options.find((option) => option.value === pending.value[index]),
  ),
)

const triggerLabel = computed(() => {
  const texts = props.columns
    .map((column, index) => column.options.find((option) => option.value === props.modelValue[index])?.text)
    .filter((text): text is string => Boolean(text))
  return texts.join(' / ')
})

const hasValue = computed(() => triggerLabel.value !== '')

/* ---- 滚轮：原生滚动 + scroll-snap 吸附，停稳后按 scrollTop 反推选中项 ---- */

const scrollerMap = new Map<number, HTMLElement>()
const scrollTimers: number[] = []

const setColumnRef = (el: unknown, index: number) => {
  if (el instanceof HTMLElement) scrollerMap.set(index, el)
  else scrollerMap.delete(index)
}

const scrollerStyle = computed(() => ({ height: `${props.itemHeight * props.visibleItemCount}px` }))
const spacerStyle = computed(() => ({
  height: `${(props.itemHeight * (props.visibleItemCount - 1)) / 2}px`,
}))
const itemStyle = computed(() => ({ height: `${props.itemHeight}px` }))
const indicatorStyle = computed(() => ({
  top: spacerStyle.value.height,
  height: `${props.itemHeight}px`,
}))

/** 首尾补半屏空白，使 scrollTop = i * itemHeight 时第 i 项正好居中 */
const syncScroll = () => {
  selectedIndexes.value.forEach((index, columnIndex) => {
    const el = scrollerMap.get(columnIndex)
    if (el) el.scrollTop = index * props.itemHeight
  })
}

const onColumnScroll = (columnIndex: number, event: Event) => {
  const el = event.currentTarget as HTMLElement
  window.clearTimeout(scrollTimers[columnIndex])
  scrollTimers[columnIndex] = window.setTimeout(() => {
    const option = props.columns[columnIndex]?.options[Math.round(el.scrollTop / props.itemHeight)]
    if (!option || option.value === pending.value[columnIndex]) return
    const next = [...pending.value]
    next[columnIndex] = option.value
    pending.value = next
    emit('change', [...next], selectedOptions.value)
  }, 120)
}

const selectIndex = (columnIndex: number, index: number) => {
  const option = props.columns[columnIndex]?.options[index]
  if (!option || option.disabled) return
  const el = scrollerMap.get(columnIndex)
  if (el) el.scrollTo({ top: index * props.itemHeight, behavior: 'smooth' })
  const next = [...pending.value]
  next[columnIndex] = option.value
  pending.value = next
  emit('change', [...next], selectedOptions.value)
}

/* ---- 开关与工具栏 ---- */

const sheet = useSheetDrag(() => {
  sheet.reset()
  close()
})

const locked = computed(() => isOpen.value)
useScrollLock(locked)
useFocusTrap(panelRef, locked)

const open = () => {
  if (props.disabled) return
  pending.value = props.columns.map((column, index) => {
    const value = props.modelValue[index]
    if (value !== undefined && column.options.some((option) => option.value === value)) return value
    return column.options[0]?.value ?? ''
  })
  sheet.reset()
  isOpen.value = true
  nextTick(syncScroll)
}

const close = () => {
  if (!isOpen.value) return
  isOpen.value = false
}

const toggle = () => {
  if (props.disabled) return
  if (isOpen.value) close()
  else open()
}

const onConfirm = () => {
  emit('update:modelValue', [...pending.value])
  emit('confirm', [...pending.value], selectedOptions.value)
  close()
}

const onCancel = () => {
  emit('cancel')
  close()
}

const onScrimClick = () => {
  if (props.closeOnClickModal) onCancel()
}

const panelStyle = computed(() => {
  const base = { zIndex: zIndex.value }
  if (!sheet.dragging.value && !sheet.offset.value) return base
  return { ...base, transform: `translateY(${sheet.offset.value}px)` }
})

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && isOpen.value) {
    event.preventDefault()
    onCancel()
  }
}

watch(isOpen, (value) => {
  if (value) {
    zIndex.value = nextZIndex()
    document.addEventListener('keydown', onKeydown)
  } else {
    document.removeEventListener('keydown', onKeydown)
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  scrollTimers.forEach((timer) => window.clearTimeout(timer))
})
</script>

<template>
  <div class="je-picker" :class="{ 'is-open': isOpen, 'is-disabled': disabled }">
    <button
      type="button"
      class="je-picker__trigger"
      :class="{ 'has-value': hasValue }"
      :disabled="disabled"
      aria-haspopup="dialog"
      :aria-expanded="isOpen"
      :aria-controls="`${uid}-panel`"
      @click="toggle"
    >
      <span class="je-picker__label">{{ triggerLabel || placeholder }}</span>
      <JeIcon class="je-picker__arrow" name="chevron-down" :size="16" />
    </button>

    <Teleport :to="teleportTarget === false ? 'body' : teleportTarget" :disabled="teleportTarget === false">
      <div class="je-picker__sheet" :class="{ 'is-open': isOpen }" :style="{ zIndex }">
        <div class="je-picker__scrim" aria-hidden="true" @click="onScrimClick" />

        <div
          :id="`${uid}-panel`"
          ref="panelRef"
          class="je-picker__panel"
          :style="panelStyle"
          role="dialog"
          aria-modal="true"
          :aria-label="title || '选择器'"
          :aria-hidden="!isOpen"
        >
          <div
            class="je-picker__handle"
            aria-hidden="true"
            @pointerdown="sheet.onPointerDown"
            @pointermove="sheet.onPointerMove"
            @pointerup="sheet.onPointerUp"
            @pointercancel="sheet.onPointerUp"
          />

          <div v-if="showToolbar" class="je-picker__toolbar">
            <button type="button" class="je-picker__toolbar-btn" @click="onCancel">
              {{ cancelText }}
            </button>
            <h2 class="je-picker__title">{{ title }}</h2>
            <button
              type="button"
              class="je-picker__toolbar-btn je-picker__toolbar-btn--confirm"
              @click="onConfirm"
            >
              {{ confirmText }}
            </button>
          </div>

          <div class="je-picker__wheel">
            <div
              v-for="(column, columnIndex) in columns"
              :key="column.name ?? columnIndex"
              class="je-picker__column"
            >
              <div class="je-picker__indicator" :style="indicatorStyle" aria-hidden="true" />

              <div
                :ref="(el) => setColumnRef(el, columnIndex)"
                class="je-picker__scroller"
                :style="scrollerStyle"
                role="listbox"
                :aria-label="column.title"
                @scroll="onColumnScroll(columnIndex, $event)"
              >
                <div class="je-picker__spacer" :style="spacerStyle" aria-hidden="true" />

                <button
                  v-for="(option, index) in column.options"
                  :key="option.value"
                  type="button"
                  class="je-picker__item"
                  :class="{
                    'is-selected': index === selectedIndexes[columnIndex],
                    'is-disabled': option.disabled,
                  }"
                  :style="itemStyle"
                  role="option"
                  :aria-selected="index === selectedIndexes[columnIndex]"
                  :disabled="option.disabled"
                  @click="selectIndex(columnIndex, index)"
                >
                  <span class="je-picker__item-text">{{ option.text }}</span>
                  <span v-if="option.subText" class="je-picker__item-sub">{{ option.subText }}</span>
                </button>

                <div class="je-picker__spacer" :style="spacerStyle" aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.je-picker {
  position: relative;
  font-family: inherit;
}

.je-picker__trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  box-sizing: border-box;
  width: 100%;
  padding: 14px 16px;
  font-family: inherit;
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

.je-picker__trigger.has-value {
  color: var(--je-text);
}

.je-picker__trigger:focus-visible,
.je-picker.is-open .je-picker__trigger {
  border-color: var(--je-primary);
  background: color-mix(in srgb, var(--je-primary) 12%, transparent);
  box-shadow: 0 8px 24px color-mix(in srgb, var(--je-primary) 25%, transparent);
}

.je-picker__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.je-picker__arrow {
  flex-shrink: 0;
  transition: transform var(--je-duration) ease;
}

.je-picker.is-open .je-picker__arrow {
  transform: rotate(180deg);
}

.je-picker.is-disabled .je-picker__trigger {
  cursor: not-allowed;
  opacity: 0.5;
}

/* 浮层容器铺满视口，收起时必须放行点击 */
.je-picker__sheet {
  position: fixed;
  inset: 0;
  pointer-events: none;
}

.je-picker__sheet.is-open {
  pointer-events: auto;
}

.je-picker__scrim {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.28s ease, visibility 0s linear 0.28s;
}

.je-picker__sheet.is-open .je-picker__scrim {
  opacity: 1;
  visibility: visible;
  transition: opacity 0.28s ease;
}

.je-picker__panel {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  padding: 0 8px calc(12px + env(safe-area-inset-bottom, 0px));
  font-family: inherit;
  color: var(--je-text);
  background: var(--je-popup);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-radius: 22px 22px 0 0;
  box-shadow: var(--je-shadow-popup);
  outline: none;
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  transform: translateY(100%);
  transition: transform 0.32s ease-in, opacity 0.2s ease-in, visibility 0s linear 0.32s;
}

.je-picker__sheet.is-open .je-picker__panel {
  pointer-events: auto;
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
  transition: transform 0.42s var(--je-ease-out-back), opacity 0.24s ease-out;
}

.je-picker__handle {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  height: 22px;
  cursor: grab;
  /* 抓手是独立手势元素，可以独占 touch-action；列本身不能设，否则滚不动 */
  touch-action: none;
}

.je-picker__handle::before {
  content: '';
  width: 40px;
  height: 4px;
  background: var(--je-border-color);
  border-radius: 999px;
}

.je-picker__toolbar {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 4px 6px 10px;
}

.je-picker__title {
  flex: 1 1 auto;
  margin: 0;
  overflow: hidden;
  font-size: 16px;
  font-weight: 700;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.je-picker__toolbar-btn {
  flex-shrink: 0;
  min-width: 56px;
  min-height: 40px;
  padding: 8px 12px;
  font-family: inherit;
  font-size: 15px;
  color: var(--je-text-muted);
  background: transparent;
  border: none;
  border-radius: var(--je-radius-sm);
  cursor: pointer;
  outline: none;
  transition: color var(--je-duration) ease, background var(--je-duration) ease;
}

.je-picker__toolbar-btn:hover {
  background: var(--je-surface-hover);
}

.je-picker__toolbar-btn:focus-visible {
  outline: 2px solid var(--je-primary);
  outline-offset: 2px;
}

.je-picker__toolbar-btn--confirm {
  font-weight: 600;
  color: var(--je-primary);
}

.je-picker__wheel {
  display: flex;
  gap: 4px;
}

.je-picker__column {
  position: relative;
  flex: 1 1 0;
  min-width: 0;
}

/* 中间选中行的提示条，压在选项下面 */
.je-picker__indicator {
  position: absolute;
  right: 4px;
  left: 4px;
  z-index: 0;
  background: color-mix(in srgb, var(--je-primary) 12%, transparent);
  border-top: 1px solid color-mix(in srgb, var(--je-primary) 30%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--je-primary) 30%, transparent);
  border-radius: var(--je-radius-sm);
  pointer-events: none;
}

.je-picker__scroller {
  position: relative;
  z-index: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
  scroll-snap-type: y mandatory;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.je-picker__scroller::-webkit-scrollbar {
  display: none;
}

.je-picker__spacer {
  width: 100%;
}

.je-picker__item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  box-sizing: border-box;
  width: 100%;
  padding: 0 8px;
  font-family: inherit;
  font-size: 16px;
  color: var(--je-text-muted);
  background: transparent;
  border: none;
  cursor: pointer;
  scroll-snap-align: center;
  outline: none;
  transition: color var(--je-duration) ease;
}

.je-picker__item.is-selected {
  font-weight: 700;
  color: var(--je-text);
}

.je-picker__item.is-disabled {
  color: var(--je-text-faint);
  cursor: not-allowed;
}

.je-picker__item-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.je-picker__item-sub {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--je-text-faint);
}

/*
 * 减弱动效时全部瞬切。
 * 必须把 .is-open 状态类也列进来：它的选择器特异性比单个基础类高，
 * 只写基础类的话状态规则里的 transition 会反压回来，减弱动效实际不生效。
 */
@media (prefers-reduced-motion: reduce) {
  .je-picker__scrim,
  .je-picker__panel,
  .je-picker__arrow,
  .je-picker__sheet.is-open .je-picker__scrim,
  .je-picker__sheet.is-open .je-picker__panel {
    transition: none;
  }
}
</style>
