<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import { useClickOutside } from '../../core/useClickOutside'
import { useFloating } from '../../core/useFloating'
import { useIsMobile } from '../../core/useMediaQuery'
import { useScrollLock } from '../../core/useScrollLock'
import { useSheetDrag } from '../../core/useSheetDrag'
import { nextZIndex } from '../../core/useZIndex'
import { JeIcon } from '../JeIcon'
import type { JeColorPickerSize } from './types'
import type { JeTeleportTarget } from '../../core/globalConfig'
import { useTeleportTarget } from '../JeConfigProvider/types'

defineOptions({ name: 'JeColorPicker' })

const props = withDefaults(
  defineProps<{
    /** 十六进制颜色，showAlpha 开启时为 8 位 #RRGGBBAA */
    modelValue?: string
    disabled?: boolean
    showAlpha?: boolean
    predefine?: string[]
    size?: JeColorPickerSize
    /** 浮层挂载点：选择器或元素；false 表示就地渲染不传送。缺省时按 ConfigProvider → configureJelly → body 回退 */
    teleportTo?: JeTeleportTarget | false
  }>(),
  {
    modelValue: '#667eea',
    disabled: false,
    showAlpha: false,
    size: 'default',
    teleportTo: undefined,
  },
)

/** 浮层挂载点，缺省时跟随 ConfigProvider / configureJelly，最终落到 body */
const teleportTarget = useTeleportTarget(() => props.teleportTo)

const emit = defineEmits<{
  'update:modelValue': [color: string]
  change: [color: string]
  'active-change': [color: string]
}>()

/* ---------- 颜色换算（纯函数，零依赖） ---------- */

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const hsvToRgb = (h: number, s: number, v: number): [number, number, number] => {
  const c = v * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = v - c
  let r = 0
  let g = 0
  let b = 0
  if (h < 60) [r, g, b] = [c, x, 0]
  else if (h < 120) [r, g, b] = [x, c, 0]
  else if (h < 180) [r, g, b] = [0, c, x]
  else if (h < 240) [r, g, b] = [0, x, c]
  else if (h < 300) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ]
}

const rgbToHex = (r: number, g: number, b: number) =>
  `#${[r, g, b]
    .map((value) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, '0'))
    .join('')}`.toUpperCase()

/** 支持 #RRGGBB 与 #RRGGBBAA，解析失败返回 null */
const hexToRgb = (hex: string): [number, number, number, number] | null => {
  const value = hex.trim().replace(/^#/, '')
  if (!/^[0-9a-f]{6}([0-9a-f]{2})?$/i.test(value)) return null
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
    value.length === 8 ? parseInt(value.slice(6, 8), 16) / 255 : 1,
  ]
}

const rgbToHsv = (r: number, g: number, b: number): [number, number, number] => {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const delta = max - min
  let h = 0
  if (delta !== 0) {
    if (max === rn) h = 60 * (((gn - bn) / delta) % 6)
    else if (max === gn) h = 60 * ((bn - rn) / delta + 2)
    else h = 60 * ((rn - gn) / delta + 4)
  }
  if (h < 0) h += 360
  return [Math.round(h), max === 0 ? 0 : delta / max, max]
}

/* ---------- 状态 ---------- */

const uid = useId()
const rootRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const svRef = ref<HTMLElement | null>(null)
const hueRef = ref<HTMLElement | null>(null)
const alphaRef = ref<HTMLElement | null>(null)

const hue = ref(230)
const sat = ref(0.5)
const val = ref(0.92)
const alpha = ref(1)
const hexDraft = ref('#667EEA')
const isOpen = ref(false)
const zIndex = ref(nextZIndex())

/** 当前拖拽的取色区域；null 表示未在拖拽 */
let draggingTarget: 'sv' | 'hue' | 'alpha' | null = null

const currentRgb = computed(() => hsvToRgb(hue.value, sat.value, val.value))

const currentColor = computed(() => {
  const hex = rgbToHex(currentRgb.value[0], currentRgb.value[1], currentRgb.value[2])
  if (!props.showAlpha) return hex
  return hex + Math.round(clamp(alpha.value, 0, 1) * 255).toString(16).padStart(2, '0').toUpperCase()
})

const hueColor = computed(() => {
  const rgb = hsvToRgb(hue.value, 1, 1)
  return rgbToHex(rgb[0], rgb[1], rgb[2])
})

const hexValid = computed(() => hexToRgb(hexDraft.value) !== null)

const svThumbStyle = computed(() => ({
  left: `${sat.value * 100}%`,
  top: `${(1 - val.value) * 100}%`,
  background: currentColor.value,
}))

const hueThumbStyle = computed(() => ({ left: `${(hue.value / 360) * 100}%` }))
const alphaThumbStyle = computed(() => ({ left: `${clamp(alpha.value, 0, 1) * 100}%` }))

const alphaTrackStyle = computed(() => ({
  backgroundImage: `linear-gradient(to right, transparent, ${rgbToHex(
    currentRgb.value[0],
    currentRgb.value[1],
    currentRgb.value[2],
  )})`,
}))

const applyValue = (value: string) => {
  const parsed = hexToRgb(value)
  if (!parsed) return
  const [r, g, b, a] = parsed
  const [h, s, v] = rgbToHsv(r, g, b)
  // 灰度没有色相信息，保留当前色相，避免滑条无故跳回 0
  if (s > 0) hue.value = h
  sat.value = s
  val.value = v
  if (props.showAlpha) alpha.value = a
}

watch(() => props.modelValue, applyValue, { immediate: true })
watch(currentColor, (value) => {
  hexDraft.value = value
}, { immediate: true })

/* ---------- 面板开合 ---------- */

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

const panelStyle = computed(() => {
  if (!isMobile.value) {
    return { left: `${x.value}px`, top: `${y.value}px`, zIndex: zIndex.value }
  }
  // 收起态交给 CSS 的 translateY(100%)，这里不能写 inline transform，否则会盖掉收起位移
  if (!isOpen.value) return { zIndex: zIndex.value }
  return {
    zIndex: zIndex.value,
    transform: `translateY(${sheet.offset.value}px)`,
    transition: sheet.dragging.value ? 'none' : undefined,
  }
})

const open = () => {
  if (props.disabled) return
  sheet.reset()
  zIndex.value = nextZIndex()
  isOpen.value = true
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

useClickOutside([rootRef, panelRef], () => {
  if (isOpen.value) close()
})

/* ---------- 取色交互 ---------- */

const commit = () => {
  emit('update:modelValue', currentColor.value)
  emit('change', currentColor.value)
}

const pickFromEvent = (event: PointerEvent) => {
  if (draggingTarget === 'sv' && svRef.value) {
    const rect = svRef.value.getBoundingClientRect()
    sat.value = clamp((event.clientX - rect.left) / rect.width, 0, 1)
    val.value = 1 - clamp((event.clientY - rect.top) / rect.height, 0, 1)
  } else if (draggingTarget === 'hue' && hueRef.value) {
    const rect = hueRef.value.getBoundingClientRect()
    hue.value = clamp((event.clientX - rect.left) / rect.width, 0, 1) * 360
  } else if (draggingTarget === 'alpha' && alphaRef.value) {
    const rect = alphaRef.value.getBoundingClientRect()
    alpha.value = clamp((event.clientX - rect.left) / rect.width, 0, 1)
  } else {
    return
  }
  emit('active-change', currentColor.value)
}

const onPointerDown = (target: 'sv' | 'hue' | 'alpha', event: PointerEvent) => {
  if (props.disabled) return
  event.preventDefault()
  draggingTarget = target
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  pickFromEvent(event)
}

const onPointerMove = (event: PointerEvent) => {
  if (!draggingTarget) return
  pickFromEvent(event)
}

const onPointerUp = (event: PointerEvent) => {
  if (!draggingTarget) return
  const el = event.currentTarget as HTMLElement
  if (el.hasPointerCapture(event.pointerId)) el.releasePointerCapture(event.pointerId)
  draggingTarget = null
  commit()
}

const pickPredefine = (color: string) => {
  if (props.disabled) return
  applyValue(color)
  emit('active-change', currentColor.value)
  commit()
}

const onHexInput = (event: Event) => {
  hexDraft.value = (event.target as HTMLInputElement).value
  if (hexToRgb(hexDraft.value)) emit('active-change', hexDraft.value.trim().toUpperCase())
}

const commitHex = () => {
  if (!hexToRgb(hexDraft.value)) {
    hexDraft.value = currentColor.value
    return
  }
  applyValue(hexDraft.value)
  hexDraft.value = currentColor.value
  commit()
}
</script>

<template>
  <div
    ref="rootRef"
    class="je-color-picker"
    :class="[`je-color-picker--${size}`, { 'is-disabled': disabled, 'is-open': isOpen }]"
    @keydown.escape="close"
  >
    <div
      ref="triggerRef"
      class="je-color-picker__trigger"
      role="button"
      :tabindex="disabled ? -1 : 0"
      :aria-label="`选择颜色，当前 ${currentColor}`"
      :aria-expanded="isOpen"
      :aria-controls="`${uid}-panel`"
      @click="toggle"
      @keydown.enter.prevent="toggle"
      @keydown.space.prevent="toggle"
    >
      <span class="je-color-picker__swatch" :style="{ background: currentColor }" aria-hidden="true" />
      <span class="je-color-picker__value">{{ currentColor }}</span>
      <JeIcon name="chevron-down" :size="14" class="je-color-picker__arrow" />
    </div>

    <Teleport
      :to="teleportTarget === false ? 'body' : teleportTarget"
      :disabled="!isMobile || teleportTarget === false"
    >
      <div
        v-if="isMobile"
        class="je-color-picker__scrim"
        :class="{ 'is-open': isOpen }"
        aria-hidden="true"
        @click="close"
      />

      <div
        :id="`${uid}-panel`"
        ref="panelRef"
        class="je-color-picker__panel"
        :class="{ 'is-open': isOpen }"
        :style="panelStyle"
        role="dialog"
        aria-label="颜色选择"
        :aria-hidden="!isOpen"
      >
        <div
          v-if="isMobile"
          class="je-color-picker__handle"
          aria-hidden="true"
          @pointerdown="sheet.onPointerDown"
          @pointermove="sheet.onPointerMove"
          @pointerup="sheet.onPointerUp"
          @pointercancel="sheet.onPointerUp"
        />

        <div
          ref="svRef"
          class="je-color-picker__sv"
          :style="{ '--je-cp-hue': hueColor }"
          @pointerdown="onPointerDown('sv', $event)"
          @pointermove="onPointerMove"
          @pointerup="onPointerUp"
          @pointercancel="onPointerUp"
        >
          <span class="je-color-picker__thumb" :style="svThumbStyle" />
        </div>

        <div
          ref="hueRef"
          class="je-color-picker__hue"
          @pointerdown="onPointerDown('hue', $event)"
          @pointermove="onPointerMove"
          @pointerup="onPointerUp"
          @pointercancel="onPointerUp"
        >
          <span class="je-color-picker__thumb" :style="hueThumbStyle" />
        </div>

        <div
          v-if="showAlpha"
          ref="alphaRef"
          class="je-color-picker__alpha"
          @pointerdown="onPointerDown('alpha', $event)"
          @pointermove="onPointerMove"
          @pointerup="onPointerUp"
          @pointercancel="onPointerUp"
        >
          <span class="je-color-picker__alpha-track" :style="alphaTrackStyle" />
          <span class="je-color-picker__thumb" :style="alphaThumbStyle" />
        </div>

        <div v-if="predefine && predefine.length > 0" class="je-color-picker__predefine">
          <button
            v-for="color in predefine"
            :key="color"
            type="button"
            class="je-color-picker__pre"
            :class="{ 'is-active': currentColor === color.toUpperCase() }"
            :style="{ background: color }"
            :aria-label="`预设颜色 ${color}`"
            @click="pickPredefine(color)"
          />
        </div>

        <div class="je-color-picker__field">
          <span class="je-color-picker__prefix" aria-hidden="true">HEX</span>
          <input
            class="je-color-picker__hex"
            :class="{ 'is-invalid': !hexValid }"
            type="text"
            :value="hexDraft"
            :disabled="disabled"
            aria-label="十六进制颜色值"
            @input="onHexInput"
            @keydown.enter="commitHex"
            @blur="commitHex"
          >
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.je-color-picker {
  display: inline-block;
  font-family: inherit;
}

.je-color-picker__trigger {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 14px;
  color: var(--je-text);
  background: var(--je-surface);
  border: var(--je-border);
  border-radius: var(--je-radius);
  cursor: pointer;
  outline: none;
  transition: border-color var(--je-duration) ease, box-shadow var(--je-duration) ease;
}

.je-color-picker__trigger:hover {
  background: var(--je-surface-hover);
}

.je-color-picker__trigger:focus-visible,
.je-color-picker.is-open .je-color-picker__trigger {
  border-color: var(--je-primary);
  box-shadow: 0 8px 24px color-mix(in srgb, var(--je-primary) 25%, transparent);
}

.je-color-picker--small .je-color-picker__trigger {
  padding: 5px 10px;
  font-size: 13px;
}

.je-color-picker--large .je-color-picker__trigger {
  padding: 11px 14px;
  font-size: 15px;
}

.je-color-picker__swatch {
  box-sizing: border-box;
  width: 18px;
  height: 18px;
  border: 1px solid var(--je-border-color);
  border-radius: 5px;
}

.je-color-picker--large .je-color-picker__swatch {
  width: 22px;
  height: 22px;
}

.je-color-picker__value {
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
}

.je-color-picker__arrow {
  color: var(--je-text-faint);
  transition: transform var(--je-duration) var(--je-ease-overshoot);
}

.je-color-picker.is-open .je-color-picker__arrow {
  transform: rotate(180deg);
}

.je-color-picker.is-disabled .je-color-picker__trigger {
  cursor: not-allowed;
  opacity: 0.5;
}

/* 面板常驻 DOM，收起态只用 visibility，过渡才不会被 display 打断 */
.je-color-picker__panel {
  position: fixed;
  z-index: 2000;
  box-sizing: border-box;
  width: 240px;
  padding: 12px;
  font-family: inherit;
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
  transform: scale(0.94) translateY(-6px);
  transition: transform 0.26s ease-in, opacity 0.2s ease-in, visibility 0s linear 0.26s;
}

.je-color-picker__panel.is-open {
  pointer-events: auto;
  opacity: 1;
  visibility: visible;
  transform: scale(1) translateY(0);
  transition: transform 0.36s var(--je-ease-out-back), opacity 0.22s ease-out;
}

/* 饱和度 / 明度二维网格 */
.je-color-picker__sv {
  position: relative;
  height: 140px;
  margin-bottom: 10px;
  background:
    linear-gradient(to top, #000, transparent),
    linear-gradient(to right, #fff, transparent),
    var(--je-cp-hue, #f00);
  border-radius: var(--je-radius-sm);
  cursor: crosshair;
  /* 取色面必须自己吃掉触摸手势，避免拖动时页面跟着滚 */
  touch-action: none;
}

.je-color-picker__hue {
  position: relative;
  height: 12px;
  margin-bottom: 10px;
  background: linear-gradient(
    to right,
    #f00 0%,
    #ff0 17%,
    #0f0 33%,
    #0ff 50%,
    #00f 67%,
    #f0f 83%,
    #f00 100%
  );
  border-radius: 999px;
  cursor: pointer;
  touch-action: none;
}

.je-color-picker__alpha {
  position: relative;
  height: 12px;
  margin-bottom: 10px;
  background-color: transparent;
  background-image: repeating-conic-gradient(rgba(255, 255, 255, 0.35) 0 25%, transparent 0 50%);
  background-size: 12px 12px;
  border-radius: 999px;
  cursor: pointer;
  touch-action: none;
}

.je-color-picker__alpha-track {
  position: absolute;
  inset: 0;
  border-radius: 999px;
}

/* 取色点 */
.je-color-picker__thumb {
  position: absolute;
  top: 50%;
  box-sizing: border-box;
  width: 12px;
  height: 12px;
  border: 2px solid #fff;
  border-radius: 50%;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.35);
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.je-color-picker__sv .je-color-picker__thumb {
  top: 0;
  left: 0;
}

.je-color-picker__predefine {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 6px;
  margin-bottom: 10px;
}

.je-color-picker__pre {
  box-sizing: border-box;
  width: 100%;
  aspect-ratio: 1;
  padding: 0;
  border: 1px solid var(--je-border-color);
  border-radius: 5px;
  cursor: pointer;
  transition: transform var(--je-duration) var(--je-ease-overshoot);
}

.je-color-picker__pre:hover {
  transform: scale(1.15);
}

.je-color-picker__pre.is-active {
  border-color: var(--je-text);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--je-primary) 45%, transparent);
}

.je-color-picker__field {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  background: var(--je-surface);
  border: var(--je-border);
  border-radius: var(--je-radius-sm);
}

.je-color-picker__prefix {
  font-size: 11px;
  font-weight: 700;
  color: var(--je-text-faint);
}

.je-color-picker__hex {
  flex: 1;
  min-width: 0;
  padding: 0;
  font-family: inherit;
  font-size: 13px;
  color: var(--je-text);
  background: none;
  border: none;
  outline: none;
}

.je-color-picker__hex.is-invalid {
  color: var(--je-danger);
}

.je-color-picker__scrim {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgba(0, 0, 0, 0.45);
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.28s ease, visibility 0s linear 0.28s;
}

.je-color-picker__scrim.is-open {
  opacity: 1;
  visibility: visible;
  transition: opacity 0.28s ease;
}

.je-color-picker__handle {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 22px;
  cursor: grab;
  touch-action: none;
}

.je-color-picker__handle::before {
  content: '';
  width: 40px;
  height: 4px;
  background: var(--je-border-color);
  border-radius: 999px;
}

/* 窄屏：底部弹出层，预留安全区；面板本身不设 touch-action，内部滚动不受影响 */
@media (max-width: 768px) {
  .je-color-picker__panel {
    top: auto;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 2001;
    width: 100%;
    padding: 4px 16px calc(16px + env(safe-area-inset-bottom, 0px));
    border-radius: 22px 22px 0 0;
    border-bottom: none;
    transform-origin: bottom center;
    transform: translateY(100%);
    transition: transform 0.32s ease-in, opacity 0.2s ease-in, visibility 0s linear 0.32s;
  }

  .je-color-picker__panel.is-open {
    transform: translateY(0);
    transition: transform 0.42s var(--je-ease-out-back), opacity 0.24s ease-out;
  }

  .je-color-picker__sv {
    height: 160px;
  }

  .je-color-picker__hue,
  .je-color-picker__alpha {
    height: 18px;
  }

  .je-color-picker__pre {
    min-height: 32px;
  }

  .je-color-picker__trigger {
    min-height: 44px;
  }

  /* 触屏没有 hover，预设色的放缩反馈交给按下态 */
  .je-color-picker__pre:hover {
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .je-color-picker__trigger,
  .je-color-picker__arrow,
  .je-color-picker__panel,
  .je-color-picker__panel.is-open,
  .je-color-picker__scrim,
  .je-color-picker__pre {
    transition: none;
  }
}
</style>
