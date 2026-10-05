<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, useSlots, watch } from 'vue'
import { encodeQrcode, type JeQrcodeLevel } from '../../core/qrcode'
import {
  QR_DOT_RADIUS,
  collectQrcodeRuns,
  drawQrcodeMatrix,
  gradientVector,
  isTransparent,
  loadImage,
  resolveCssColor,
} from '../../core/canvas'

defineOptions({ name: 'JeQrcode' })

const props = withDefaults(
  defineProps<{
    /** 要编码的文本，按 UTF-8 字节模式编码 */
    value: string
    /** 渲染边长，数字按 px 处理 */
    size?: number | string
    /** 纠错级别，越高越耐污损、可容纳的内容越少 */
    level?: JeQrcodeLevel
    /** 静区宽度，单位为模块数 */
    margin?: number
    /** 深色模块颜色，默认跟随当前文字颜色 */
    color?: string
    /** 背景色，默认透明 */
    background?: string
    /** 渲染方式，canvas 适合大尺寸渲染等场景 */
    renderer?: 'svg' | 'canvas'
    /** 深色模块形状：square 方块，dot 圆点（定位 / 校正 / 定时等结构模块恒为方块，保证可识别） */
    shape?: 'square' | 'dot'
    /** 前景渐变色标，至少两个颜色；给值时覆盖 color */
    gradient?: string[]
    /** 前景渐变角度（度）：0 向上、90 向右、顺时针增大，默认 45 */
    gradientAngle?: number
    /** 中心 logo 图片地址，也可改用默认插槽自定义中心内容 */
    icon?: string
    /** 中心 logo 尺寸，数字按 px 处理；缺省为边长的 22% */
    iconSize?: number | string
    /** 无障碍描述，缺省用 value */
    label?: string
  }>(),
  {
    size: 160,
    level: 'M',
    margin: 2,
    color: 'currentColor',
    background: 'transparent',
    renderer: 'svg',
    shape: 'square',
    gradient: undefined,
    gradientAngle: 45,
    icon: undefined,
    iconSize: undefined,
    label: undefined,
  },
)

/** 位图导出选项 */
interface JeQrcodeExportOptions {
  /** 导出的像素边长，缺省取当前渲染尺寸 × 设备像素比 */
  size?: number
  /** 图片 MIME 类型，默认 image/png */
  type?: string
  /** 图片质量 0–1，仅对有损格式（如 image/jpeg）有效 */
  quality?: number
}

/** SVG 导出选项 */
interface JeQrcodeSvgOptions {
  /** 导出 SVG 的默认显示边长（写入 width / height），数字按 px 处理；缺省取当前渲染尺寸 */
  size?: number
}

const uid = useId()
const gradientId = `je-qrcode-grad-${uid}`
const slots = useSlots()
const rootRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

const encoded = computed(() => encodeQrcode({ value: props.value ?? '', level: props.level }))

const isCanvas = computed(() => props.renderer === 'canvas')
const isDot = computed(() => props.shape === 'dot')

const offset = computed(() => Math.max(0, props.margin))

/** 含静区的总模块数（边长） */
const total = computed(() => {
  const result = encoded.value
  if (!result) return 0
  return result.size + offset.value * 2
})

const sizeStyle = computed(() =>
  typeof props.size === 'number' ? `${props.size}px` : props.size,
)

const viewBox = computed(() => `0 0 ${total.value || 1} ${total.value || 1}`)

const toSize = (value: number | string | undefined, fallback: string) =>
  value === undefined ? fallback : typeof value === 'number' ? `${value}px` : value

/** 保留 3 位小数，避免浮点误差在 path 里拉出一串多余数字 */
const nf = (value: number) => Math.round(value * 1000) / 1000

/** SVG 是 XML，属性值里的 & < > " 必须转义 */
const escapeAttr = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

/**
 * 方块部分：square 形状下是全部深色模块；dot 形状下只保留功能模块
 * （定位 / 校正 / 定时 / 格式），它们必须保持方块才不破坏定位图案的 1:1:3:1:1 比例。
 */
const squareRuns = computed(() => {
  const result = encoded.value
  if (!result) return []
  return isDot.value
    ? collectQrcodeRuns(result, (x, y) => result.isFunction[y][x])
    : collectQrcodeRuns(result, () => true)
})

/** 圆点部分：dot 形状下需要画成圆的数据模块 */
const dotModules = computed(() => {
  const result = encoded.value
  const list: Array<{ x: number; y: number }> = []
  if (!result || !isDot.value) return list
  for (let y = 0; y < result.size; y++) {
    const row = result.matrix[y]
    const fn = result.isFunction[y]
    for (let x = 0; x < result.size; x++) {
      if (row[x] && !fn[x]) list.push({ x, y })
    }
  }
  return list
})

const squarePathD = computed(() =>
  squareRuns.value
    .map((run) => `M${run.x + offset.value} ${run.y + offset.value}h${run.len}v1h-${run.len}z`)
    .join(''),
)

const dotPathD = computed(() => {
  const r = QR_DOT_RADIUS
  return dotModules.value
    .map(({ x, y }) => {
      const cx = x + offset.value + 0.5
      const cy = y + offset.value + 0.5
      return `M${nf(cx - r)} ${nf(cy)}a${r} ${r} 0 1 0 ${nf(r * 2)} 0a${r} ${r} 0 1 0 ${nf(-r * 2)} 0z`
    })
    .join('')
})

const foregroundPathD = computed(() => squarePathD.value + dotPathD.value)

/** 前景渐变（至少两个色标才生效），给值时覆盖 color */
const gradientStops = computed(() =>
  Array.isArray(props.gradient) && props.gradient.length >= 2 ? props.gradient : null,
)

/** 渐变方向向量：CSS 角度约定（0° 向上、顺时针增大），与 Canvas / 导出共用一份口径 */
const gradVector = computed(() => gradientVector(props.gradientAngle ?? 45))

/** SVG 的渐变端点（userSpaceOnUse，覆盖含静区的整个 viewBox，与 Canvas 口径一致） */
const svgGradientPoints = computed(() => {
  const { x, y } = gradVector.value
  const t = total.value || 1
  return {
    x1: nf((0.5 - x / 2) * t),
    y1: nf((0.5 - y / 2) * t),
    x2: nf((0.5 + x / 2) * t),
    y2: nf((0.5 + y / 2) * t),
  }
})

/** SVG 的前景填充：有渐变走 url(#id)，否则用 color */
const svgFill = computed(() => (gradientStops.value ? `url(#${gradientId})` : props.color))

const hasCenter = computed(() => Boolean(props.icon) || Boolean(slots.default))

/** 中心 logo 的衬底：二维码靠浅色留白才易被识别，缺省用白色兜底 */
const centerBackground = computed(() =>
  props.background && props.background !== 'transparent' ? props.background : '#ffffff',
)

const centerStyle = computed(() => ({
  width: toSize(props.iconSize, '22%'),
  height: toSize(props.iconSize, '22%'),
  background: centerBackground.value,
}))

/** Canvas 不认 currentColor / var()，借一次样式往返把它解析成具体颜色 */
const toColor = (css: string, prop: 'color' | 'background-color') =>
  resolveCssColor(rootRef.value, css, prop)

/**
 * 把二维码本体（背景 + 前景）画进任意 2D 上下文，尺寸由调用方给定。
 * 实时 canvas 渲染与 PNG 导出共用这一份，且绘制口径与 `JePoster` 的二维码元素共用
 * `drawQrcodeMatrix`，保证各条路径像素一致。
 */
const paintContent = (ctx: CanvasRenderingContext2D, width: number) => {
  const result = encoded.value
  if (!result) return
  drawQrcodeMatrix(ctx, {
    x: 0,
    y: 0,
    size: width,
    result,
    margin: offset.value,
    color: props.color,
    background: props.background,
    shape: props.shape,
    gradient: gradientStops.value ?? undefined,
    gradientAngle: props.gradientAngle,
    host: rootRef.value,
  })
}

/** 实时 canvas：按设备像素比放大位图，中心 logo 由 HTML 叠加层承担（不画进画布，避免污染） */
const draw = () => {
  if (!isCanvas.value) return
  const canvas = canvasRef.value
  if (!canvas) return
  const width = canvas.clientWidth
  const height = canvas.clientHeight
  if (!width || !height) return

  const dpr = window.devicePixelRatio || 1
  canvas.width = Math.round(width * dpr)
  canvas.height = Math.round(height * dpr)
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, width, height)
  paintContent(ctx, width)
}

/** 中心 logo 在导出位图里占的边长比例（与 CSS 里 iconSize 的实际比例对齐） */
const centerRatio = () => {
  const rendered = rootRef.value?.clientWidth || 0
  const size = props.iconSize
  if (typeof size === 'number') return rendered ? size / rendered : 0.22
  if (typeof size === 'string') {
    const px = /^([\d.]+)px$/.exec(size)
    if (px) return rendered ? parseFloat(px[1]) / rendered : 0.22
    const percent = /^([\d.]+)%$/.exec(size)
    if (percent) return parseFloat(percent[1]) / 100
  }
  return 0.22
}

/** 导出时把中心 logo 连同白色衬底一起画进位图（与实时叠加层保持同一观感） */
const paintCenter = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  image: HTMLImageElement,
) => {
  const center = Math.min(width, height) * centerRatio()
  if (center <= 0) return
  const left = (width - center) / 2
  const top = (height - center) / 2

  ctx.fillStyle = toColor(centerBackground.value, 'background-color')
  ctx.beginPath()
  if (typeof ctx.roundRect === 'function') ctx.roundRect(left, top, center, center, center * 0.1)
  else ctx.rect(left, top, center, center)
  ctx.fill()

  const box = center * 0.8
  const scale = Math.min(box / image.width, box / image.height)
  if (!Number.isFinite(scale) || scale <= 0) return
  const w = image.width * scale
  const h = image.height * scale
  ctx.drawImage(image, left + (center - w) / 2, top + (center - h) / 2, w, h)
}

/** 把当前二维码渲染到一张离屏 canvas（含中心 logo），供导出使用 */
const renderToCanvas = async (pixelSize: number): Promise<HTMLCanvasElement | null> => {
  if (!encoded.value) return null
  const canvas = document.createElement('canvas')
  canvas.width = pixelSize
  canvas.height = pixelSize
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  paintContent(ctx, pixelSize)

  const icon = props.icon
  if (icon) {
    const image = await loadImage(icon)
    if (image) paintCenter(ctx, pixelSize, pixelSize, image)
    else
      console.warn(
        '[JeQrcode] 中心 logo 加载失败，导出将不含 logo（跨域图片需图片服务器返回 Access-Control-Allow-Origin）：',
        icon,
      )
  }
  return canvas
}

/** 导出尺寸：显式 size 优先，缺省取当前渲染尺寸 × 设备像素比 */
const resolveExportSize = (size?: number) => {
  if (typeof size === 'number' && size > 0) return Math.round(size)
  const rendered = rootRef.value?.clientWidth || (typeof props.size === 'number' ? props.size : 160)
  const dpr = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1
  return Math.max(1, Math.round(rendered * dpr))
}

/** 按给定选项导出为 dataURL */
const exportDataURL = async (options: JeQrcodeExportOptions): Promise<string> => {
  const canvas = await renderToCanvas(resolveExportSize(options.size))
  if (!canvas) return ''
  const type = options.type ?? 'image/png'
  return options.quality === undefined
    ? canvas.toDataURL(type)
    : canvas.toDataURL(type, options.quality)
}

/**
 * 把图片资源取成 data URL，供导出的 SVG 内联 —— 这样 SVG 自包含，
 * 离线 / 迁移到别处也能显示中心 logo（远程图片同样会被内联）。
 */
const resourceToDataURL = async (src: string): Promise<string | null> => {
  if (/^data:/i.test(src)) return src
  try {
    const response = await fetch(src)
    if (!response.ok) throw new Error(String(response.status))
    const blob = await response.blob()
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

/** SVG 的默认显示边长：显式 size 优先，缺省取当前渲染尺寸，再退到 size 属性 */
const resolveSvgSize = (size?: number) => {
  if (typeof size === 'number' && size > 0) return Math.round(size)
  const rendered = rootRef.value?.clientWidth || 0
  if (rendered) return Math.round(rendered)
  return typeof props.size === 'number' ? props.size : 160
}

/**
 * 组装自包含的 SVG 字符串：背景 + 前景路径 + 中心 logo（内联为 data URL）。
 * 颜色在这里就地解析成具体值（currentColor / var() 在独立文件里解析不出来），
 * 属性值统一走 escapeAttr 转义，字符串可直接存盘或塞进 img / 背景图。
 */
const buildSvg = async (pixelSize: number): Promise<string> => {
  const result = encoded.value
  if (!result) return ''
  const t = total.value || 1
  const parts: string[] = []

  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${pixelSize}" height="${pixelSize}" ` +
      `viewBox="0 0 ${t} ${t}" role="img" aria-label="${escapeAttr(props.label ?? props.value)}" ` +
      `shape-rendering="${isDot.value ? 'geometricPrecision' : 'crispEdges'}">`,
  )

  const stops = gradientStops.value
  if (stops) {
    const { x1, y1, x2, y2 } = svgGradientPoints.value
    const stopTags = stops
      .map((stop, index) => {
        const offset = nf(index / (stops.length - 1))
        return `<stop offset="${offset}" stop-color="${escapeAttr(toColor(stop, 'color'))}"/>`
      })
      .join('')
    parts.push(
      `<defs><linearGradient id="${gradientId}" gradientUnits="userSpaceOnUse" ` +
        `x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stopTags}</linearGradient></defs>`,
    )
  }

  const background = toColor(props.background, 'background-color')
  if (!isTransparent(background)) {
    parts.push(`<rect x="0" y="0" width="${t}" height="${t}" fill="${escapeAttr(background)}"/>`)
  }

  const fill = stops ? `url(#${gradientId})` : escapeAttr(toColor(props.color, 'color'))
  parts.push(`<path d="${foregroundPathD.value}" fill="${fill}"/>`)

  if (props.icon) {
    const href = await resourceToDataURL(props.icon)
    if (href) {
      const center = t * centerRatio()
      const inner = center * 0.8
      const start = nf((t - center) / 2)
      const offsetInner = nf((t - center) / 2 + center * 0.1)
      parts.push(
        `<rect x="${start}" y="${start}" width="${nf(center)}" height="${nf(center)}" ` +
          `rx="${nf(center * 0.1)}" fill="${escapeAttr(toColor(centerBackground.value, 'background-color'))}"/>`,
        `<image href="${escapeAttr(href)}" x="${offsetInner}" y="${offsetInner}" ` +
          `width="${nf(inner)}" height="${nf(inner)}" preserveAspectRatio="xMidYMid meet"/>`,
      )
    } else {
      console.warn(
        '[JeQrcode] 中心 logo 读取失败，导出的 SVG 将不含 logo（跨域图片需图片服务器返回 Access-Control-Allow-Origin）：',
        props.icon,
      )
    }
  } else if (slots.default) {
    console.warn('[JeQrcode] 中心内容来自插槽，无法导出到 SVG；如需导出请改用 icon 属性。')
  }

  parts.push('</svg>')
  return parts.join('')
}

/** 导出为自包含的 SVG 字符串 */
const exportSVGString = (options: JeQrcodeSvgOptions): Promise<string> =>
  buildSvg(resolveSvgSize(options.size))

defineExpose({
  /** 导出为图片 dataURL（默认 PNG 位图），连同中心 logo 一起绘制 */
  toDataURL: (options: JeQrcodeExportOptions = {}) => exportDataURL(options),
  /** 导出位图并触发浏览器下载，filename 缺省为 qrcode.png */
  download: async (filename = 'qrcode.png', options: JeQrcodeExportOptions = {}): Promise<void> => {
    const url = await exportDataURL(options)
    if (!url) return
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
  },
  /** 导出为自包含的 SVG 字符串（向量，中心 logo 内联为 data URL） */
  toSVGString: (options: JeQrcodeSvgOptions = {}) => exportSVGString(options),
  /** 导出 SVG 并触发浏览器下载，filename 缺省为 qrcode.svg */
  downloadSVG: async (
    filename = 'qrcode.svg',
    options: JeQrcodeSvgOptions = {},
  ): Promise<void> => {
    const svg = await exportSVGString(options)
    if (!svg) return
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
  },
})

let resizeObserver: ResizeObserver | null = null
// currentColor / CSS 变量在 canvas 里要手动解析，主题或色板一变就得重绘
let themeObserver: MutationObserver | null = null

onMounted(() => {
  if (typeof ResizeObserver !== 'undefined' && rootRef.value) {
    resizeObserver = new ResizeObserver(() => draw())
    resizeObserver.observe(rootRef.value)
  }
  if (typeof MutationObserver !== 'undefined') {
    themeObserver = new MutationObserver(() => draw())
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'style'],
    })
  }
  draw()
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  themeObserver?.disconnect()
  resizeObserver = null
  themeObserver = null
})

watch(
  [
    () => props.renderer,
    () => props.value,
    () => props.level,
    () => props.size,
    () => props.margin,
    () => props.color,
    () => props.background,
    () => props.shape,
    () => props.gradient,
    () => props.gradientAngle,
  ],
  async () => {
    await nextTick()
    draw()
  },
  { flush: 'post' },
)
</script>

<template>
  <div
    ref="rootRef"
    class="je-qrcode"
    :class="{ 'is-empty': !encoded }"
    :style="{ width: sizeStyle, height: sizeStyle }"
  >
    <svg
      v-if="!isCanvas"
      class="je-qrcode__svg"
      :viewBox="viewBox"
      role="img"
      :aria-label="label ?? value"
      :shape-rendering="isDot ? 'geometricPrecision' : 'crispEdges'"
    >
      <defs v-if="gradientStops">
        <linearGradient
          :id="gradientId"
          gradientUnits="userSpaceOnUse"
          :x1="svgGradientPoints.x1"
          :y1="svgGradientPoints.y1"
          :x2="svgGradientPoints.x2"
          :y2="svgGradientPoints.y2"
        >
          <stop
            v-for="(stop, index) in gradientStops"
            :key="index"
            :offset="index / (gradientStops.length - 1)"
            :stop-color="stop"
          />
        </linearGradient>
      </defs>
      <rect
        v-if="background !== 'transparent'"
        x="0"
        y="0"
        :width="total"
        :height="total"
        :fill="background"
      />
      <path :d="foregroundPathD" :fill="svgFill" />
    </svg>
    <canvas v-else ref="canvasRef" class="je-qrcode__canvas" role="img" :aria-label="label ?? value" />

    <div v-if="hasCenter" class="je-qrcode__center" :style="centerStyle">
      <img v-if="!slots.default && icon" class="je-qrcode__icon" :src="icon" alt="" />
      <slot v-else />
    </div>
  </div>
</template>

<style scoped>
.je-qrcode {
  position: relative;
  display: block;
  color: inherit;
}

.je-qrcode__svg,
.je-qrcode__canvas {
  display: block;
  width: 100%;
  height: 100%;
}

/* 中心 logo 以叠加层呈现：SVG / Canvas 两种渲染方式共用，且支持插槽塞任意内容 */
.je-qrcode__center {
  position: absolute;
  top: 50%;
  left: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: translate(-50%, -50%);
  border-radius: 6px;
}

.je-qrcode__icon {
  display: block;
  width: 80%;
  height: 80%;
  object-fit: contain;
}

/* 内容超出可编码上限时 encodeQrcode 返回 null，此时只剩静区，视觉上等价于空 */
.je-qrcode.is-empty {
  visibility: hidden;
}
</style>
