<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { useClickOutside } from '../../core/useClickOutside'
import { useFloating } from '../../core/useFloating'
import { useIsMobile } from '../../core/useMediaQuery'
import { useScrollLock } from '../../core/useScrollLock'
import { useSheetDrag } from '../../core/useSheetDrag'
import { nextZIndex } from '../../core/useZIndex'
import { JeIcon } from '../JeIcon'
import type { JeCascaderOption, JeCascaderValue } from './types'
import type { JeTeleportTarget } from '../../core/globalConfig'
import { useTeleportTarget } from '../JeConfigProvider/types'

defineOptions({ name: 'JeCascader' })

const props = withDefaults(
  defineProps<{
    modelValue?: JeCascaderValue
    options: JeCascaderOption[]
    placeholder?: string
    disabled?: boolean
    clearable?: boolean
    /** 浮层挂载点：选择器或元素；false 表示就地渲染不传送。缺省时按 ConfigProvider → configureJelly → body 回退 */
    teleportTo?: JeTeleportTarget | false
  }>(),
  {
    modelValue: () => [],
    placeholder: '请选择',
    disabled: false,
    clearable: true,
    teleportTo: undefined,
  },
)

/** 浮层挂载点，缺省时跟随 ConfigProvider / configureJelly，最终落到 body */
const teleportTarget = useTeleportTarget(() => props.teleportTo)

const emit = defineEmits<{
  'update:modelValue': [value: JeCascaderValue]
  change: [value: JeCascaderValue]
  clear: []
}>()

const uid = useId()
const rootRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const isOpen = ref(false)
/** 面板里当前走到的路径（可能还没选到叶子） */
const activePath = ref<JeCascaderValue>([])
/** 当前列里键盘高亮的下标，-1 表示无 */
const focusIndex = ref(-1)
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

/** 按 activePath 一路展开出各列，最后一项就是当前操作的层级 */
const columns = computed(() => {
  const result: JeCascaderOption[][] = [props.options]
  let list = props.options
  for (const value of activePath.value) {
    const node = list.find((item) => item.value === value)
    const children = node?.children
    if (!children || children.length === 0) break
    result.push(children)
    list = children
  }
  return result
})

/** 移动端逐级选择：一屏只显示当前这一列；level 保留真实层级，方便定位 a11y id */
const visibleColumns = computed(() => {
  if (!isMobile.value) {
    return columns.value.map((list, level) => ({ level, list }))
  }
  const level = columns.value.length - 1
  return [{ level, list: columns.value[level] ?? [] }]
})

/** 当前操作层级在 columns 里的下标 */
const activeLevel = computed(() => columns.value.length - 1)

const currentOptions = computed(
  () => visibleColumns.value[visibleColumns.value.length - 1]?.list ?? [],
)

const labelsOf = (path: JeCascaderValue): string[] => {
  const labels: string[] = []
  let list = props.options
  for (const value of path) {
    const node = list.find((item) => item.value === value)
    if (!node) break
    labels.push(node.label)
    list = node.children ?? []
  }
  return labels
}

const displayText = computed(() => labelsOf(props.modelValue).join(' / '))

const crumbText = computed(() => labelsOf(activePath.value).join(' / ') || props.placeholder)

const hasValue = computed(() => labelsOf(props.modelValue).length > 0)

const activeDescendant = computed(() => {
  if (!isOpen.value || focusIndex.value < 0) return undefined
  return `${uid}-opt-${activeLevel.value}-${focusIndex.value}`
})

const isSelectedAt = (level: number, option: JeCascaderOption) =>
  activePath.value[level] === option.value

const open = () => {
  sheet.reset()
  zIndex.value = nextZIndex()
  activePath.value = [...props.modelValue]
  isOpen.value = true
  const last = activePath.value[activePath.value.length - 1]
  focusIndex.value = currentOptions.value.findIndex((item) => item.value === last)
}

const close = () => {
  if (!isOpen.value) return
  isOpen.value = false
}

const toggle = () => {
  if (props.disabled) return
  isOpen.value ? close() : open()
}

/** 点 / 回车某一项：非叶子继续展开，叶子即提交并关闭 */
const selectOption = (option: JeCascaderOption, level: number) => {
  if (option.disabled) return
  const path = activePath.value.slice(0, level)
  path.push(option.value)
  activePath.value = path
  focusIndex.value = -1

  if (!option.children || option.children.length === 0) {
    emit('update:modelValue', [...path])
    emit('change', [...path])
    close()
  }
}

/** 返回上一级（窄屏逐级选择 / 方向键左） */
const goBack = () => {
  if (activePath.value.length === 0) return
  activePath.value = activePath.value.slice(0, -1)
  focusIndex.value = -1
}

const clear = () => {
  activePath.value = []
  emit('update:modelValue', [])
  emit('clear')
}

const moveFocus = (step: number) => {
  const list = currentOptions.value
  const count = list.length
  if (count === 0) return
  const base = focusIndex.value < 0 ? (step > 0 ? -1 : 0) : focusIndex.value
  let next = base
  for (let index = 0; index < count; index += 1) {
    next = (next + step + count) % count
    const option = list[next]
    if (option && !option.disabled) {
      focusIndex.value = next
      return
    }
  }
}

const currentOption = () => currentOptions.value[focusIndex.value]

const commitFocus = () => {
  const option = currentOption()
  if (option) selectOption(option, activeLevel.value)
}

const onKeydown = (event: KeyboardEvent) => {
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
      moveFocus(event.key === 'ArrowDown' ? 1 : -1)
      break

    case 'ArrowRight':
      if (!isOpen.value) return
      event.preventDefault()
      commitFocus()
      break

    case 'ArrowLeft':
      if (!isOpen.value) return
      event.preventDefault()
      goBack()
      break

    case 'Enter':
    case ' ':
      event.preventDefault()
      if (!isOpen.value) {
        open()
        return
      }
      commitFocus()
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

watch(
  () => props.modelValue,
  (value) => {
    if (!isOpen.value) activePath.value = [...value]
  },
)

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
    class="je-cascader"
    :class="{ 'is-open': isOpen, 'is-disabled': disabled }"
  >
    <div
      ref="triggerRef"
      class="je-cascader__trigger"
      :class="{ 'has-value': hasValue }"
      role="combobox"
      aria-haspopup="listbox"
      :aria-expanded="isOpen"
      :aria-controls="`${uid}-panel`"
      :aria-activedescendant="activeDescendant"
      :tabindex="disabled ? -1 : 0"
      @click="toggle"
      @keydown="onKeydown"
    >
      <span class="je-cascader__label">{{ displayText || placeholder }}</span>
      <button
        v-if="clearable && hasValue && !disabled"
        type="button"
        class="je-cascader__clear"
        aria-label="清除"
        @click.stop="clear"
      >
        <JeIcon name="close" :size="14" />
      </button>
      <span class="je-cascader__arrow" aria-hidden="true" />
    </div>

    <Teleport
      :to="teleportTarget === false ? 'body' : teleportTarget"
      :disabled="!isMobile || teleportTarget === false"
    >
      <div
        v-if="isMobile"
        class="je-cascader__scrim"
        :class="{ 'is-open': isOpen }"
        aria-hidden="true"
        @click="close"
      />

      <div
        :id="`${uid}-panel`"
        ref="panelRef"
        class="je-cascader__panel"
        :class="{ 'is-open': isOpen }"
        :style="panelStyle"
        :aria-hidden="!isOpen"
      >
        <div
          v-if="isMobile"
          class="je-cascader__handle"
          aria-hidden="true"
          @pointerdown="sheet.onPointerDown"
          @pointermove="sheet.onPointerMove"
          @pointerup="sheet.onPointerUp"
          @pointercancel="sheet.onPointerUp"
        />

        <div v-if="isMobile" class="je-cascader__head">
          <button
            v-if="activePath.length > 0"
            type="button"
            class="je-cascader__back"
            aria-label="返回上一级"
            @click="goBack"
          >
            <JeIcon name="chevron-left" :size="16" />
          </button>
          <span class="je-cascader__crumb">{{ crumbText }}</span>
        </div>

        <div class="je-cascader__columns">
          <div
            v-for="entry in visibleColumns"
            :key="entry.level"
            class="je-cascader__column"
            role="listbox"
            :aria-label="`第 ${entry.level + 1} 级`"
          >
            <div
              v-for="(option, index) in entry.list"
              :id="`${uid}-opt-${entry.level}-${index}`"
              :key="option.value"
              class="je-cascader__option"
              :class="{
                'is-active': entry.level === activeLevel && index === focusIndex,
                'is-path': isSelectedAt(entry.level, option),
                'is-disabled': option.disabled,
              }"
              role="option"
              :aria-selected="isSelectedAt(entry.level, option)"
              :aria-disabled="option.disabled"
              @click="selectOption(option, entry.level)"
            >
              <span class="je-cascader__option-label">{{ option.label }}</span>
              <JeIcon
                v-if="option.children && option.children.length > 0"
                name="chevron-right"
                :size="14"
                class="je-cascader__option-arrow"
              />
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.je-cascader {
  position: relative;
  font-family: inherit;
  user-select: none;
}

.je-cascader__trigger {
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

.je-cascader__trigger.has-value {
  color: var(--je-text);
}

/* 聚焦与展开共用同一套高亮 */
.je-cascader__trigger:focus-visible,
.je-cascader.is-open .je-cascader__trigger {
  border-color: var(--je-primary);
  background: color-mix(in srgb, var(--je-primary) 12%, transparent);
  box-shadow: 0 8px 24px color-mix(in srgb, var(--je-primary) 25%, transparent);
}

.je-cascader__label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.je-cascader__clear {
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

.je-cascader__clear:hover {
  color: var(--je-text);
  background: var(--je-surface-hover);
}

.je-cascader__arrow {
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

.je-cascader.is-open .je-cascader__arrow {
  margin-top: 4px;
  border-color: var(--je-text);
  transform: rotate(-135deg);
}

.je-cascader.is-disabled .je-cascader__trigger {
  cursor: not-allowed;
  opacity: 0.5;
}

.je-cascader__panel {
  position: fixed;
  z-index: 50;
  box-sizing: border-box;
  padding: 6px;
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

.je-cascader__panel.is-open {
  pointer-events: auto;
  visibility: visible;
  opacity: 1;
  transform: scale(1) translateY(0);
  transition: transform 0.38s var(--je-ease-out-back), opacity 0.24s ease-out;
}

.je-cascader__columns {
  display: flex;
  gap: 4px;
}

.je-cascader__column {
  width: 168px;
  max-height: 236px;
  padding: 2px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--je-border-color) transparent;
}

.je-cascader__column + .je-cascader__column {
  border-left: var(--je-border);
}

.je-cascader__column::-webkit-scrollbar {
  width: 4px;
}

.je-cascader__column::-webkit-scrollbar-thumb {
  background: var(--je-border-color);
  border-radius: 2px;
}

.je-cascader__option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
  font-size: 14px;
  color: var(--je-text-muted);
  border-radius: var(--je-radius-sm);
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}

.je-cascader__option:hover,
.je-cascader__option.is-active {
  color: var(--je-text);
  background: color-mix(in srgb, var(--je-primary) 20%, transparent);
}

.je-cascader__option.is-path {
  font-weight: 600;
  color: var(--je-text);
  background: color-mix(in srgb, var(--je-primary) 35%, transparent);
}

.je-cascader__option.is-disabled {
  cursor: not-allowed;
  opacity: 0.4;
}

.je-cascader__option-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.je-cascader__option-arrow {
  flex-shrink: 0;
  color: var(--je-text-faint);
}

.je-cascader__scrim {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(0, 0, 0, 0.45);
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.28s ease, visibility 0s linear 0.28s;
}

.je-cascader__scrim.is-open {
  opacity: 1;
  visibility: visible;
  transition: opacity 0.28s ease;
}

.je-cascader__handle {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 22px;
  cursor: grab;
  touch-action: none;
}

.je-cascader__handle::before {
  content: '';
  width: 40px;
  height: 4px;
  background: var(--je-border-color);
  border-radius: 999px;
}

.je-cascader__head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 6px 8px;
}

.je-cascader__back {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  color: var(--je-text-muted);
  background: none;
  border: var(--je-border);
  border-radius: var(--je-radius-sm);
  cursor: pointer;
  outline: none;
}

.je-cascader__back:focus-visible {
  outline: 2px solid var(--je-primary);
  outline-offset: 2px;
}

.je-cascader__crumb {
  overflow: hidden;
  font-size: 13px;
  color: var(--je-text-faint);
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 窄屏：面板改成贴底的弹出层，逐级选择一屏一列 */
@media (max-width: 768px) {
  .je-cascader__panel {
    position: fixed;
    top: auto;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 101;
    max-height: 72vh;
    overflow-y: auto;
    padding: 4px 12px calc(14px + env(safe-area-inset-bottom, 0px));
    border-radius: 22px 22px 0 0;
    border-bottom: none;
    transform-origin: bottom center;
    /* 这里不能设 touch-action: none，否则列在触屏上没法滚动；
       拖拽手势的 touch-action 由 .je-cascader__handle 单独承担 */
    transform: translateY(100%);
    transition: transform 0.32s ease-in, opacity 0.2s ease-in, visibility 0s linear 0.32s;
  }

  .je-cascader__panel.is-open {
    transform: translateY(0);
    transition: transform 0.42s var(--je-ease-out-back), opacity 0.24s ease-out;
  }

  .je-cascader__columns {
    display: block;
  }

  .je-cascader__column {
    width: 100%;
    max-height: 52vh;
    padding: 0;
  }

  .je-cascader__column + .je-cascader__column {
    border-left: none;
  }

  .je-cascader__option {
    min-height: 48px;
    padding: 12px 16px;
    font-size: 15px;
  }

  .je-cascader__clear {
    width: 32px;
    height: 32px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .je-cascader__panel,
  .je-cascader__panel.is-open,
  .je-cascader__scrim,
  .je-cascader__arrow {
    transition: none;
  }
}
</style>
