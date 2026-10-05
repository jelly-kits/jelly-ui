<script setup lang="ts">
import { ref } from 'vue'
import { JeIcon, JeUpload, type JeUploadFile, type JeUploadRequestOptions } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

/** 用内联 SVG 当缩略图，避免演示页依赖外部图片 */
const thumb = (color: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60"><rect width="60" height="60" fill="${color}"/></svg>`,
  )}`

const basicList = ref<JeUploadFile[]>([])
const dragList = ref<JeUploadFile[]>([])
const cardList = ref<JeUploadFile[]>([
  { name: '预览图-1.svg', url: thumb('#667eea'), size: 20480, status: 'success' },
  { name: '预览图-2.svg', url: thumb('#764ba2'), size: 15360, status: 'success' },
  { name: '预览图-3.svg', url: thumb('#22c55e'), size: 12288, status: 'success' },
])
const manualList = ref<JeUploadFile[]>([])
const mockList = ref<JeUploadFile[]>([])
const slotList = ref<JeUploadFile[]>([])
const disabledList = ref<JeUploadFile[]>([{ name: '已锁定文件.zip', size: 1048576, status: 'ready' }])

const lastPreview = ref('尚未预览')
const exceedText = ref('尚未超出限制')
const rejectText = ref('尚未被拦截')
const requestLog = ref('尚未发起自定义请求')

const onPreview = (file: JeUploadFile) => {
  lastPreview.value = file.name
}

const onExceed = (files: File[]) => {
  exceedText.value = `已超出上限，本次忽略：${files.map((file) => file.name).join('、')}`
}

/* ---------------------------------- 用户头像 ---------------------------------- */

const avatarFiles = ref<JeUploadFile[]>([])
const avatarUrl = ref('')
const avatarTip = ref('支持 JPG / PNG，且不超过 2MB')

const AVATAR_TYPES = ['image/jpeg', 'image/png']

const beforeAvatarUpload = (raw: File) => {
  if (!AVATAR_TYPES.includes(raw.type)) {
    avatarTip.value = '头像仅支持 JPG / PNG 格式'
    return false
  }
  if (raw.size > 2 * 1024 * 1024) {
    avatarTip.value = '头像大小不能超过 2MB'
    return false
  }
  avatarTip.value = '校验通过，头像已更新'
  return true
}

/** 头像位只显示一张：列表替换成刚选中的这张，旧条目的对象地址交给组件回收 */
const onAvatarChange = (file: JeUploadFile) => {
  avatarFiles.value = [file]
  avatarUrl.value = file.url ?? ''
}

/** 手动上传需要拿到组件实例去调 submit / clearFiles */
const manualRef = ref<{
  submit: () => void
  clearFiles: (status?: JeUploadFile['status'][]) => void
} | null>(null)

/**
 * 本地校验：超过 1MB 直接拦掉。
 * 返回 false 会中止该文件的上传，连 ready 条目都不会进列表，演示「不靠后端也能拦截」。
 */
const beforeUpload = (raw: File) => {
  if (raw.size > 1024 * 1024) {
    rejectText.value = `${raw.name} 超过 1MB，已被 beforeUpload 拦截`
    return false
  }
  rejectText.value = `${raw.name} 通过校验，开始上传`
  return true
}

/**
 * 演示用假上传：拿 setTimeout 按 20% 一档推进度，再把结果回给组件。
 * 它证明 httpRequest 能在完全没有后端的前提下跑通「上传中 → 成功」全链路。
 */
const mockRequest = (options: JeUploadRequestOptions) => {
  requestLog.value = `收到请求：${options.method.toUpperCase()} ${options.action}，字段名 ${options.name}，文件名 ${options.filename}`
  return new Promise((resolve: (value: unknown) => void) => {
    let percent = 0
    const timer = window.setInterval(() => {
      percent += 20
      // loaded / total 是 ProgressEvent 原型上的只读取值器，只能走构造函数第二个参数
      options.onProgress(
        Object.assign(
          new ProgressEvent('progress', { lengthComputable: true, loaded: percent, total: 100 }),
          { percent },
        ) as ProgressEvent & { percent: number },
      )
      if (percent < 100) return
      window.clearInterval(timer)
      const response = { code: 0, filename: options.filename }
      options.onSuccess(response)
      resolve(response)
    }, 180)
  })
}
</script>

<template>
  <DemoPage
    title="Upload 上传"
    description="点击 / 拖拽选择文件、数量限制、上传前校验、进度反馈、三种列表形态与内置图片预览。默认上传走 XMLHttpRequest，但本页所有演示都不需要真实后端：要么只做状态模拟，要么用 http-request 换成假请求，要么手动触发上传。窄屏热区不小于 44px。"
  >
    <DemoBlock
      title="基础用法"
      description="autoUpload 打开后会走完整的上传流程；条目没有原始 File 时（例如外部回显）退化成状态模拟，因此这里不填 action 也能看到 ready → uploading → success。"
    >
      <je-upload
        v-model:file-list="basicList"
        accept="image/*,.pdf"
        multiple
        auto-upload
        tip="支持图片与 PDF，可多选"
      />
      <p class="state">
        当前 {{ basicList.length }} 个文件，状态：{{
          basicList.map((file) => file.status).join('、') || '暂无'
        }}
      </p>
    </DemoBlock>

    <DemoBlock
      title="拖拽上传与数量限制"
      description="drag 打开拖拽区，limit 限制总数，超出时抛出 exceed 并且不会静默丢弃。窄屏仍可点击选择。"
    >
      <je-upload
        v-model:file-list="dragList"
        drag
        multiple
        :limit="3"
        tip="最多 3 个文件"
        :on-exceed="onExceed"
      />
      <p class="state">{{ exceedText }}</p>
    </DemoBlock>

    <DemoBlock
      title="照片墙与内置预览"
      description="list-type='picture-card' 排成照片墙；show-preview 打开内置预览浮层，点缩略图即可全屏查看，多张时可左右切换、Esc 关闭。浮层面板常驻 DOM，只用 .is-open 控制可见性。"
    >
      <je-upload
        v-model:file-list="cardList"
        list-type="picture-card"
        show-preview
        accept="image/*"
        tip="点击缩略图查看大图"
        :on-preview="onPreview"
      />
      <p class="state">最近预览：{{ lastPreview }}</p>
    </DemoBlock>

    <DemoBlock
      title="用户头像"
      description="show-file-list=false 关掉列表，把头像本身做成触发入口（trigger 插槽）—— 有图显示图片、没图显示加号；before-upload 里限制格式与大小，选中的图片由组件生成对象地址直接回显，头像位始终只保留最新一张。"
    >
      <div class="avatar-uploader">
        <je-upload
          v-model:file-list="avatarFiles"
          accept="image/*"
          :show-file-list="false"
          :before-upload="beforeAvatarUpload"
          :on-change="onAvatarChange"
        >
          <template #trigger>
            <img v-if="avatarUrl" class="avatar-uploader__img" :src="avatarUrl" alt="用户头像" >
            <je-icon v-else name="plus" :size="26" class="avatar-uploader__icon" />
          </template>
        </je-upload>
      </div>
      <p class="state">{{ avatarTip }}</p>
    </DemoBlock>

    <DemoBlock
      title="手动上传与上传前校验"
      description="auto-upload 为 false 时，选中后停在 ready，由 submit() 手动推送；clearFiles() 清空列表。before-upload 里做体积校验，返回 false 的文件不会进入列表。"
    >
      <je-upload
        ref="manualRef"
        v-model:file-list="manualList"
        multiple
        :before-upload="beforeUpload"
        tip="单个文件不超过 1MB"
      />
      <div class="actions">
        <button type="button" class="action" @click="manualRef?.submit()">submit() 手动上传</button>
        <button type="button" class="action" @click="manualRef?.clearFiles()">clearFiles() 清空</button>
        <button type="button" class="action" @click="manualRef?.clearFiles(['fail'])">
          clearFiles(['fail'])
        </button>
      </div>
      <p class="state">{{ rejectText }}</p>
    </DemoBlock>

    <DemoBlock
      title="自定义上传（无需后端）"
      description="http-request 完全接管请求：这里用定时器伪造进度并直接调用 onSuccess，不发出任何网络请求，所以离线也能看到进度条与成功态。换成真实项目里的 fetch / axios 即可。"
    >
      <je-upload
        v-model:file-list="mockList"
        multiple
        auto-upload
        action="/api/upload"
        :http-request="mockRequest"
        tip="假请求：定时器推进度，直接回调成功"
      />
      <p class="state">{{ requestLog }}</p>
    </DemoBlock>

    <DemoBlock
      title="插槽定制"
      description="trigger 替换触发按钮内容、tip 替换提示文案、file 替换每个列表项（作用域参数为 file 与 index，默认内容不再渲染）。这里用 file 插槽给每个条目加一行自定义说明。"
    >
      <je-upload v-model:file-list="slotList" multiple auto-upload>
        <template #trigger>
          <span class="slot-trigger">＋ 选择文件</span>
        </template>
        <template #tip>
          <span class="state">自定义 tip 插槽文案</span>
        </template>
        <template #file="{ file, index }">
          <div class="slot-file">
            <strong class="slot-file__name">{{ index + 1 }}. {{ file.name }}</strong>
            <span class="slot-file__status">自定义行内容 · 状态 {{ file.status }}</span>
          </div>
        </template>
      </je-upload>
    </DemoBlock>

    <DemoBlock
      title="禁用态与移动端"
      description="禁用后无法选择或删除文件；窄屏下热区放大到 44px，照片墙里的删除按钮常显（触屏没有 hover）。"
    >
      <je-upload v-model:file-list="disabledList" drag disabled />
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.state {
  margin: 10px 0 0;
  font-size: 12px;
  color: var(--je-text-faint);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.slot-trigger {
  font-size: 14px;
  font-weight: 600;
}

.avatar-uploader {
  display: inline-block;
}

/* 头像本身就是触发入口：正方形圆角虚线框（与照片墙入口同款），加号横竖居中，悬停只强调描边 */
.avatar-uploader :deep(.je-upload__trigger) {
  width: 120px;
  height: 120px;
  padding: 0;
  justify-content: center;
  overflow: hidden;
  background: var(--je-surface);
  border: 1px dashed var(--je-border-color);
  border-radius: var(--je-radius);
}

.avatar-uploader :deep(.je-upload__trigger:hover:not(:disabled)) {
  background: var(--je-surface);
  border-color: var(--je-primary);
  box-shadow: none;
}

.avatar-uploader__img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-uploader__icon {
  color: var(--je-text-muted);
}

.slot-file {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.slot-file__name {
  overflow: hidden;
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.slot-file__status {
  font-size: 12px;
  color: var(--je-text-faint);
}

.action {
  padding: 8px 14px;
  font: inherit;
  font-size: 13px;
  color: var(--je-text);
  background: var(--je-surface);
  border: var(--je-border);
  border-radius: var(--je-radius-sm);
  cursor: pointer;
}

.action:hover {
  background: var(--je-surface-hover);
}

@media (max-width: 768px) {
  .action {
    min-height: 44px;
  }
}
</style>
