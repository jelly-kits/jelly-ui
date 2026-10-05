<script setup lang="ts">
import { ref } from 'vue'
import { JeImage } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

/**
 * 演示用图片：全部是仓库内置的静态插画（`public/images/*.svg`）。
 * 不再依赖任何外部图片服务 —— 不受网络波动影响，也不会因为服务端「只对生成过的 prompt 出图」
 * 而拿到一张写着 The image is generating 的占位图。
 *
 * 路径必须带上 `import.meta.env.BASE_URL`：写在脚本里的字符串不会被 Vite 按 base 改写，
 * 部署到 Pages 子路径时缺了前缀会 404（dev 下前缀是 `/`，无感）。
 */
const photos = [
  `${import.meta.env.BASE_URL}images/living-room.svg`,
  `${import.meta.env.BASE_URL}images/vegetables.svg`,
  `${import.meta.env.BASE_URL}images/mountain-lake.svg`,
]

/** 故意给一段截断的 PNG base64，用来演示加载失败占位 */
const brokenSrc = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg=='

const current = ref(0)

const onClose = () => {
  current.value += 1
}
</script>

<template>
  <DemoPage
    title="Image 图片"
    description="支持占位骨架、失败占位与全屏预览。窄屏下预览图占满视口宽度，工具栏按钮热区不小于 44px 并预留底部安全区。"
  >
    <DemoBlock title="基础用法" description="固定宽高后点击图片即可打开全屏查看器，Esc 或点击遮罩关闭。">
      <je-image :src="photos[0]" alt="示例图片" :width="320" :height="200" preview />
    </DemoBlock>

    <DemoBlock title="填充模式" description="fit 透传给 object-fit，cover 会裁切，contain 会留白。">
      <je-image :src="photos[1]" alt="cover" :width="200" :height="140" fit="cover" />
      <je-image :src="photos[1]" alt="contain" :width="200" :height="140" fit="contain" />
      <je-image :src="photos[2]" alt="圆角" :width="200" :height="140" :radius="24" />
    </DemoBlock>

    <DemoBlock
      title="占位与失败态"
      description="加载中显示微光骨架，传了 placeholder 则先显示模糊占位图（可配合 lazy 在长页面里观察）；失败时显示内联自绘的破损图标。"
    >
      <je-image
        :src="photos[2]"
        alt="带占位图"
        :width="200"
        :height="140"
        :placeholder="photos[1]"
      />
      <je-image :src="brokenSrc" alt="加载失败" :width="200" :height="140" />
    </DemoBlock>

    <DemoBlock
      title="预览相册"
      description="previewSrcList 多于一张时，查看器里会出现左右切换与「当前 / 总数」计数。"
    >
      <je-image
        :src="photos[0]"
        alt="相册"
        :width="320"
        :height="200"
        preview
        :preview-src-list="photos"
        @close="onClose"
      />
      <p class="state">查看器关闭次数：{{ current }}</p>
    </DemoBlock>

    <DemoBlock title="移动端说明" description="缩到 768px 以下：预览图按 100vw 展示，工具栏按钮热区放大到 44px 并预留底部安全区。">
      <p class="state">lazy 为真时交给原生 loading="lazy"，离屏图片不会立即发起请求。</p>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.state {
  margin: 10px 0 0;
  font-size: 12px;
  color: var(--je-text-faint);
}
</style>
