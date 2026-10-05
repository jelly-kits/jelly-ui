<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { loadImage } from '../../core/canvas'
import type { JeWatermarkContent } from './types'

defineOptions({ name: 'JeWatermark' })

const props = withDefaults(
  defineProps<{
    content?: JeWatermarkContent
    image?: string
    width?: number
    height?: number
    rotate?: number
    gapX?: number
    gapY?: number
    fontSize?: number
    /** 水印颜色，留空则跟随当前正文色（明暗主题下都可见） */
    color?: string
    zIndex?: number
  }>(),
  {
    content: () => ['Jelly UI'],
    image: '',
    width: 120,
    height: 64,
    rotate: -22,
    gapX: 100,
    gapY: 100,
    fontSize: 14,
    color: '',
    zIndex: 9,
  },
)

/** 未指定颜色时的兜底：一套中性灰，明暗背景上都留得住痕迹 */
const FALLBACK_COLOR = 'rgb(128, 138, 158)'
/** 跟随正文色时铺开的透明度 */
const FOLLOW_ALPHA = 0.22

/** 解析成 canvas 能吃的颜色：显式 color 优先，否则由宿主的正文色降低透明度得到 */
const resolveColor = () => {
  if (props.color) return props.color
  const host = rootRef.value
  const inherited = host ? getComputedStyle(host).color : FALLBACK_COLOR
  const channels = inherited.match(/rgba?\(([^)]+)\)/)
  if (!channels) return FALLBACK_COLOR
  const [r, g, b] = channels[1].split(',').slice(0, 3).map((part) => part.trim())
  return `rgba(${r}, ${g}, ${b}, ${FOLLOW_ALPHA})`
}

const FONT_FAMILY = '"PingFang SC", "Microsoft YaHei", system-ui, -apple-system, sans-serif'

const rootRef = ref<HTMLElement | null>(null)
const watermarkUrl = ref('')

/** 内容统一成数组，逐行居中绘制 */
const lines = computed(() => {
  const value = props.content
  const list = Array.isArray(value) ? value : [value]
  return list.filter((line) => line !== '')
})

/** 单个平铺块的尺寸 = 水印本体 + 间距 */
const tileWidth = computed(() => props.width + props.gapX)
const tileHeight = computed(() => props.height + props.gapY)

/** 建好画布并铺上公共的 DPR 缩放与旋转 */
const createSurface = () => {
  const ratio = window.devicePixelRatio || 1
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(tileWidth.value * ratio))
  canvas.height = Math.max(1, Math.round(tileHeight.value * ratio))

  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.scale(ratio, ratio)
  ctx.translate(tileWidth.value / 2, tileHeight.value / 2)
  ctx.rotate((props.rotate * Math.PI) / 180)
  return { canvas, ctx }
}

/** 跨域图片可能导致画布被污染，取不到 dataURL 时直接放弃水印 */
const commit = (canvas: HTMLCanvasElement) => {
  try {
    watermarkUrl.value = canvas.toDataURL('image/png')
  } catch {
    watermarkUrl.value = ''
  }
}

const paintText = () => {
  if (lines.value.length === 0) {
    watermarkUrl.value = ''
    return
  }

  const surface = createSurface()
  if (!surface) return
  const { canvas, ctx } = surface

  ctx.fillStyle = resolveColor()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `${props.fontSize}px ${FONT_FAMILY}`

  const lineHeight = props.fontSize * 1.4
  const offsetY = -((lines.value.length - 1) * lineHeight) / 2
  lines.value.forEach((line, index) => {
    ctx.fillText(line, 0, offsetY + index * lineHeight)
  })

  commit(canvas)
}

const paintImage = (image: HTMLImageElement) => {
  const surface = createSurface()
  if (!surface) return
  const { canvas, ctx } = surface

  ctx.drawImage(image, -props.width / 2, -props.height / 2, props.width, props.height)
  commit(canvas)
}

/** 图片水印异步加载：失败（含跨域被拒）时退回文字水印，不让整块水印消失 */
const render = async () => {
  if (typeof document === 'undefined') return

  const src = props.image
  if (!src) {
    paintText()
    return
  }

  const image = await loadImage(src)
  // 加载期间 image 又变了，丢弃这次结果
  if (src !== props.image) return
  if (image) paintImage(image)
  else paintText()
}

let observer: ResizeObserver | null = null

onMounted(() => {
  void render()
  if (typeof ResizeObserver !== 'undefined' && rootRef.value) {
    observer = new ResizeObserver(() => void render())
    observer.observe(rootRef.value)
  }
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})

watch(
  () => [
    props.content,
    props.image,
    props.width,
    props.height,
    props.rotate,
    props.gapX,
    props.gapY,
    props.fontSize,
    props.color,
  ],
  () => void render(),
)

const layerStyle = computed(() => ({
  zIndex: props.zIndex,
  backgroundImage: watermarkUrl.value ? `url("${watermarkUrl.value}")` : undefined,
  backgroundSize: `${tileWidth.value}px ${tileHeight.value}px`,
}))
</script>

<template>
  <div ref="rootRef" class="je-watermark">
    <div class="je-watermark__layer" :style="layerStyle" aria-hidden="true" />
    <div class="je-watermark__content"><slot /></div>
  </div>
</template>

<style scoped>
.je-watermark {
  position: relative;
  box-sizing: border-box;
  font-family: inherit;
}

/* 水印层盖住内容但完全不吃事件，下方内容仍可正常交互 */
.je-watermark__layer {
  position: absolute;
  inset: 0;
  background-repeat: repeat;
  pointer-events: none;
}

.je-watermark__content {
  position: relative;
}
</style>
