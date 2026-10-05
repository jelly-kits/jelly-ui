<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import JeButton from '../JeButton/JeButton.vue'
import { useJeLocale } from '../JeLocale'

defineOptions({ name: 'JeSignature' })

const props = withDefaults(
  defineProps<{
    /** 画笔颜色 */
    penColor?: string
    /** 画笔粗细，单位 px */
    lineWidth?: number
    /** 画布背景色，空字符串表示透明底 */
    backgroundColor?: string
    /** 画布高度，数字按 px 处理 */
    height?: number | string
    /** 禁用：不接收绘制 */
    disabled?: boolean
    /** 导出图片格式 */
    type?: 'png' | 'jpeg'
    /** 未书写时的提示文字，缺省取语言包 signature.tip */
    tips?: string
    /** 清空按钮文字，缺省取语言包 signature.clear */
    clearText?: string
    /** 撤销按钮文字，缺省取语言包 signature.undo */
    undoText?: string
    /** 是否显示底部工具栏 */
    showToolbar?: boolean
  }>(),
  {
    penColor: '#ffffff',
    lineWidth: 2,
    backgroundColor: '',
    height: 200,
    disabled: false,
    type: 'png',
    tips: undefined,
    clearText: undefined,
    undoText: undefined,
    showToolbar: true,
  },
)

const emit = defineEmits<{
  /** 开始一笔 */
  start: []
  /** 一笔结束 */
  end: []
  /** 存储变化时派发，回传画布是否为空，可用于判断能否提交 */
  change: [isEmpty: boolean]
  /** 画布被清空 */
  clear: []
}>()

const { t } = useJeLocale()

const wrapRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

const tipText = computed(() => props.tips ?? t('signature.tip'))
const clearLabel = computed(() => props.clearText ?? t('signature.clear'))
const undoLabel = computed(() => props.undoText ?? t('signature.undo'))

const heightStyle = computed(() =>
  typeof props.height === 'number' ? `${props.height}px` : props.height,
)

interface StrokePoint {
  x: number
  y: number
}

/** 历史笔画，只存坐标；重绘时用当前画笔参数描出来 */
const strokes = ref<StrokePoint[][]>([])
/** 画布为空：用于提示文字显隐与工具栏按钮禁用 */
const empty = computed(() => strokes.value.length === 0)

/** 画布 CSS 尺寸与 DPR，重绘时按它们还原坐标系 */
let viewWidth = 0
let viewHeight = 0
let dpr = 1

let current: StrokePoint[] | null = null
let activePointerId = -1
let observer: ResizeObserver | null = null

const context = (): CanvasRenderingContext2D | null => canvasRef.value?.getContext('2d') ?? null

/** 非空才铺底色，空字符串即透明 */
const paintBackground = (ctx: CanvasRenderingContext2D) => {
  if (!props.backgroundColor) return
  ctx.fillStyle = props.backgroundColor
  ctx.fillRect(0, 0, viewWidth, viewHeight)
}

/** 每次绘制前重置画笔样式，避免被上一次的调用污染 */
const applyBrush = (ctx: CanvasRenderingContext2D) => {
  ctx.strokeStyle = props.penColor
  ctx.fillStyle = props.penColor
  ctx.lineWidth = props.lineWidth
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
}

/** 整屏重绘：尺寸变化 / 撤销 / 清空 / 改画笔参数时复用 */
const redraw = () => {
  const ctx = context()
  if (!ctx) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, viewWidth, viewHeight)
  paintBackground(ctx)
  applyBrush(ctx)

  for (const stroke of strokes.value) {
    const first = stroke[0]
    if (!first) continue
    if (stroke.length === 1) {
      // 单点落笔也要可见，lineCap=round 画不出点，这里用圆填充
      ctx.beginPath()
      ctx.arc(first.x, first.y, Math.max(props.lineWidth / 2, 0.5), 0, Math.PI * 2)
      ctx.fill()
      continue
    }
    ctx.beginPath()
    ctx.moveTo(first.x, first.y)
    for (let i = 1; i < stroke.length; i += 1) {
      const point = stroke[i]
      if (point) ctx.lineTo(point.x, point.y)
    }
    ctx.stroke()
  }
}

/** 按容器尺寸与 DPR 重置画布位图，重置后必须重绘（设置宽高会清空上下文） */
const resizeCanvas = () => {
  const canvas = canvasRef.value
  const wrap = wrapRef.value
  if (!canvas || !wrap) return
  const width = wrap.clientWidth
  const height = wrap.clientHeight
  if (width <= 0 || height <= 0) return

  viewWidth = width
  viewHeight = height
  dpr = (typeof window !== 'undefined' ? window.devicePixelRatio : 1) || 1
  canvas.width = Math.round(width * dpr)
  canvas.height = Math.round(height * dpr)
  redraw()
}

const pointFrom = (event: PointerEvent): StrokePoint => {
  const canvas = canvasRef.value
  if (!canvas) return { x: 0, y: 0 }
  const rect = canvas.getBoundingClientRect()
  return { x: event.clientX - rect.left, y: event.clientY - rect.top }
}

const onPointerDown = (event: PointerEvent) => {
  if (props.disabled || current) return
  // 鼠标只认左键；触屏与手写笔的 button 恒为 0
  if (event.pointerType === 'mouse' && event.button !== 0) return
  const canvas = canvasRef.value
  if (!canvas) return

  canvas.setPointerCapture(event.pointerId)
  activePointerId = event.pointerId
  current = [pointFrom(event)]
  strokes.value.push(current)
  // 单点落笔先整屏重绘一次，让圆点立刻出现
  redraw()
  emit('start')
}

const onPointerMove = (event: PointerEvent) => {
  if (!current || event.pointerId !== activePointerId) return
  const ctx = context()
  if (!ctx) return
  const previous = current[current.length - 1]
  const point = pointFrom(event)
  current.push(point)
  if (!previous) return
  // 增量绘制：只补最后一段，长笔画也不卡
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  applyBrush(ctx)
  ctx.beginPath()
  ctx.moveTo(previous.x, previous.y)
  ctx.lineTo(point.x, point.y)
  ctx.stroke()
}

const onPointerUp = (event: PointerEvent) => {
  if (!current || event.pointerId !== activePointerId) return
  const canvas = canvasRef.value
  if (canvas?.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId)
  current = null
  activePointerId = -1
  emit('end')
  emit('change', empty.value)
}

/** 撤销最后一笔后整屏重绘 */
const undo = () => {
  if (strokes.value.length === 0) return
  strokes.value.pop()
  current = null
  redraw()
  emit('change', empty.value)
}

/** 清空历史与画布 */
const clear = () => {
  strokes.value = []
  current = null
  redraw()
  emit('clear')
  emit('change', true)
}

/** 画布是否为空 */
const isEmpty = () => empty.value

/** 导出 dataURL，不传则用 props.type */
const toDataURL = (type?: 'png' | 'jpeg') => {
  const canvas = canvasRef.value
  if (!canvas) return ''
  const format = type ?? props.type
  if (format === 'png') return canvas.toDataURL('image/png')
  // jpeg 不支持透明，先铺一层底再导出，否则透明处会变黑
  const offscreen = document.createElement('canvas')
  offscreen.width = canvas.width
  offscreen.height = canvas.height
  const ctx = offscreen.getContext('2d')
  if (!ctx) return canvas.toDataURL('image/jpeg')
  ctx.fillStyle = props.backgroundColor || '#ffffff'
  ctx.fillRect(0, 0, offscreen.width, offscreen.height)
  ctx.drawImage(canvas, 0, 0)
  return offscreen.toDataURL('image/jpeg')
}

/** 一次性拿到空状态与导出图，便于父级提交 */
const getResult = () => ({ isEmpty: empty.value, dataUrl: toDataURL() })

/** 导出为文件下载 */
const download = () => {
  const url = toDataURL()
  if (!url) return
  const link = document.createElement('a')
  link.href = url
  link.download = `signature-${Date.now()}.${props.type === 'jpeg' ? 'jpg' : 'png'}`
  link.click()
}

watch(
  () => [props.penColor, props.lineWidth, props.backgroundColor],
  () => redraw(),
)

onMounted(() => {
  resizeCanvas()
  if (typeof ResizeObserver !== 'undefined' && wrapRef.value) {
    observer = new ResizeObserver(resizeCanvas)
    observer.observe(wrapRef.value)
  }
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})

defineExpose({
  /** 清空画布与笔画历史 */
  clear,
  /** 撤销最后一笔 */
  undo,
  /** 导出 dataURL */
  toDataURL,
  /** 画布是否为空 */
  isEmpty,
  /** 导出结果 { isEmpty, dataUrl } */
  getResult,
})
</script>

<template>
  <div class="je-signature" :class="{ 'is-disabled': disabled }">
    <div ref="wrapRef" class="je-signature__board" :style="{ height: heightStyle }">
      <canvas
        ref="canvasRef"
        class="je-signature__canvas"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
      />
      <span v-if="empty" class="je-signature__tip">{{ tipText }}</span>
    </div>

    <div v-if="showToolbar" class="je-signature__toolbar">
      <JeButton
        size="small"
        variant="ghost"
        icon="undo"
        :disabled="disabled || empty"
        @click="undo"
      >
        {{ undoLabel }}
      </JeButton>
      <JeButton
        size="small"
        variant="ghost"
        icon="trash"
        :disabled="disabled || empty"
        @click="clear"
      >
        {{ clearLabel }}
      </JeButton>
      <JeButton
        size="small"
        variant="ghost"
        icon="download"
        :disabled="disabled || empty"
        @click="download"
      >
        导出
      </JeButton>
    </div>

    <div v-if="$slots.footer" class="je-signature__footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<style scoped>
.je-signature {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  font-family: inherit;
}

.je-signature__board {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  overflow: hidden;
  /* 深色底衬，白色画笔在上面才看得清；canvas 透明处会透出这层 */
  background: var(--je-surface);
  border: var(--je-border);
  border-radius: var(--je-radius);
  /* 画布是手势区，禁掉浏览器默认滚动 / 缩放手势（本组件唯一的例外） */
  touch-action: none;
}

.je-signature__canvas {
  display: block;
  width: 100%;
  height: 100%;
  cursor: crosshair;
  touch-action: none;
}

.je-signature__tip {
  position: absolute;
  top: 50%;
  left: 50%;
  padding: 0 12px;
  font-size: 14px;
  line-height: 1.4;
  color: var(--je-text-faint);
  text-align: center;
  transform: translate(-50%, -50%);
  pointer-events: none;
  user-select: none;
}

.je-signature__toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.je-signature.is-disabled {
  opacity: 0.5;
}

.je-signature.is-disabled .je-signature__canvas {
  cursor: not-allowed;
  pointer-events: none;
}

@media (max-width: 768px) {
  .je-signature__toolbar :deep(.je-button) {
    flex: 1 1 0;
    min-height: 44px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .je-signature__toolbar :deep(.je-button) {
    transition: none;
  }
}
</style>