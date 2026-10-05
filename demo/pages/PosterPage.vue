<script setup lang="ts">
import { ref } from 'vue'
import {
  JeButton,
  JePoster,
  type JePosterBackground,
  type JePosterElement,
} from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

/*
 * public/ 下的静态资源：写在脚本里的路径不会被 Vite 按 base 改写，
 * 必须自己带上 import.meta.env.BASE_URL（dev 是 '/'，Pages 子路径部署是 '/jelly-ui/'），
 * 否则线上会把 /logo.svg 解析到站点根目录而 404。
 */
const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`

/** 背景：底色 + 背景图，图片按 cover 铺满、超出部分裁掉 */
const posterBackground: JePosterBackground = {
  src: asset('images/poster-bg.svg'),
  fit: 'cover',
  color: '#0b1026',
}

/**
 * 元素全部按**设计稿 px**书写（与 width / height 同一坐标系），
 * 组件按容器宽度等比缩放，导出时再按目标像素放大，同一份配置在任何尺寸下都长得一样。
 */
const posterElements = ref<JePosterElement[]>([
  {
    type: 'image',
    name: 'avatar',
    x: 60,
    y: 96,
    width: 148,
    height: 148,
    src: asset('logo.svg'),
    circle: true,
    border: { width: 5, color: 'rgba(255, 255, 255, 0.9)' },
  },
  {
    type: 'text',
    x: 60,
    y: 300,
    width: 630,
    text: 'Jelly UI',
    fontSize: 68,
    fontWeight: 700,
    lineHeight: 1.25,
  },
  {
    type: 'text',
    x: 60,
    y: 420,
    width: 620,
    text: '一套自带果冻手感的 Vue 3 组件库',
    fontSize: 30,
    color: 'rgba(255, 255, 255, 0.72)',
    lineHeight: 1.6,
  },
  {
    type: 'text',
    x: 60,
    y: 764,
    width: 630,
    text: '扫一扫，把这份手感带回去',
    fontSize: 34,
    fontWeight: 600,
  },
  {
    type: 'qrcode',
    x: 60,
    y: 1058,
    size: 196,
    value: 'https://jelly-ui.dev/poster',
    level: 'H',
    shape: 'dot',
    margin: 1,
    gradient: ['#409eff', '#a855f7'],
    icon: asset('logo.svg'),
  },
  {
    type: 'text',
    x: 296,
    y: 1108,
    width: 400,
    text: '长按识别二维码',
    fontSize: 36,
    fontWeight: 700,
  },
  {
    type: 'text',
    x: 296,
    y: 1170,
    width: 400,
    text: 'jelly-ui.dev',
    fontSize: 26,
    color: 'rgba(255, 255, 255, 0.6)',
  },
])

/** 纯底色 + 顶部封面图 + 居中排版：演示图片填充与文字对齐 */
const coverBackground: JePosterBackground = { color: '#0f172a' }
const coverElements: JePosterElement[] = [
  {
    type: 'image',
    x: 40,
    y: 40,
    width: 670,
    height: 380,
    src: asset('images/mountain-lake.svg'),
    fit: 'cover',
    radius: 28,
  },
  {
    type: 'text',
    x: 60,
    y: 480,
    width: 630,
    text: '从菜鸟到大神，只差一套好组件',
    fontSize: 46,
    fontWeight: 700,
    align: 'center',
    lineHeight: 1.35,
    maxLines: 2,
  },
  {
    type: 'text',
    x: 60,
    y: 620,
    width: 630,
    text: '单库自适应桌面与移动端，弹簧手感开箱即用',
    fontSize: 28,
    color: 'rgba(255, 255, 255, 0.7)',
    align: 'center',
    lineHeight: 1.6,
  },
  {
    type: 'qrcode',
    x: 275,
    y: 900,
    size: 200,
    value: 'https://jelly-ui.dev/cover',
    level: 'H',
    color: '#0f172a',
    background: '#ffffff',
  },
  {
    type: 'text',
    x: 60,
    y: 1160,
    width: 630,
    text: '扫码查看完整文档',
    fontSize: 28,
    color: 'rgba(255, 255, 255, 0.55)',
    align: 'center',
  },
]

const posterRef = ref<InstanceType<typeof JePoster> | null>(null)
const exportTip = ref('')

const downloadPng = async () => {
  const instance = posterRef.value
  if (!instance) return
  await instance.download('jelly-poster.png')
  exportTip.value = '已导出 PNG（750 × 1334）'
}

const downloadJpeg = async () => {
  const instance = posterRef.value
  if (!instance) return
  await instance.download('jelly-poster.jpg', { type: 'image/jpeg', quality: 0.9 })
  exportTip.value = '已导出 JPEG（质量 0.9）'
}

const downloadHd = async () => {
  const instance = posterRef.value
  if (!instance) return
  await instance.download('jelly-poster@2x.png', { width: 1500, height: 2668 })
  exportTip.value = '已导出 1500 × 2668（2 倍图）'
}

const inspectBlob = async () => {
  const instance = posterRef.value
  if (!instance) return
  const blob = await instance.toBlob({ type: 'image/jpeg', quality: 0.8 })
  exportTip.value = blob
    ? `toBlob 拿到 JPEG，约 ${(blob.size / 1024).toFixed(1)} KB`
    : '导出失败'
}
</script>

<template>
  <DemoPage
    title="Poster 海报"
    description="把背景图、头像、描述文字与二维码拼成一张可导出的分享海报。元素坐标 / 尺寸 / 字号一律按设计稿 px 书写（与 width / height 同一坐标系），组件按容器宽度等比缩放预览，导出时再按目标像素等比放大；预览与导出消费同一份布局，因此所见即所得。二维码元素直接复用组件库的编码内核，圆点形状、前景渐变、中心 logo 全套可用。"
  >
    <DemoBlock
      title="基础用法"
      description="background 给底色与背景图（图片按 fit 铺满，缺省 cover）；elements 按数组顺序叠放，支持 image（图片 / 头像）、text（文字）、qrcode（二维码）三种元素。缺省用 canvas 模式绘制，预览与导出像素一致。"
    >
      <je-poster
        class="poster-demo"
        :width="750"
        :height="1334"
        :background="posterBackground"
        :elements="posterElements"
      />
    </DemoBlock>

    <DemoBlock
      title="渲染方式"
      description="mode 切换两种渲染方式：canvas（默认）所见即所得，导出与预览共用同一条绘制链；dom 渲染成真实 DOM 节点，能用具名插槽替换元素、也能被浏览器开发者工具直接审查。两种模式共用同一份布局解析结果（含文字折行），所以外观一致。"
    >
      <div class="poster-row">
        <div class="poster-cell">
          <je-poster
            class="poster-demo"
            :width="750"
            :height="1334"
            :background="posterBackground"
            :elements="posterElements"
            mode="canvas"
          />
          <span class="poster-label">mode="canvas"（默认）</span>
        </div>
        <div class="poster-cell">
          <je-poster
            class="poster-demo"
            :width="750"
            :height="1334"
            :background="posterBackground"
            :elements="posterElements"
            mode="dom"
          />
          <span class="poster-label">mode="dom"</span>
        </div>
      </div>
    </DemoBlock>

    <DemoBlock
      title="具名插槽"
      description="元素配置里的 name 与具名插槽同名时，DOM 预览会改用插槽内容（这里把头像换成了自定义徽章）。注意插槽只在 dom 模式的预览里生效 —— 导出永远按 elements 配置绘制，否则「预览好看、导出对不上」的顺序就反过来了。"
    >
      <div class="poster-cell">
        <je-poster
          class="poster-demo"
          :width="750"
          :height="1334"
          :background="posterBackground"
          :elements="posterElements"
          mode="dom"
        >
          <template #avatar>
            <div class="avatar-slot">J</div>
          </template>
        </je-poster>
        <span class="poster-label">#avatar 插槽</span>
      </div>
    </DemoBlock>

    <DemoBlock
      title="图片与文字"
      description="image 支持 fit（cover / contain / fill）、圆角（radius 或 circle）与描边（border）；text 支持字号、字重、颜色、行高、对齐（align）与最大行数（maxLines，超出用省略号截断）。折行由组件按画布测量统一计算，两种渲染模式与导出结果完全一致。"
    >
      <je-poster
        class="poster-demo"
        :width="750"
        :height="1334"
        :background="coverBackground"
        :elements="coverElements"
      />
    </DemoBlock>

    <DemoBlock
      title="导出"
      description="通过组件实例导出：download() 直接触发下载，toDataURL() 拿 dataURL，toBlob() 拿 Blob（适合上传 / 转 File）。导出走独立离屏画布，因此 canvas / dom 两种模式都能导出；不给尺寸时按设计稿原尺寸输出，width / height 可指定目标像素（高清图、九宫格裁切都靠它），type / quality 控制格式与质量（PNG 无损，JPEG / WebP 支持质量）。图片跨域时需图片服务器返回 Access-Control-Allow-Origin（组件自动带 crossOrigin 请求），否则该图片会被跳过并给出告警，不会让整张导出失败。"
    >
      <div class="poster-row poster-row--export">
        <je-poster
          ref="posterRef"
          class="poster-demo"
          :width="750"
          :height="1334"
          :background="posterBackground"
          :elements="posterElements"
        />
        <div class="poster-actions">
          <je-button type="primary" @click="downloadPng()">下载 PNG</je-button>
          <je-button @click="downloadJpeg()">下载 JPEG（0.9）</je-button>
          <je-button @click="downloadHd()">导出 2 倍图</je-button>
          <je-button variant="ghost" @click="inspectBlob()">toBlob 取大小</je-button>
          <span class="poster-label">{{ exportTip }}</span>
        </div>
      </div>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.poster-demo {
  width: 300px;
  border-radius: 16px;
  box-shadow: 0 12px 32px rgb(15 23 42 / 18%);
}

.poster-row {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  align-items: flex-start;
}

.poster-cell {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
}

.poster-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start;
}

.poster-label {
  font-size: 13px;
  color: var(--je-text-muted);
}

.avatar-slot {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 64px;
  font-weight: 700;
  line-height: 1;
  color: var(--je-text-on-color);
  border-radius: 50%;
  background: linear-gradient(135deg, var(--je-primary), var(--je-primary-end));
}
</style>
