<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import JeIcon from '../JeIcon/JeIcon.vue'
import { useFocusTrap } from '../../core/useFocusTrap'
import { useScrollLock } from '../../core/useScrollLock'
import { useSheetDrag } from '../../core/useSheetDrag'
import { nextZIndex } from '../../core/useZIndex'
import type { JeAreaOption } from './types'
import type { JeTeleportTarget } from '../../core/globalConfig'
import { useTeleportTarget } from '../JeConfigProvider/types'

defineOptions({ name: 'JeArea' })

const props = withDefaults(
  defineProps<{
    /** 已选值，按「省 / 市 / 区」顺序 */
    modelValue?: (string | number)[]
    /** 省市区树形数据 */
    areaList?: JeAreaOption[]
    /** 面板标题 */
    title?: string
    /** 级数，一般 3 级 */
    columnsNum?: number
    /** 未选择时触发按钮上的占位文字 */
    placeholder?: string
    /** 未选择的标签页上的占位文字 */
    columnsPlaceholder?: string
    disabled?: boolean
    confirmText?: string
    cancelText?: string
    showToolbar?: boolean
    visibleItemCount?: number
    itemHeight?: number
    closeOnClickModal?: boolean
    /** 浮层挂载点：选择器或元素；false 表示就地渲染不传送。缺省时按 ConfigProvider → configureJelly → body 回退 */
    teleportTo?: JeTeleportTarget | false
  }>(),
  {
    modelValue: () => [],
    areaList: () => [],
    title: '所在地区',
    columnsNum: 3,
    placeholder: '请选择所在地区',
    columnsPlaceholder: '请选择',
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
  change: [values: (string | number)[]]
  /** 点击确认 */
  confirm: [values: (string | number)[]]
  /** 点击取消或遮罩 */
  cancel: []
}>()

const panelRef = ref<HTMLElement | null>(null)
const scrollerRef = ref<HTMLElement | null>(null)
const isOpen = ref(false)
const activeTab = ref(0)
const zIndex = ref(nextZIndex())

/** 打开期间的临时选择，确认才写回 modelValue */
const pending = ref<(string | number)[]>([])

/** 按「前 level 层已选值」推导第 level 层的候选列表 */
const optionsOf = (values: (string | number)[], level: number): JeAreaOption[] => {
  if (level === 0) return props.areaList
  const parent = optionsOf(values, level - 1).find((option) => option.value === values[level - 1])
  return parent?.children ?? []
}

const currentOptions = computed(() => optionsOf(pending.value, activeTab.value))

const selectedIndex = computed(() => {
  const index = currentOptions.value.findIndex(
    (option) => option.value === pending.value[activeTab.value],
  )
  return index >= 0 ? index : 0
})

/** 把外部传入的值规整成每一层都合法、且尽量保留原选择的数组 */
const normalize = (values: (string | number)[]) => {
  const next: (string | number)[] = []
  for (let level = 0; level < props.columnsNum; level += 1) {
    const options = optionsOf(next, level)
    const found = options.find((option) => option.value === values[level])
    next.push(found ? found.value : (options[0]?.value ?? ''))
  }
  return next
}

const tabLabels = computed(() =>
  Array.from({ length: props.columnsNum }, (_, level) => {
    const option = optionsOf(pending.value, level).find(
      (item) => item.value === pending.value[level],
    )
    return { text: option?.text ?? '', selected: Boolean(option) }
  }),
)

const triggerLabel = computed(() => {
  const parts: string[] = []
  for (let level = 0; level < props.columnsNum; level += 1) {
    const option = optionsOf(props.modelValue, level).find(
      (item) => item.value === props.modelValue[level],
    )
    if (option) parts.push(option.text)
  }
  return parts.join(' / ')
})

const hasValue = computed(() => triggerLabel.value !== '')

const scrollerStyle = computed(() => ({ height: `${props.itemHeight * props.visibleItemCount}px` }))
const spacerStyle = computed(() => ({
  height: `${(props.itemHeight * (props.visibleItemCount - 1)) / 2}px`,
}))
const itemStyle = computed(() => ({ height: `${props.itemHeight}px` }))
const indicatorStyle = computed(() => ({
  top: spacerStyle.value.height,
  height: `${props.itemHeight}px`,
}))

const syncScroll = () => {
  const el = scrollerRef.value
  if (el) el.scrollTop = selectedIndex.value * props.itemHeight
}

/** 选中某一层后，把更深的层重置为该分支下的第一项 */
const resetDeeper = (base: (string | number)[], level: number) => {
  const next = [...base]
  for (let i = level + 1; i < props.columnsNum; i += 1) {
    const options = optionsOf(next, i)
    next[i] = options[0]?.value ?? ''
  }
  return next
}

let scrollTimer = 0

const onScroll = (event: Event) => {
  const el = event.currentTarget as HTMLElement
  window.clearTimeout(scrollTimer)
  scrollTimer = window.setTimeout(() => {
    const level = activeTab.value
    const option = currentOptions.value[Math.round(el.scrollTop / props.itemHeight)]
    if (!option || option.value === pending.value[level]) return
    const next = [...pending.value]
    next[level] = option.value
    pending.value = resetDeeper(next, level)
    emit('change', [...pending.value])
  }, 120)
}

const selectIndex = (index: number) => {
  const option = currentOptions.value[index]
  if (!option) return
  const level = activeTab.value
  const el = scrollerRef.value
  if (el) el.scrollTo({ top: index * props.itemHeight, behavior: 'smooth' })
  const next = [...pending.value]
  next[level] = option.value
  pending.value = resetDeeper(next, level)
  emit('change', [...pending.value])
}

const switchTab = (level: number) => {
  activeTab.value = level
  nextTick(syncScroll)
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
  pending.value = normalize(props.modelValue)
  // 默认落在第一个还没选的层，减少一次点击
  const firstEmpty = pending.value.findIndex((_, level) => pending.value[level] === undefined)
  activeTab.value = firstEmpty > 0 ? firstEmpty : 0
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
  emit('confirm', [...pending.value])
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

watch(currentOptions, () => {
  nextTick(syncScroll)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  window.clearTimeout(scrollTimer)
})
</script>

<template>
  <div class="je-area" :class="{ 'is-open': isOpen, 'is-disabled': disabled }">
    <button
      type="button"
      class="je-area__trigger"
      :class="{ 'has-value': hasValue }"
      :disabled="disabled"
      aria-haspopup="dialog"
      :aria-expanded="isOpen"
      @click="toggle"
    >
      <span class="je-area__label">{{ triggerLabel || placeholder }}</span>
      <JeIcon class="je-area__arrow" name="chevron-down" :size="16" />
    </button>

    <Teleport :to="teleportTarget === false ? 'body' : teleportTarget" :disabled="teleportTarget === false">
      <div class="je-area__sheet" :class="{ 'is-open': isOpen }" :style="{ zIndex }">
        <div class="je-area__scrim" aria-hidden="true" @click="onScrimClick" />

        <div
          ref="panelRef"
          class="je-area__panel"
          :style="panelStyle"
          role="dialog"
          aria-modal="true"
          :aria-label="title || '地区选择'"
          :aria-hidden="!isOpen"
        >
          <div
            class="je-area__handle"
            aria-hidden="true"
            @pointerdown="sheet.onPointerDown"
            @pointermove="sheet.onPointerMove"
            @pointerup="sheet.onPointerUp"
            @pointercancel="sheet.onPointerUp"
          />

          <div v-if="showToolbar" class="je-area__toolbar">
            <button type="button" class="je-area__toolbar-btn" @click="onCancel">
              {{ cancelText }}
            </button>
            <h2 class="je-area__title">{{ title }}</h2>
            <button
              type="button"
              class="je-area__toolbar-btn je-area__toolbar-btn--confirm"
              @click="onConfirm"
            >
              {{ confirmText }}
            </button>
          </div>

          <div class="je-area__tabs" role="tablist">
            <button
              v-for="(tab, level) in tabLabels"
              :key="level"
              type="button"
              class="je-area__tab"
              :class="{ 'is-active': level === activeTab, 'has-value': tab.selected }"
              role="tab"
              :aria-selected="level === activeTab"
              @click="switchTab(level)"
            >
              {{ tab.selected ? tab.text : columnsPlaceholder }}
            </button>
          </div>

          <div class="je-area__wheel" :style="scrollerStyle">
            <div class="je-area__indicator" :style="indicatorStyle" aria-hidden="true" />

            <div
              ref="scrollerRef"
              class="je-area__scroller"
              :style="scrollerStyle"
              role="listbox"
              @scroll="onScroll"
            >
              <div class="je-area__spacer" :style="spacerStyle" aria-hidden="true" />

              <button
                v-for="(option, index) in currentOptions"
                :key="option.value"
                type="button"
                class="je-area__item"
                :class="{ 'is-selected': index === selectedIndex }"
                :style="itemStyle"
                role="option"
                :aria-selected="index === selectedIndex"
                @click="selectIndex(index)"
              >
                {{ option.text }}
              </button>

              <div class="je-area__spacer" :style="spacerStyle" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.je-area {
  position: relative;
  font-family: inherit;
}

.je-area__trigger {
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

.je-area__trigger.has-value {
  color: var(--je-text);
}

.je-area__trigger:focus-visible,
.je-area.is-open .je-area__trigger {
  border-color: var(--je-primary);
  background: color-mix(in srgb, var(--je-primary) 12%, transparent);
  box-shadow: 0 8px 24px color-mix(in srgb, var(--je-primary) 25%, transparent);
}

.je-area__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.je-area__arrow {
  flex-shrink: 0;
  transition: transform var(--je-duration) ease;
}

.je-area.is-open .je-area__arrow {
  transform: rotate(180deg);
}

.je-area.is-disabled .je-area__trigger {
  cursor: not-allowed;
  opacity: 0.5;
}

/* 浮层容器铺满视口，收起时必须放行点击 */
.je-area__sheet {
  position: fixed;
  inset: 0;
  pointer-events: none;
}

.je-area__sheet.is-open {
  pointer-events: auto;
}

.je-area__scrim {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.28s ease, visibility 0s linear 0.28s;
}

.je-area__sheet.is-open .je-area__scrim {
  opacity: 1;
  visibility: visible;
  transition: opacity 0.28s ease;
}

.je-area__panel {
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

.je-area__sheet.is-open .je-area__panel {
  pointer-events: auto;
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
  transition: transform 0.42s var(--je-ease-out-back), opacity 0.24s ease-out;
}

.je-area__handle {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  height: 22px;
  cursor: grab;
  /* 抓手是独立手势元素，可以独占 touch-action；滚轮列本身不能设 */
  touch-action: none;
}

.je-area__handle::before {
  content: '';
  width: 40px;
  height: 4px;
  background: var(--je-border-color);
  border-radius: 999px;
}

.je-area__toolbar {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 4px 6px 6px;
}

.je-area__title {
  flex: 1 1 auto;
  margin: 0;
  overflow: hidden;
  font-size: 16px;
  font-weight: 700;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.je-area__toolbar-btn {
  flex-shrink: 0;
  min-width: 56px;
  min-height: 40px;
  padding: 8px 12px;
  font-family: inherit;
  font-size: 15px;
  color: var(--je-text-muted);
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: var(--je-radius-sm);
  outline: none;
  transition: color var(--je-duration) ease, background var(--je-duration) ease;
}

.je-area__toolbar-btn:hover {
  background: var(--je-surface-hover);
}

.je-area__toolbar-btn:focus-visible {
  outline: 2px solid var(--je-primary);
  outline-offset: 2px;
}

.je-area__toolbar-btn--confirm {
  font-weight: 600;
  color: var(--je-primary);
}

.je-area__tabs {
  display: flex;
  flex-shrink: 0;
  gap: 4px;
  padding: 0 4px 8px;
}

.je-area__tab {
  flex: 1 1 0;
  min-width: 0;
  min-height: 36px;
  padding: 6px 8px;
  overflow: hidden;
  font-family: inherit;
  font-size: 14px;
  color: var(--je-text-faint);
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: var(--je-radius-sm);
  outline: none;
  transition: color var(--je-duration) ease, background var(--je-duration) ease;
}

.je-area__tab.has-value {
  color: var(--je-text);
}

.je-area__tab.is-active {
  font-weight: 600;
  color: var(--je-primary);
  background: color-mix(in srgb, var(--je-primary) 14%, transparent);
}

.je-area__tab:focus-visible {
  outline: 2px solid var(--je-primary);
  outline-offset: -2px;
}

.je-area__wheel {
  position: relative;
}

/* 中间选中行的提示条，压在选项下面 */
.je-area__indicator {
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

.je-area__scroller {
  position: relative;
  z-index: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
  scroll-snap-type: y mandatory;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.je-area__scroller::-webkit-scrollbar {
  display: none;
}

.je-area__spacer {
  width: 100%;
}

.je-area__item {
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 100%;
  padding: 0 8px;
  overflow: hidden;
  font-family: inherit;
  font-size: 16px;
  color: var(--je-text-muted);
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  background: transparent;
  border: none;
  outline: none;
  scroll-snap-align: center;
  transition: color var(--je-duration) ease;
}

.je-area__item.is-selected {
  font-weight: 700;
  color: var(--je-text);
}

/*
 * 减弱动效时全部瞬切。
 * 必须把 .is-open 状态类也列进来：它的选择器特异性比单个基础类高，
 * 只写基础类的话状态规则里的 transition 会反压回来，减弱动效实际不生效。
 */
@media (prefers-reduced-motion: reduce) {
  .je-area__scrim,
  .je-area__panel,
  .je-area__arrow,
  .je-area__sheet.is-open .je-area__scrim,
  .je-area__sheet.is-open .je-area__panel {
    transition: none;
  }
}
</style>
