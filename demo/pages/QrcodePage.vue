<script setup lang="ts">
import { ref } from 'vue'
import { JeButton, JeInput, JeQrcode } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const dynamic = ref('https://jelly-ui.dev/components/qrcode')

/*
 * logo 放在 public/ 下：脚本 / 模板属性里的字符串不会被 Vite 按 base 改写，
 * 必须自己带上 import.meta.env.BASE_URL（dev 是 '/'，Pages 子路径部署是 '/jelly-ui/'），
 * 否则线上会把 /logo.svg 解析到站点根目录而 404。
 */
const logoSrc = `${import.meta.env.BASE_URL}logo.svg`

const levels = [
  { level: 'L', tip: '约 7%' },
  { level: 'M', tip: '约 15%' },
  { level: 'Q', tip: '约 25%' },
  { level: 'H', tip: '约 30%' },
] as const

const exportRef = ref<InstanceType<typeof JeQrcode> | null>(null)
const exportTip = ref('')

const exportPng = async (size?: number) => {
  const instance = exportRef.value
  if (!instance) return
  await instance.download(size ? `jelly-qrcode-${size}.png` : 'jelly-qrcode.png', size ? { size } : {})
  exportTip.value = size ? `已导出 ${size} × ${size}` : '已按当前尺寸导出'
}

const svgRef = ref<InstanceType<typeof JeQrcode> | null>(null)
const svgTip = ref('')

const exportSvg = async () => {
  const instance = svgRef.value
  if (!instance) return
  await instance.downloadSVG('jelly-qrcode.svg')
  svgTip.value = '已导出 SVG（logo 已内联）'
}
</script>

<template>
  <DemoPage
    title="Qrcode 二维码"
    description="纯 TypeScript 自研的二维码编码内核（字节模式 + Reed-Solomon 纠错），默认以单条 SVG 路径渲染，可用 CSS 变量着色、随明暗主题自适应，支持圆点形状、前景渐变，以及连同 Logo 的 PNG / SVG 导出。"
  >
    <DemoBlock
      title="基础用法"
      description="value 即要编码的文本。深色模块默认取 currentColor（跟随正文色），背景透明，可叠在任意容器上。"
    >
      <je-qrcode value="https://jelly-ui.dev" />
    </DemoBlock>

    <DemoBlock
      title="尺寸与容错级别"
      description="size 控制渲染边长（数字按 px 处理）；level 越高，可被遮挡 / 污损的面积越大，但同样内容需要更高版本才能容纳。"
    >
      <div class="row">
        <div v-for="item in levels" :key="item.level" class="cell">
          <je-qrcode :value="`https://jelly-ui.dev?level=${item.level}`" :size="120" :level="item.level" />
          <span class="cell__label">{{ item.level }} · {{ item.tip }}</span>
        </div>
      </div>
    </DemoBlock>

    <DemoBlock
      title="颜色与静区"
      description="color / background 支持任意 CSS 颜色；margin 是静区宽度（单位：模块数），扫码时四周留白不足会影响识别。"
    >
      <div class="row">
        <je-qrcode
          value="https://jelly-ui.dev"
          :size="140"
          :margin="1"
          color="#ffffff"
          background="#409eff"
        />
        <je-qrcode
          value="https://jelly-ui.dev"
          :size="140"
          :margin="2"
          color="#1f2430"
          background="#ffffff"
        />
        <je-qrcode
          value="https://jelly-ui.dev"
          :size="140"
          :margin="4"
          color="var(--je-primary)"
          background="var(--je-surface)"
        />
      </div>
    </DemoBlock>

    <DemoBlock
      title="模块形状"
      description="shape 控制深色模块的形态：square（默认）为方块，dot 为圆点。定位、校正、定时等结构模块在圆点形态下依然保持方块 —— 否则定位图案的 1:1:3:1:1 比例被破坏，扫码会失败。"
    >
      <div class="row">
        <div class="cell">
          <je-qrcode value="https://jelly-ui.dev" :size="150" color="#1f2430" background="#ffffff" />
          <span class="cell__label">square（默认）</span>
        </div>
        <div class="cell">
          <je-qrcode
            value="https://jelly-ui.dev"
            :size="150"
            color="#1f2430"
            background="#ffffff"
            shape="dot"
          />
          <span class="cell__label">dot</span>
        </div>
        <div class="cell">
          <je-qrcode
            value="https://jelly-ui.dev"
            :size="150"
            color="#1f2430"
            background="#ffffff"
            shape="dot"
            renderer="canvas"
          />
          <span class="cell__label">dot + canvas</span>
        </div>
      </div>
    </DemoBlock>

    <DemoBlock
      title="前景渐变"
      description="gradient 给前景一组色标（至少两个），给值时覆盖 color；gradientAngle 是渐变角度（0 向上、90 向右、顺时针增大，默认 45）。SVG 走 linearGradient、Canvas 走 createLinearGradient，两端结果一致。"
    >
      <div class="row">
        <div class="cell">
          <je-qrcode
            value="https://jelly-ui.dev"
            :size="150"
            background="#ffffff"
            :gradient="['#409eff', '#a855f7']"
          />
          <span class="cell__label">45°（默认）</span>
        </div>
        <div class="cell">
          <je-qrcode
            value="https://jelly-ui.dev"
            :size="150"
            background="#ffffff"
            :gradient="['#ff6b6b', '#3aa0f5']"
            :gradient-angle="90"
          />
          <span class="cell__label">90° 横向</span>
        </div>
        <div class="cell">
          <je-qrcode
            value="https://jelly-ui.dev"
            :size="150"
            background="#ffffff"
            :gradient="['#409eff', '#a855f7', '#ff6b6b']"
            :gradient-angle="180"
            renderer="canvas"
          />
          <span class="cell__label">三色 + canvas</span>
        </div>
        <div class="cell">
          <je-qrcode
            value="https://jelly-ui.dev"
            :size="150"
            shape="dot"
            background="#ffffff"
            :gradient="['#409eff', '#a855f7']"
          />
          <span class="cell__label">渐变 + 圆点</span>
        </div>
      </div>
    </DemoBlock>

    <DemoBlock
      title="动态内容"
      description="value 变化时会重新编码并重绘，可直接绑定输入框做实时预览。"
    >
      <div class="dynamic">
        <je-qrcode :value="dynamic" :size="150" color="#1f2430" background="#ffffff" />
        <div class="dynamic__field">
          <je-input v-model="dynamic" placeholder="输入要生成二维码的内容" />
        </div>
      </div>
    </DemoBlock>

    <DemoBlock
      title="Canvas 渲染"
      description="renderer 切换渲染方式：svg（默认）用单条路径、随 CSS 变量与主题自动变色；canvas 走真实像素绘制（按设备像素比放大，边缘对齐到整数像素），适合大尺寸渲染与后续导出位图。两侧输出像素级一致。"
    >
      <div class="row">
        <div class="cell">
          <je-qrcode value="https://jelly-ui.dev" :size="150" color="#1f2430" background="#ffffff" />
          <span class="cell__label">renderer="svg"</span>
        </div>
        <div class="cell">
          <je-qrcode
            value="https://jelly-ui.dev"
            :size="150"
            color="#1f2430"
            background="#ffffff"
            renderer="canvas"
          />
          <span class="cell__label">renderer="canvas"</span>
        </div>
      </div>
    </DemoBlock>

    <DemoBlock
      title="中心 Logo"
      description="icon 指定中心图片，或用默认插槽放任意内容；iconSize 控制中心尺寸（数字按 px，缺省为边长的 22%）。中心内容会遮挡模块，建议把 level 提到 Q 或 H 以留出纠错余量。中心以叠加层呈现，两种 renderer 通用。"
    >
      <div class="row">
        <div class="cell">
          <je-qrcode
            value="https://jelly-ui.dev"
            :size="150"
            level="H"
            color="#1f2430"
            background="#ffffff"
            :icon="logoSrc"
          />
          <span class="cell__label">icon 图片</span>
        </div>
        <div class="cell">
          <je-qrcode
            value="https://jelly-ui.dev"
            :size="150"
            level="H"
            color="#1f2430"
            background="#ffffff"
            renderer="canvas"
          >
            <span class="qr-logo">J</span>
          </je-qrcode>
          <span class="cell__label">插槽 + canvas</span>
        </div>
        <div class="cell">
          <je-qrcode
            value="https://jelly-ui.dev"
            :size="150"
            level="H"
            color="#1f2430"
            background="#ffffff"
            :icon="logoSrc"
            :icon-size="56"
          />
          <span class="cell__label">icon-size="56"</span>
        </div>
      </div>
    </DemoBlock>

    <DemoBlock
      title="导出 PNG"
      description="通过组件实例调用 download() 或 toDataURL() 导出 PNG 位图，中心 logo（icon）会连同衬底一起画入。导出走独立的离屏画布，因此 svg / canvas 两种 renderer 都支持；缺省按「当前渲染尺寸 × 设备像素比」导出，也可用 size 指定更大的边长。跨域 logo 需图片服务器返回 Access-Control-Allow-Origin（组件自动带 crossOrigin 请求），否则会跳过 logo 并给出告警，不会让导出整体失败。"
    >
      <div class="row">
        <div class="cell">
          <je-qrcode
            ref="exportRef"
            value="https://jelly-ui.dev/export"
            :size="150"
            level="H"
            background="#ffffff"
            shape="dot"
            :gradient="['#409eff', '#a855f7']"
            :icon="logoSrc"
          />
        </div>
        <div class="cell cell--actions">
          <je-button type="primary" @click="exportPng()">下载 PNG</je-button>
          <je-button @click="exportPng(512)">导出 512 × 512</je-button>
          <span class="cell__label">{{ exportTip }}</span>
        </div>
      </div>
    </DemoBlock>

    <DemoBlock
      title="导出 SVG"
      description="通过组件实例调用 downloadSVG() 或 toSVGString() 导出向量图，产物是自包含的 SVG —— 前景渐变化作 linearGradient、颜色就地解析成具体值、中心 logo 内联为 data URL，因此离线也能正常显示，可直接存盘或塞进 img、CSS 背景。导出走独立构建，svg / canvas 两种 renderer 都支持；中心内容若来自默认插槽则无法导出（插槽是 DOM 节点，不是矢量内容）。"
    >
      <div class="row">
        <div class="cell">
          <je-qrcode
            ref="svgRef"
            value="https://jelly-ui.dev/export"
            :size="150"
            level="H"
            background="#ffffff"
            shape="dot"
            :gradient="['#409eff', '#a855f7']"
            :icon="logoSrc"
          />
        </div>
        <div class="cell cell--actions">
          <je-button type="primary" @click="exportSvg()">下载 SVG</je-button>
          <span class="cell__label">{{ svgTip }}</span>
        </div>
      </div>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.row {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  align-items: flex-end;
}

.cell {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
}

.cell--actions {
  align-items: flex-start;
}

.cell__label {
  font-size: 13px;
  color: var(--je-text-muted);
}

.dynamic {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  align-items: center;
}

.dynamic__field {
  flex: 1 1 240px;
}

.qr-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 18px;
  font-weight: 700;
  line-height: 1;
  color: var(--je-text-on-color);
  border-radius: 6px;
  background: linear-gradient(135deg, var(--je-primary), var(--je-primary-end));
}
</style>
