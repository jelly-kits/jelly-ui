<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useSlots, watch } from 'vue'
import { loadImage } from '../../core/canvas'
import JeQrcode from '../JeQrcode/JeQrcode.vue'
import { collectPosterImages, resolvePoster } from './layout'
import { paintPoster } from './paint'
import type {
  JePosterBackground,
  JePosterBox,
  JePosterElement,
  JePosterExportOptions,
  JePosterImageBox,
  JePosterTextBox,
} from './types'

defineOptions({ name: 'JePoster' })

const props = withDefaults(
  defineProps<{
    /** 设计稿宽度（px），元素坐标 / 尺寸 / 字号都按这个口径书写 */
    width?: number
    /** 设计稿高度（px） */
    height?: number
    /** 背景：底色 + 可选背景图 */
    background?: JePosterBackground
    /** 元素列表，按数组顺序叠放 */
    elements?: JePosterElement[]
    /** 渲染方式：canvas 所见即所得（默认，与导出一致）；dom 为真实 DOM 预览，可用同名具名插槽替换元素（插槽不影响导出） */
    mode?: 'canvas' | 'dom'
    /** 海报圆角（设计稿 px） */
    radius?: number
    /** 无障碍描述 */
    label?: string
  }>(),
  {
    width: 750,
    height: 1334,
    background: () => ({}),
    elements: () => [],
    mode: 'canvas',
    radius: 0,
    label: '海报',
  },
)

const slots = useSlots()
const rootRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

/** DOM 预览的缩放比：设计稿 → 容器宽度 */
const scale = ref(1)
/** 绘制用的图片表（key = 地址；失败为 null，绘制时跳过） */
const imageMap = new Map<string, HTMLImageElement | null>()

/** 一份配置 → 一组绝对定位盒子；两种渲染模式与导出共用 */
const boxes = computed(() => resolvePoster(props.width, props.elements))

const rootStyle = computed(() => ({
  aspectRatio: `${props.width} / ${props.height}`,
  borderRadius: props.radius > 0 ? `${props.radius}px` : undefined,
}))

const stageStyle = computed(() => ({
  width: `${props.width}px`,
  height: `${props.height}px`,
  transform: `scale(${scale.value})`,
  borderRadius: props.radius > 0 ? `${props.radius}px` : undefined,
}))

const backgroundStyle = computed(() => {
  const fit = props.background.fit ?? 'cover'
  return {
    backgroundColor: props.background.color ?? 'transparent',
    backgroundImage: props.background.src ? `url("${props.background.src}")` : undefined,
    backgroundSize: fit === 'fill' ? '100% 100%' : fit,
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  }
})

const boxStyle = (box: JePosterBox) => ({
  left: `${box.x}px`,
  top: `${box.y}px`,
  width: `${box.width}px`,
  height: `${box.height}px`,
  opacity: box.opacity,
})

const textStyle = (box: JePosterTextBox) => ({
  ...boxStyle(box),
  fontSize: `${box.fontSize}px`,
  fontWeight: box.fontWeight,
  fontFamily: box.fontFamily,
  color: box.color,
  textAlign: box.align,
})

const imageStyle = (box: JePosterImageBox) => {
  const width = Math.max(0, box.element.border?.width ?? 0)
  return {
    objectFit: box.element.fit ?? 'cover',
    borderRadius: `${Math.max(0, box.radius - width)}px`,
    border: width > 0 ? `${width}px solid ${box.element.border?.color ?? '#ffffff'}` : undefined,
  }
}

/** 按需加载海报用到的全部图片（loadImage 自带缓存，重复调用很轻） */
const ensureImages = async (): Promise<Map<string, HTMLImageElement | null>> => {
  const missing = collectPosterImages(props.background, props.elements).filter(
    (src) => !imageMap.has(src),
  )
  if (missing.length) {
    const loaded = await Promise.all(
      missing.map(async (src) => [src, await loadImage(src)] as const),
    )
    for (const [src, image] of loaded) imageMap.set(src, image)
  }
  return imageMap
}

let renderToken = 0

/** Canvas 模式：按容器尺寸 × DPR 建位图，再按设计稿比例缩放上下文 */
const paint = async () => {
  if (props.mode !== 'canvas') return
  const canvas = canvasRef.value
  const root = rootRef.value
  if (!canvas || !root) return
  const cssWidth = root.clientWidth
  const cssHeight = root.clientHeight
  if (!cssWidth || !cssHeight) return

  const token = (renderToken += 1)
  const images = await ensureImages()
  if (token !== renderToken) return

  const dpr = window.devicePixelRatio || 1
  const outWidth = Math.max(1, Math.round(cssWidth * dpr))
  const outHeight = Math.max(1, Math.round(cssHeight * dpr))
  canvas.width = outWidth
  canvas.height = outHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.scale(outWidth / props.width, outHeight / props.height)
  paintPoster(ctx, {
    width: props.width,
    height: props.height,
    background: props.background,
    boxes: boxes.value,
    images,
    host: root,
  })
}

/** 离屏绘制一张海报位图（导出走这里，与预览同一条绘制链） */
const exportCanvas = async (
  options: JePosterExportOptions,
): Promise<HTMLCanvasElement | null> => {
  const designWidth = props.width
  const designHeight = props.height
  const outWidth = Math.max(1, Math.round(options.width ?? designWidth))
  const outHeight = Math.max(
    1,
    Math.round(
      options.height ?? (options.width ? (options.width / designWidth) * designHeight : designHeight),
    ),
  )

  const canvas = document.createElement('canvas')
  canvas.width = outWidth
  canvas.height = outHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const images = await ensureImages()
  ctx.scale(outWidth / designWidth, outHeight / designHeight)
  paintPoster(ctx, {
    width: designWidth,
    height: designHeight,
    background: props.background,
    boxes: boxes.value,
    images,
    host: rootRef.value,
  })
  return canvas
}

const updateScale = () => {
  const root = rootRef.value
  if (!root || !props.width) return
  scale.value = root.clientWidth / props.width || 1
}

/** 插槽只在 DOM 预览里生效，canvas 模式给一次提示，避免“改了没反应” */
const warnedSlots = new Set<string>()
const warnSlots = () => {
  if (props.mode !== 'canvas') return
  for (const element of props.elements) {
    const name = element.name
    if (!name || warnedSlots.has(name) || !slots[name]) continue
    warnedSlots.add(name)
    console.warn(
      `[JePoster] 具名插槽 "${name}" 只在 mode="dom" 的预览里生效，导出始终按 elements 配置绘制。`,
    )
  }
}

defineExpose({
  /** 导出为图片 dataURL（默认 PNG），与预览同一条绘制链 */
  toDataURL: async (options: JePosterExportOptions = {}): Promise<string> => {
    const canvas = await exportCanvas(options)
    if (!canvas) return ''
    const type = options.type ?? 'image/png'
    return options.quality === undefined
      ? canvas.toDataURL(type)
      : canvas.toDataURL(type, options.quality)
  },
  /** 导出为 Blob（适合上传 / File 场景），失败返回 null */
  toBlob: async (options: JePosterExportOptions = {}): Promise<Blob | null> => {
    const canvas = await exportCanvas(options)
    if (!canvas) return null
    const type = options.type ?? 'image/png'
    return new Promise<Blob | null>((resolve) => {
      if (options.quality === undefined) canvas.toBlob((blob) => resolve(blob), type)
      else canvas.toBlob((blob) => resolve(blob), type, options.quality)
    })
  },
  /** 导出并触发浏览器下载，filename 缺省为 poster.png */
  download: async (filename = 'poster.png', options: JePosterExportOptions = {}): Promise<void> => {
    const canvas = await exportCanvas(options)
    if (!canvas) return
    const type = options.type ?? 'image/png'
    const blob = await new Promise<Blob | null>((resolve) => {
      if (options.quality === undefined) canvas.toBlob((b) => resolve(b), type)
      else canvas.toBlob((b) => resolve(b), type, options.quality)
    })
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
  },
})

let resizeObserver: ResizeObserver | null = null
// 元素颜色支持 currentColor / var()，主题或色板一变就得重绘
let themeObserver: MutationObserver | null = null

onMounted(() => {
  updateScale()
  if (typeof ResizeObserver !== 'undefined' && rootRef.value) {
    resizeObserver = new ResizeObserver(() => {
      updateScale()
      void paint()
    })
    resizeObserver.observe(rootRef.value)
  }
  if (typeof MutationObserver !== 'undefined') {
    themeObserver = new MutationObserver(() => void paint())
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'style'],
    })
  }
  warnSlots()
  void paint()
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  themeObserver?.disconnect()
  resizeObserver = null
  themeObserver = null
})

watch(
  [
    () => props.width,
    () => props.height,
    () => props.background,
    () => props.elements,
    () => props.mode,
  ],
  async () => {
    await nextTick()
    updateScale()
    warnSlots()
    void paint()
  },
  { flush: 'post', deep: true },
)
</script>

<template>
  <div
    ref="rootRef"
    class="je-poster"
    :class="`je-poster--${mode}`"
    :style="rootStyle"
    :aria-label="label"
  >
    <canvas
      v-if="mode === 'canvas'"
      ref="canvasRef"
      class="je-poster__canvas"
      role="img"
      :aria-label="label"
    />
    <div v-else class="je-poster__stage" :style="stageStyle">
      <div class="je-poster__bg" :style="backgroundStyle" />
      <template v-for="box in boxes" :key="box.key">
        <div v-if="box.kind === 'text'" class="je-poster__text" :style="textStyle(box)">
          <div
            v-for="(line, index) in box.lines"
            :key="index"
            class="je-poster__line"
            :style="{ height: `${box.lineHeightPx}px`, lineHeight: `${box.lineHeightPx}px` }"
          >
            {{ line }}
          </div>
        </div>
        <div v-else-if="box.kind === 'image'" class="je-poster__box" :style="boxStyle(box)">
          <slot v-if="box.name && slots[box.name]" :name="box.name" />
          <img
            v-else
            class="je-poster__image"
            :src="box.element.src"
            :style="imageStyle(box)"
            alt=""
          />
        </div>
        <div v-else class="je-poster__box" :style="boxStyle(box)">
          <slot v-if="box.name && slots[box.name]" :name="box.name" />
          <je-qrcode
            v-else
            class="je-poster__qrcode"
            renderer="svg"
            :value="box.element.value"
            :size="box.width"
            :level="box.element.level"
            :margin="box.element.margin"
            :color="box.element.color ?? '#000000'"
            :background="box.element.background ?? '#ffffff'"
            :shape="box.element.shape"
            :gradient="box.element.gradient"
            :gradient-angle="box.element.gradientAngle"
            :icon="box.element.icon"
          />
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.je-poster {
  position: relative;
  display: block;
  width: 100%;
  overflow: hidden;
}

.je-poster__canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.je-poster__stage {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: top left;
  overflow: hidden;
}

.je-poster__bg {
  position: absolute;
  inset: 0;
}

.je-poster__box,
.je-poster__text {
  position: absolute;
}

/* 断行已由布局解析器算好，这里不再让浏览器重新折行 */
.je-poster__text {
  overflow: hidden;
  white-space: pre;
}

.je-poster__line {
  display: block;
  overflow: hidden;
}

.je-poster__image {
  display: block;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
}

.je-poster__qrcode {
  display: block;
}
</style>
