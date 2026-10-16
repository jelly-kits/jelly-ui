<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  JeBlockEditor,
  JeBlockView,
  type JeBlockActionItem,
  type JeBlockDocument,
  type JeBlockToolbarItem,
  type JeBlockUpload,
} from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'
import { useDemoI18n } from '../i18n'

const { t } = useDemoI18n()

/**
 * 演示用的假上传：延迟一下再回本地预览地址。
 * 真实项目里换成自己的接口即可（每次传一个文件，多图时组件会逐个调用）。
 */
const mockUpload: JeBlockUpload = (file) =>
  new Promise((resolve) => {
    setTimeout(() => resolve(URL.createObjectURL(file)), 400)
  })

/** 四种块各来一个，顺便带上一个非默认的宽度与缩放 */
const doc = ref<JeBlockDocument>({
  version: 1,
  blocks: [
    {
      id: 'b1',
      type: 'text',
      text: '一段文本就是一个块，换行会原样保留。\n点一下块会选中它，选中后块头部才出现图标；双击块直接打开编辑窗口。',
    },
    {
      id: 'b2',
      type: 'image',
      url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=colorful%20jelly%20dessert%20on%20a%20white%20plate&image_size=landscape_4_3',
      alt: '果冻',
      width: '60%',
      fit: 'cover',
    },
    {
      id: 'b3',
      type: 'video',
      url: 'https://www.w3schools.com/html/mov_bbb.mp4',
      poster:
        'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cartoon%20movie%20title%20card%20poster%20with%20a%20cute%20giant%20rabbit&image_size=landscape_16_9',
    },
    { id: 'b4', type: 'link', url: 'https://cn.vuejs.org', title: 'Vue 3 文档' },
  ],
})

const json = computed(() => JSON.stringify(doc.value, null, 2))

/** 多图上传演示：初始只有一个空图片块，点「编辑」再点「选择图片」可以一次选多张 */
const mediaDoc = ref<JeBlockDocument>({
  version: 1,
  blocks: [
    { id: 'm1', type: 'image', url: '', width: '50%' },
    { id: 'm2', type: 'video', url: '', height: '200px', fit: 'cover' },
  ],
})

/** 自定义顶部按钮：内置的四种块 + 一个插预设文本的按钮 */
const customToolbar: JeBlockToolbarItem[] = [
  'text',
  'image',
  'divider',
  {
    key: 'quote',
    title: '插入一段引用文本',
    icon: 'flag',
    onClick: ({ insert }) => insert({ type: 'text', text: '「自定义按钮插入的文本块」—— ' }),
  },
]

/** 自定义块头部按钮：保留编辑，去掉复制，加一个把地址转大写的按钮 */
const customActions: JeBlockActionItem[] = [
  'drag',
  'edit',
  'up',
  'down',
  {
    key: 'upper',
    title: '把地址转成大写',
    icon: 'refresh',
    onClick: ({ block, update }) => {
      if (!block || block.type === 'text') return
      update(block.id, { url: block.url.toUpperCase() })
    },
  },
  'remove',
]

const customDoc = ref<JeBlockDocument>({
  version: 1,
  blocks: [{ id: 'c1', type: 'text', text: '试试块头部的自定义按钮：它会把地址转成大写。' }],
})

/** 只放行文本与图片 */
const limitedDoc = ref<JeBlockDocument>({
  version: 1,
  blocks: [{ id: 'l1', type: 'text', text: '这个编辑器只放行文本与图片两种块。' }],
})

const readonlyDoc = ref<JeBlockDocument>({
  version: 1,
  blocks: [{ id: 'r1', type: 'text', text: 'disabled 下不能选中，也不能增删改块。' }],
})
</script>

<template>
  <DemoPage
    title="BlockEditor 块编辑器"
    description="把内容拆成「块」：一段文本、一张图片、一个视频、一条超链接各占一块，块宽占满、可拖动排序。数据是一份不含 HTML 的纯 JSON，小程序等其他端按 type 分支渲染即可（参考下面「只读渲染」）。"
  >
    <DemoBlock
      title="基础用法"
      description="v-model 收发 { version, blocks }：点一下块即选中（高亮边框），选中后块头部才显示图标 —— 拖动调顺序，点「编辑」弹出这个块的编辑窗口（双击块同样直接打开），改完点确定才落数据。"
    >
      <je-block-editor v-model="doc" :upload="mockUpload" />
      <p class="hint">{{ t('当前的 JSON') }}</p>
      <pre class="pre">{{ json }}</pre>
    </DemoBlock>

    <DemoBlock
      title="多图上传与尺寸缩放"
      description="图片支持一次选多张：第一张落在当前块，其余各生成一个图片块插在它后面。宽度可以点档位（25% / 50% / 75% / 100%）或直接填数值，高度留空即按素材比例自适应，缩放方式对应 object-fit 的 contain / cover / fill。"
    >
      <je-block-editor v-model="mediaDoc" :upload="mockUpload" />
      <p class="hint">
        本页的 upload 是演示用的假上传：延迟一下后返回本地预览地址，真实项目里换成自己的接口即可。
      </p>
    </DemoBlock>

    <DemoBlock
      title="只读渲染"
      description="JeBlockView 拿同一份 JSON 直接渲染，也是其他端实现展示侧时的参照：字段只有 text / url / alt / poster / title / width / height / fit。"
    >
      <je-block-view :value="doc" />
    </DemoBlock>

    <DemoBlock
      title="自定义按钮与按钮配置"
      description="toolbar 与 blockActions 都是「白名单 + 顺序 + 自定义按钮」：内置项写 key，自定义项写对象，回调里能拿到块与下标，直接改数据，也可以调 openEditor 复用内置的编辑窗口。"
    >
      <je-block-editor v-model="customDoc" :toolbar="customToolbar" :block-actions="customActions" />
    </DemoBlock>

    <DemoBlock
      title="限制块类型与禁用"
      description="blockTypes 只放行文本与图片，其余「添加块」按钮不渲染；disabled 让整块编辑器只读。"
    >
      <je-block-editor v-model="limitedDoc" :block-types="['text', 'image']" />
      <div class="gap" />
      <je-block-editor v-model="readonlyDoc" disabled />
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.gap {
  height: 12px;
}

.hint {
  margin: 16px 0 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--je-text-faint);
}

.pre {
  max-height: 260px;
  margin: 8px 0 0;
  padding: 12px 14px;
  overflow: auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12.5px;
  line-height: 1.7;
  color: color-mix(in srgb, var(--je-primary) 22%, var(--je-text));
  white-space: pre-wrap;
  word-break: break-all;
  background: color-mix(in srgb, var(--je-text) 10%, transparent);
  border-radius: var(--je-radius);
}
</style>
