<script setup lang="ts">
import { ref } from 'vue'
import {
  JeEditor,
  type JeEditorJSON,
  type JeEditorToolbarItem,
  type JeEditorUpload,
  type JeEditorUploadFiles,
} from '@jelly-kits/jelly-ui/editor'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'
import { useDemoI18n } from '../i18n'

const { t } = useDemoI18n()

const html = ref(
  '<p>把光标放进来试试工具栏：<strong>加粗</strong>、<em>斜体</em>、' +
    '<a target="_blank" rel="noopener noreferrer nofollow" href="https://cn.vuejs.org">超链接</a>。</p>',
)

const json = ref<JeEditorJSON>({
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [{ type: 'text', text: '这是以 JSON 存取的一份内容。' }],
    },
  ],
})

const disabledHtml = ref('<p>禁用状态下内容只读，工具栏整体不可点。</p>')

/** 图片 / 视频块单独一份内容，避免与上面「基础用法」共用同一个 ref 而互相干扰 */
const mediaHtml = ref('<p>试试工具栏里的图片与视频按钮。</p>')

/**
 * 演示用的假上传：不真正发请求，按 200ms 一档把进度推到 100%，
 * 再用 createObjectURL 给出一个能直接预览的地址。
 */
const mockUpload: JeEditorUpload = (file, { onProgress }) =>
  new Promise((resolve) => {
    let percent = 0
    const timer = window.setInterval(() => {
      percent = Math.min(100, percent + 20)
      onProgress(percent)
      if (percent >= 100) {
        window.clearInterval(timer)
        resolve(URL.createObjectURL(file))
      }
    }, 200)
  })

/** 批量上传的演示：一次收下整批文件，自己算整体进度（多图时优先走它） */
const mockUploadFiles: JeEditorUploadFiles = (files, { onProgress }) =>
  new Promise((resolve) => {
    let percent = 0
    const timer = window.setInterval(() => {
      percent = Math.min(100, percent + 20)
      onProgress(percent)
      if (percent >= 100) {
        window.clearInterval(timer)
        resolve(files.map((file) => URL.createObjectURL(file)))
      }
    }, 200)
  })

/**
 * 工具栏数组：内置按钮写 key（只写想显示的，顺序即展示顺序），
 * 自定义按钮写对象，中间用 'divider' 分组。
 */
const customToolbar: JeEditorToolbarItem[] = [
  'bold',
  'italic',
  'link',
  'divider',
  {
    key: 'clock',
    title: '插入当前时间',
    icon: 'clock',
    onClick: ({ editor }) =>
      editor?.chain().focus().insertContent(new Date().toLocaleTimeString()).run(),
  },
  {
    key: 'rule',
    title: '插入分割线',
    text: '分割线',
    onClick: ({ editor }) => editor?.chain().focus().setHorizontalRule().run(),
  },
]

/** 白名单：只留文字格式与超链接，其余按钮都不会渲染 */
const plainToolbar: JeEditorToolbarItem[] = ['bold', 'italic', 'underline', 'link']

const customHtml = ref('<p>工具栏只留了加粗 / 斜体 / 超链接，后面跟着两个自定义按钮。</p>')

const plainHtml = ref('<p>这一个是白名单：标题、列表、图片、视频、撤销重做都没有渲染出来。</p>')
</script>

<template>
  <DemoPage
    title="Editor 富文本编辑器"
    description="基于 Tiptap 的轻量富文本编辑器：文字格式、标题、列表、超链接、图片与视频，不做图文环绕这类复杂排版。它是独立子入口，需要额外安装 tiptap 相关依赖。"
  >
    <DemoBlock
      title="基础用法"
      description="v-model 默认绑 HTML 字符串，valueType 改成 json 则绑文档对象；内容变化即时回填。"
    >
      <je-editor v-model="html" placeholder="请输入内容，试试上面的工具栏…" />
      <p class="label">{{ t('当前的 HTML') }}</p>
      <pre class="output">{{ html }}</pre>
    </DemoBlock>

    <DemoBlock
      title="图片与视频（含多图上传）"
      description="工具栏里的图片 / 视频各有一个输入面板：可以直接填或粘地址，也可以走上传回调（面板里显示进度）。图片支持一次选多张 —— 传了 uploadFiles 就把整批交给它、并发自己控制，否则逐个调用 upload，进度显示成「2/5 60%」。"
    >
      <je-editor v-model="mediaHtml" :upload="mockUpload" :upload-files="mockUploadFiles" />
      <p class="hint">
        {{
          t(
            '本页的 upload / uploadFiles 都是演示用的假上传：按档位推进进度后返回本地预览地址，真实项目里换成自己的接口即可。',
          )
        }}
      </p>
    </DemoBlock>

    <DemoBlock
      title="JSON 取值"
      description="valueType 设为 json 后，v-model 收发的就是 Tiptap 的文档对象，适合需要保留结构、后续二次编辑的场景。"
    >
      <je-editor v-model="json" value-type="json" />
      <p class="label">{{ t('当前的 JSON') }}</p>
      <pre class="output">{{ JSON.stringify(json, null, 2) }}</pre>
    </DemoBlock>

    <DemoBlock title="禁用与最小高度" description="disabled 让内容只读、工具栏不可用；minHeight 控制编辑区最小高度。">
      <je-editor v-model="disabledHtml" disabled :min-height="140" />
    </DemoBlock>

    <DemoBlock
      title="自定义工具栏按钮"
      description="toolbar 数组里既能写内置按钮的 key（同时就是白名单与顺序），也能直接写自定义按钮对象：给 icon 或 text，点击执行 onClick，还可以用 isActive 让它跟着光标高亮。"
    >
      <je-editor v-model="customHtml" :toolbar="customToolbar" />
      <p class="hint">自定义按钮拿到的是编辑器实例，命令怎么执行由宿主决定；样式沿用工具栏的按钮类名。</p>
    </DemoBlock>

    <DemoBlock
      title="配置可用按钮"
      description="只列想保留的按钮，其余一概不渲染；'divider' 用来画分组竖线。不传 toolbar 时显示全部内置按钮。"
    >
      <je-editor v-model="plainHtml" :toolbar="plainToolbar" />
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.label {
  margin: 16px 0 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--je-text-muted);
}

.hint {
  margin: 12px 0 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--je-text-faint);
}

.output {
  max-height: 220px;
  margin: 0;
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
