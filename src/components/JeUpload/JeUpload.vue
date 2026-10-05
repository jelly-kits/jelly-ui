<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useFocusTrap } from '../../core/useFocusTrap'
import { useScrollLock } from '../../core/useScrollLock'
import { nextZIndex } from '../../core/useZIndex'
import { JeIcon } from '../JeIcon'
import type {
  JeUploadAwaitable,
  JeUploadBeforeRemove,
  JeUploadBeforeUpload,
  JeUploadData,
  JeUploadFile,
  JeUploadFormData,
  JeUploadListType,
  JeUploadOnChange,
  JeUploadOnError,
  JeUploadOnExceed,
  JeUploadOnPreview,
  JeUploadOnProgress,
  JeUploadOnRemove,
  JeUploadOnSuccess,
  JeUploadProgressEvent,
  JeUploadRequestHandler,
  JeUploadRequestOptions,
  JeUploadStatus,
} from './types'
import type { JeTeleportTarget } from '../../core/globalConfig'
import { useTeleportTarget } from '../JeConfigProvider/types'

defineOptions({ name: 'JeUpload' })

const props = withDefaults(
  defineProps<{
    /** 文件列表，配合 v-model:file-list 使用；未绑定时组件内部自己维护 */
    fileList?: JeUploadFile[]
    /** 原生 accept，例如 image 通配或 .pdf；留空表示不限类型 */
    accept?: string
    /** 是否允许一次选择多个文件 */
    multiple?: boolean
    /** 开启拖拽上传区域，窄屏仍可点击选择 */
    drag?: boolean
    /** 最多允许的文件数量 */
    limit?: number
    /** 是否禁用选择与删除 */
    disabled?: boolean
    /** 列表展现形式：text 文本 / picture 图文 / picture-card 照片墙 */
    listType?: JeUploadListType
    /** 仅做前端状态模拟，不会发起真实请求 */
    autoUpload?: boolean
    /** 列表下方的提示文案，等价于 tip 插槽的默认内容 */
    tip?: string
    /** 上传地址；默认的 XMLHttpRequest 实现会 POST 到这里 */
    action?: string
    /** 请求方法 */
    method?: string
    /** 上传文件的字段名，对应 multipart 里的 name */
    name?: string
    /** 请求头，逐项用 setRequestHeader 写入 */
    headers?: Record<string, string>
    /** 是否携带 Cookie（跨域下还要服务端配合 Access-Control-Allow-Credentials） */
    withCredentials?: boolean
    /** 附加表单字段：静态对象、Promise，或按文件动态计算的函数 */
    data?: JeUploadFormData
    /** 接替默认 XHR 实现；传了它 action / method 等参数只作为入参透传，不再由组件发起请求 */
    httpRequest?: JeUploadRequestHandler
    /** 选用文件前的钩子：返回 false 或 reject 会中止该文件，返回 File / Blob 则替换原文件 */
    beforeUpload?: JeUploadBeforeUpload
    /** 移除前的钩子：返回 false 或 reject 会阻止移除 */
    beforeRemove?: JeUploadBeforeRemove
    /** 是否展示文件列表 */
    showFileList?: boolean
    /** 点击文件时内置全屏预览；关闭后仍会抛出 preview 事件，交由使用方自行处理 */
    showPreview?: boolean
    /** 追加到列表上的类名，便于外部微调样式 */
    listClass?: string
    /** 改变文件（新增 / 成功 / 失败）时调用，与 change 事件同源 */
    onChange?: JeUploadOnChange
    /** 移除文件后调用，与 remove 事件同源 */
    onRemove?: JeUploadOnRemove
    /** 点击文件时调用，与 preview 事件同源 */
    onPreview?: JeUploadOnPreview
    /** 上传进度变化时调用，与 progress 事件同源 */
    onProgress?: JeUploadOnProgress
    /** 上传成功时调用，与 success 事件同源 */
    onSuccess?: JeUploadOnSuccess
    /** 上传失败时调用，与 error 事件同源 */
    onError?: JeUploadOnError
    /** 超出 limit 时调用，与 exceed 事件同源 */
    onExceed?: JeUploadOnExceed
    /** 浮层挂载点：选择器或元素；false 表示就地渲染不传送。缺省时按 ConfigProvider → configureJelly → body 回退 */
    teleportTo?: JeTeleportTarget | false
  }>(),
  {
    fileList: () => [],
    accept: '',
    multiple: false,
    drag: false,
    disabled: false,
    listType: 'text',
    autoUpload: false,
    tip: '',
    action: '#',
    method: 'post',
    name: 'file',
    headers: undefined,
    withCredentials: false,
    data: undefined,
    httpRequest: undefined,
    beforeUpload: undefined,
    beforeRemove: undefined,
    showFileList: true,
    showPreview: false,
    listClass: '',
    teleportTo: undefined,
  },
)

/** 浮层挂载点，缺省时跟随 ConfigProvider / configureJelly，最终落到 body */
const teleportTarget = useTeleportTarget(() => props.teleportTo)

const emit = defineEmits<{
  /** v-model:file-list 的更新，列表变化时触发 */
  'update:fileList': [files: JeUploadFile[]]
  /** 选中文件、上传成功、上传失败或移除后触发 */
  change: [file: JeUploadFile, files: JeUploadFile[]]
  /** 移除文件后触发 */
  remove: [file: JeUploadFile]
  /** 选择数量超过 limit 时触发，参数是本次被忽略的原始文件 */
  exceed: [files: File[]]
  /** 点击文件名或缩略图时触发 */
  preview: [file: JeUploadFile]
  /** 上传进度变化（原生 XHR 与模拟上传都会触发） */
  progress: [event: JeUploadProgressEvent, file: JeUploadFile]
  /** 上传成功，第二个参数是服务端响应 */
  success: [response: unknown, file: JeUploadFile]
  /** 上传失败 */
  error: [error: Error, file: JeUploadFile]
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const rootRef = ref<HTMLElement | null>(null)
const files = ref<JeUploadFile[]>([])
const dragging = ref(false)

/** 本组件用 createObjectURL 生成的 blob 地址，移除 / 卸载时要逐个回收 */
const objectUrls = new Set<string>()
/** 模拟上传的定时器，卸载时统一清掉 */
const timers = new Set<ReturnType<typeof setTimeout>>()
/** 进行中的假进度动画；真请求只用原生 progress 事件 */
const rafs = new Map<string, number>()
/**
 * 每个「还没结束」的上传对应一个取消函数。
 * key 用 `文件对象 -> 一次性 id` 的 WeakMap：fileList 可能是外部传入的新对象数组，
 * 用引用本身当 key 比用下标更稳（列表重排、外部替换都不会串号）。
 */
const uploadIds = new WeakMap<object, string>()
const aborters = new Map<string, () => void>()
let uploadSeed = 0

/** 转成响应式代理，item 内部字段（status / percentage）变化才能驱动视图 */
const makeFile = (input: Partial<JeUploadFile> & { name: string }): JeUploadFile =>
  reactive({
    status: 'ready',
    ...input,
  }) as JeUploadFile

/** 外部 v-model 进来的初始值要过一遍 makeFile，否则外部对象的字段改动不是响应式的 */
files.value = props.fileList.map((file) => makeFile(file))

/** 自写体积格式化：1024 进制，最多保留一位小数 */
const formatSize = (size?: number) => {
  if (size === undefined || size <= 0) return ''
  const units = ['B', 'KB', 'MB', 'GB']
  let value = size
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  const rounded = unit === 0 ? Math.round(value) : Math.round(value * 10) / 10
  return `${rounded} ${units[unit]}`
}

const releaseUrl = (file: JeUploadFile) => {
  if (file.url && objectUrls.has(file.url)) {
    URL.revokeObjectURL(file.url)
    objectUrls.delete(file.url)
  }
}

/**
 * 同步给 v-model。只有调用方真的绑了 file-list 才 emit：
 * 否则回写一个未声明的 prop 既无意义，又会让「受控 / 非受控」两种用法互相打架。
 */
const sync = () => {
  if (props.fileList !== undefined) emit('update:fileList', [...files.value])
}

/** 事件里的文件数组统一给一份浅拷贝，避免使用方直接 push 进来绕过组件逻辑 */
const snapshot = () => [...files.value]

/** 每个文件一个一次性 id，用来定位它的取消函数 */
const idOf = (file: JeUploadFile) => {
  let id = uploadIds.get(file)
  if (!id) {
    uploadSeed += 1
    id = `je-upload-${uploadSeed}`
    uploadIds.set(file, id)
  }
  return id
}

/**
 * ProgressEvent 的 loaded / total 是原型上的只读取值器，用 Object.assign 往上写会在严格模式下
 * 抛 TypeError（Cannot set property loaded of #<ProgressEvent> which has only a getter），
 * 之后状态机整条链都断掉。所以走构造函数第二个参数（ProgressEventInit 里就有这三个字段），
 * 只把自定义的 percent 额外挂上去。
 */
const makeProgressEvent = (percent: number, loaded = 0, total = 0): JeUploadProgressEvent =>
  Object.assign(new ProgressEvent('progress', { lengthComputable: total > 0, loaded, total }), {
    percent,
  }) as JeUploadProgressEvent

const reportProgress = (file: JeUploadFile, percent: number, loaded = 0, total = 0) => {
  // 文件可能在上传途中被移除，或者外部把 status 改成了别的值
  if (file.status !== 'uploading' || !files.value.includes(file)) return
  const clamped = Math.round(Math.max(0, Math.min(100, percent)) * 10) / 10
  file.percentage = clamped
  // 只有原生 XHR 才给得出真实 loaded / total，模拟进度留 0
  const event = makeProgressEvent(clamped, loaded, total)
  emit('progress', event, file)
  props.onProgress?.(event, file, snapshot())
}

/**
 * 假进度：本地 blob: / data: 这类地址不会触发原生 progress，
 * 而演示和 mock 上传又恰恰走这条路径，所以补一条缓出曲线让进度条动起来。
 */
const startFakeProgress = (file: JeUploadFile) => {
  const id = idOf(file)
  const duration = 1200
  const start = performance.now()
  const step = (now: number) => {
    if (file.status !== 'uploading' || !files.value.includes(file)) {
      rafs.delete(id)
      return
    }
    const ratio = Math.min(1, (now - start) / duration)
    // 平方缓出：起步快、收尾慢，视觉上更像真实上传
    reportProgress(file, (1 - (1 - ratio) ** 2) * 100)
    if (ratio >= 1) rafs.delete(id)
    else rafs.set(id, requestAnimationFrame(step))
  }
  rafs.set(id, requestAnimationFrame(step))
}

const stopFakeProgress = (file: JeUploadFile) => {
  const id = uploadIds.get(file)
  if (!id) return
  const raf = rafs.get(id)
  if (raf !== undefined) {
    cancelAnimationFrame(raf)
    rafs.delete(id)
  }
}

/** 把 data 里的值转成 FormData 能吃下的形状（Blob 需要带文件名才不丢后缀） */
const toFormValue = (value: string | Blob | [string | Blob, string] | string[]) => {
  if (Array.isArray(value)) {
    const [raw, filename] = value
    if (raw instanceof Blob) return new File([raw], filename ?? 'blob')
    return String(raw)
  }
  return value
}

/** data 支持三种写法：对象 / Promise / 按文件计算的函数，这里统一取一次 */
const resolveData = async (file: File): Promise<JeUploadData> => {
  const source = props.data
  if (source === undefined) return {}
  // 走 typeof 收窄后 Vue 的 PropType 会把函数签名当成「无参」，这里显式断言回真实签名
  if (typeof source === 'function') {
    const compute = source as unknown as (raw: File) => JeUploadAwaitable<JeUploadData>
    return (await compute(file)) ?? {}
  }
  return (await source) ?? {}
}

const resolveHeaders = async (): Promise<Record<string, string>> => props.headers ?? {}

/** 默认上传实现：直接发 XMLHttpRequest，同步返回 xhr 本身，组件据此支持 abort */
const xhrUpload = async (options: JeUploadRequestOptions) => {
  const { action, method, name, file, filename, headers, withCredentials } = options
  const data = await resolveData(file)

  const xhr = new XMLHttpRequest()
  xhr.open(method, action, true)
  xhr.withCredentials = withCredentials
  Object.entries(headers).forEach(([key, value]) => {
    xhr.setRequestHeader(key, value)
  })

  xhr.onload = () => {
    if (xhr.status < 200 || xhr.status >= 300) {
      options.onError(new Error(`上传失败，HTTP ${xhr.status}`))
      return
    }
    // 先按 JSON 解析，失败就原样给出文本，避免服务端返回纯文本时使用方拿不到东西
    let payload: unknown = xhr.responseText
    try {
      payload = JSON.parse(xhr.responseText)
    } catch {
      /* 不是 JSON，保持文本 */
    }
    options.onSuccess(payload)
  }
  xhr.onerror = () => options.onError(new Error('上传失败，网络异常'))
  xhr.ontimeout = () => options.onError(new Error('上传失败，请求超时'))

  xhr.upload.onprogress = (event) => {
    yieldNativeProgress(options.onProgress, event)
  }

  const body = new FormData()
  Object.entries(data).forEach(([key, value]) => {
    body.append(key, toFormValue(value))
  })
  body.append(name, file, filename)
  xhr.send(body)

  return xhr
}

/** 原生 progress 在 lengthComputable 为 false 时算不出百分比，这时候交给假进度兜底 */
const yieldNativeProgress = (
  report: (event: JeUploadProgressEvent) => void,
  event: ProgressEvent,
) => {
  if (!event.lengthComputable || event.total <= 0) return
  report(makeProgressEvent((event.loaded / event.total) * 100, event.loaded, event.total))
}

/** 真正开始一次上传：装配参数 → 交给 httpRequest → 按结果推进状态 */
const startUpload = async (file: JeUploadFile) => {
  const raw = file.raw
  if (!raw) {
    // 演示 / 回显用的条目没有原始文件，没法发请求，退化成状态模拟，行为与旧版一致
    simulateUpload(file)
    return
  }

  const id = idOf(file)
  file.status = 'uploading'
  file.percentage = 0
  startFakeProgress(file)

  let finished = false

  const finish = () => {
    finished = true
    stopFakeProgress(file)
    aborters.delete(id)
  }

  /** abort 是使用方主动取消，不算上传失败，所以状态退回 ready 而不是 fail */
  const resetToReady = () => {
    file.status = 'ready'
    file.percentage = 0
    sync()
  }

  // 请求真正发出去之前（等 headers / data 的那一小段时间）还没有 xhr 可 abort，
  // 但取消必须立刻生效，所以先占位，拿到 xhr 之后再换成真正的取消函数
  aborters.set(id, () => {
    finish()
    resetToReady()
  })

  const onProgress = (event: JeUploadProgressEvent) => {
    // 原生事件比假进度准，收到就停掉动画，避免两条线打架
    stopFakeProgress(file)
    reportProgress(file, event.percent, event.loaded, event.total)
  }

  const onSuccess = (response: unknown) => {
    if (finished) return
    finish()
    file.status = 'success'
    file.percentage = 100
    file.response = response
    sync()
    emit('success', response, file)
    props.onSuccess?.(response, file, snapshot())
    emit('change', file, snapshot())
    props.onChange?.(file, snapshot())
  }

  const onError = (error: Error) => {
    if (finished) return
    finish()
    file.status = 'fail'
    sync()
    emit('error', error, file)
    props.onError?.(error, file, snapshot())
    emit('change', file, snapshot())
    props.onChange?.(file, snapshot())
  }

  const options: JeUploadRequestOptions = {
    action: props.action,
    method: props.method,
    name: props.name,
    file: raw,
    filename: file.name,
    headers: await resolveHeaders(),
    data: await resolveData(raw),
    withCredentials: props.withCredentials,
    onProgress,
    onSuccess,
    onError,
  }

  const handler = props.httpRequest ?? xhrUpload
  try {
    const result = await handler(options)
    // 等待期间可能已经被 abort / 移除，这时不该再挂取消函数
    if (finished) return

    // httpRequest 的返回类型是联合类型，取值前先断言成「可能带 abort 的东西」，
    // 否则 instanceof 收窄在模板 ref 的深层解包下会退化成 {}
    const cancelable = result as { abort?: () => void } | null
    const cancel = () => {
      if (result instanceof XMLHttpRequest) result.abort()
      else cancelable?.abort?.()
      finish()
      resetToReady()
    }

    // 只有能取消的请求才登记；纯 Promise 就让请求自然跑完
    if (result instanceof XMLHttpRequest || typeof cancelable?.abort === 'function') {
      aborters.set(id, cancel)
    }
  } catch (error) {
    // onSuccess / onError 已经结束过的会被 finished 标记，这里只处理「根本没发出去」的情况
    if (!finished) onError(error instanceof Error ? error : new Error(String(error)))
  }
}

/** 纯前端模拟上传：用定时器把状态从 ready 推到 success，不发起任何网络请求 */
const simulateUpload = (file: JeUploadFile) => {
  file.status = 'uploading'
  file.percentage = 0
  startFakeProgress(file)
  const timer = setTimeout(() => {
    timers.delete(timer)
    stopFakeProgress(file)
    if (!files.value.includes(file)) return
    file.status = 'success'
    file.percentage = 100
    sync()
    emit('change', file, snapshot())
    props.onChange?.(file, snapshot())
  }, 900)
  timers.add(timer)
}

/** beforeUpload 的返回值语义：false / reject 中止，File / Blob 替换原文件 */
const applyBeforeUpload = async (raw: File): Promise<File | null> => {
  const hook = props.beforeUpload
  if (!hook) return raw
  try {
    const result = await hook(raw)
    if (result === false) return null
    if (result instanceof File) return result
    if (result instanceof Blob) {
      // Blob 没有 name，用原名包一层，否则 multipart 里会丢掉文件名
      return new File([result], raw.name, { type: result.type || raw.type })
    }
    return raw
  } catch {
    return null
  }
}

const handleFiles = (incoming: File[]) => {
  if (incoming.length === 0 || props.disabled) return

  let selected = incoming
  if (props.limit !== undefined) {
    const rest = props.limit - files.value.length
    if (rest <= 0) {
      emit('exceed', incoming)
      props.onExceed?.(incoming, snapshot())
      return
    }
    if (incoming.length > rest) {
      emit('exceed', incoming)
      props.onExceed?.(incoming, snapshot())
      selected = incoming.slice(0, rest)
    }
  }

  void (async () => {
    for (const raw of selected) {
      const accepted = await applyBeforeUpload(raw)
      if (!accepted) continue
      if (props.limit !== undefined && files.value.length >= props.limit) {
        emit('exceed', [accepted])
        props.onExceed?.([accepted], snapshot())
        continue
      }

      const file = makeFile({ name: accepted.name, size: accepted.size, raw: accepted })
      if (accepted.type.startsWith('image/')) {
        const url = URL.createObjectURL(accepted)
        objectUrls.add(url)
        file.url = url
      }

      files.value = [...files.value, file]
      sync()
      emit('change', file, snapshot())
      props.onChange?.(file, snapshot())
      if (props.autoUpload) void startUpload(file)
    }
  })()
}

const openFileDialog = () => {
  if (props.disabled) return
  inputRef.value?.click()
}

const onInputChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  handleFiles(Array.from(input.files ?? []))
  // 清空 value，否则连续选择同一个文件不会再触发 change
  input.value = ''
}

const onDragEnter = (event: DragEvent) => {
  if (!props.drag || props.disabled) return
  event.preventDefault()
  dragging.value = true
}

const onDragOver = (event: DragEvent) => {
  if (!props.drag || props.disabled) return
  event.preventDefault()
}

const onDragLeave = (event: DragEvent) => {
  if (!props.drag || props.disabled) return
  const related = event.relatedTarget as Node | null
  if (related && (event.currentTarget as HTMLElement).contains(related)) return
  dragging.value = false
}

const onDrop = (event: DragEvent) => {
  if (!props.drag || props.disabled) return
  event.preventDefault()
  dragging.value = false
  handleFiles(Array.from(event.dataTransfer?.files ?? []))
}

/** beforeRemove 允许异步，所以移除链路整体是异步的 */
const remove = async (file: JeUploadFile) => {
  if (props.disabled) return
  if (!files.value.includes(file)) return

  const hook = props.beforeRemove
  if (hook) {
    try {
      if ((await hook(file, snapshot())) === false) return
    } catch {
      return
    }
  }

  // 钩子可能是异步的，等回来时文件也许已经被移除了
  if (!files.value.includes(file)) return
  abortById(file)
  files.value = files.value.filter((item) => item !== file)
  releaseUrl(file)
  sync()
  emit('remove', file)
  props.onRemove?.(file, snapshot())
}

/** 取消指定文件进行中的上传；abort 回调里已经处理了状态与收尾 */
const abortById = (file: JeUploadFile) => {
  const id = uploadIds.get(file)
  if (!id) return
  aborters.get(id)?.()
}

/** 取消上传：不传文件则取消全部 */
const abort = (file?: JeUploadFile) => {
  if (file) {
    abortById(file)
    return
  }
  // 拷贝一份再遍历，取消过程中会改到 aborters
  for (const cancel of [...aborters.values()]) cancel()
}

/** 手动把 ready 的文件推上去；autoUpload 为 false 时配合它使用 */
const submit = () => {
  files.value.filter((file) => file.status === 'ready').forEach((file) => void startUpload(file))
}

/** 清空列表；传 status 数组时只清掉对应状态的条目 */
const clearFiles = (status?: JeUploadStatus[]) => {
  const kept: JeUploadFile[] = []
  files.value.forEach((file) => {
    if (status && !status.includes(file.status ?? 'ready')) {
      kept.push(file)
      return
    }
    abortById(file)
    releaseUrl(file)
  })
  files.value = kept
  sync()
}

/* -------------------------------- 内置图片预览 -------------------------------- */

const viewerOpen = ref(false)
const viewerRef = ref<HTMLElement | null>(null)
const zIndex = ref(nextZIndex())
const previewIndex = ref(0)

/** 只有能拿到图片地址的条目才进预览序列，避免点开一个空白面板 */
const previewable = computed(() => files.value.filter((file) => Boolean(file.url)))
const activePreview = computed(() => previewable.value[previewIndex.value])

/**
 * 预览序列可能因为「上传途中移除文件」「外部替换 fileList」而变短，
 * 这时下标会越界，计数器会算出 4 / 3 这种值。缩到最后一个（空了就直接关掉）。
 */
watch(
  () => previewable.value.length,
  (total) => {
    if (total === 0) {
      closePreview()
      return
    }
    if (previewIndex.value > total - 1) previewIndex.value = total - 1
  },
)

const locked = computed(() => viewerOpen.value)
useScrollLock(locked)
useFocusTrap(viewerRef, locked)

const preview = (file: JeUploadFile) => {
  // 无论是否内置预览都抛出事件，使用方可以完全接管
  emit('preview', file)
  props.onPreview?.(file)
  if (!props.showPreview) return
  const index = previewable.value.findIndex((item) => item === file)
  if (index < 0) return
  previewIndex.value = index
  zIndex.value = nextZIndex()
  viewerOpen.value = true
}

const closePreview = () => {
  if (!viewerOpen.value) return
  viewerOpen.value = false
}

const goPreview = (delta: number) => {
  const total = previewable.value.length
  if (total <= 1) return
  previewIndex.value = (previewIndex.value + delta + total) % total
}

const onPreviewKeydown = (event: KeyboardEvent) => {
  if (!viewerOpen.value) return
  if (event.key === 'Escape') {
    event.stopPropagation()
    closePreview()
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault()
    goPreview(-1)
  } else if (event.key === 'ArrowRight') {
    event.preventDefault()
    goPreview(1)
  }
}

watch(viewerOpen, (open) => {
  if (open) document.addEventListener('keydown', onPreviewKeydown)
  else document.removeEventListener('keydown', onPreviewKeydown)
})

const viewerStyle = computed(() => ({ zIndex: zIndex.value }))

/* ---------------------------------- 生命周期 ---------------------------------- */

watch(
  () => props.fileList,
  (value) => {
    if (!value) return
    // 外部直接改列表时，回收已消失条目的对象地址，避免内存泄漏
    files.value.forEach((file) => {
      if (!value.includes(file)) releaseUrl(file)
    })
    /*
     * 已经是内部代理的条目必须原样保留：sync() 把数组 emit 出去后 v-model 会原样回传，
     * 若这里对每个条目都重新 makeFile，就会造出一批「孤儿代理」——startUpload 的闭包里
     * 持有的还是旧代理，之后写 status / percentage / response 全部落在孤儿上，
     * 视图里永远停在 uploading。只有外部塞进来的新条目才需要包一层响应式。
     */
    const known = new Set(files.value)
    files.value = value.map((file) => {
      if (known.has(file)) return file
      if (file.url) objectUrls.add(file.url)
      return makeFile(file)
    })
  },
)

onBeforeUnmount(() => {
  timers.forEach((timer) => clearTimeout(timer))
  timers.clear()
  rafs.forEach((raf) => cancelAnimationFrame(raf))
  rafs.clear()
  // 卸载时先把在途请求收掉，否则回调会打在已经销毁的组件上
  abort()
  objectUrls.forEach((url) => URL.revokeObjectURL(url))
  objectUrls.clear()
  document.removeEventListener('keydown', onPreviewKeydown)
})

defineExpose({
  /** 取消上传：不传文件则取消全部在途请求 */
  abort,
  /** 手动上传列表中待上传（ready）的文件 */
  submit,
  /** 清空文件列表：传状态数组时只清掉对应状态 */
  clearFiles,
  /** 移除单个文件，会走一遍 beforeRemove */
  handleRemove: remove,
  /** 以编程方式选中文件，等价于用户点选 */
  handleStart: handleFiles,
  /** 内部文件列表（只读快照） */
  files,
})
</script>

<template>
  <div
    ref="rootRef"
    class="je-upload"
    :class="[
      `je-upload--${listType}`,
      listClass,
      { 'is-disabled': disabled, 'is-dragging': dragging, 'has-drag': drag },
    ]"
  >
    <!-- 触发区域 -->
    <div
      v-if="drag"
      class="je-upload__dropzone"
      role="button"
      :tabindex="disabled ? -1 : 0"
      :aria-disabled="disabled"
      aria-label="点击或拖拽文件到此处上传"
      @click="openFileDialog"
      @keydown.enter.prevent="openFileDialog"
      @keydown.space.prevent="openFileDialog"
      @dragenter="onDragEnter"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
    >
      <JeIcon :name="listType === 'picture-card' ? 'plus' : 'upload'" :size="26" />
      <template v-if="listType !== 'picture-card'">
        <p class="je-upload__drop-text">将文件拖到此处，或<em>点击上传</em></p>
        <p class="je-upload__drop-hint">窄屏请点击选择</p>
      </template>
    </div>

    <button
      v-else
      type="button"
      class="je-upload__trigger"
      :disabled="disabled"
      @click="openFileDialog"
    >
      <!-- 触发按钮内容，替换默认的图标 + 文案 -->
      <slot name="trigger">
        <JeIcon
          :name="listType === 'picture-card' ? 'plus' : 'upload'"
          :size="listType === 'picture-card' ? 24 : 16"
        />
        <span v-if="listType !== 'picture-card'">点击上传</span>
      </slot>
    </button>

    <input
      ref="inputRef"
      class="je-upload__input"
      type="file"
      :accept="accept || undefined"
      :multiple="multiple"
      :disabled="disabled"
      @change="onInputChange"
    >

    <p v-if="listType !== 'picture-card'" class="je-upload__tip-holder">
      <!-- 提示区域，替换默认的 tip 文案 -->
      <slot name="tip">
        <span v-if="tip" class="je-upload__tip">{{ tip }}</span>
      </slot>
    </p>

    <ul
      v-if="showFileList && files.length > 0"
      class="je-upload__list"
      :class="`je-upload__list--${listType}`"
    >
      <li
        v-for="(file, index) in files"
        :key="`${index}-${file.name}-${file.size ?? 0}`"
        class="je-upload__item"
        :class="{ 'is-uploading': file.status === 'uploading', 'is-fail': file.status === 'fail' }"
      >
        <!-- 自定义列表项内容，file 为当前文件、index 为序号 -->
        <slot name="file" :file="file" :index="index">
          <div
            class="je-upload__thumb-wrap"
            :class="{ 'is-clickable': file.url }"
            @click="file.url && preview(file)"
          >
            <img v-if="file.url" class="je-upload__thumb" :src="file.url" :alt="file.name" >
            <JeIcon v-else name="file" :size="listType === 'picture-card' ? 28 : 18" />

            <!-- 照片墙：悬停 / 聚焦时浮现的操作遮罩（触屏常显），预览与删除都收在这里 -->
            <div v-if="listType === 'picture-card'" class="je-upload__card-actions">
              <button
                type="button"
                class="je-upload__card-action"
                :disabled="!file.url"
                aria-label="预览"
                @click.stop="file.url && preview(file)"
              >
                <JeIcon name="zoom-in" :size="18" />
              </button>
              <button
                type="button"
                class="je-upload__card-action"
                :disabled="disabled"
                aria-label="删除"
                @click.stop="remove(file)"
              >
                <JeIcon name="trash" :size="18" />
              </button>
            </div>
          </div>

          <div class="je-upload__info">
            <button type="button" class="je-upload__name" @click="preview(file)">
              {{ file.name }}
            </button>
            <span v-if="formatSize(file.size)" class="je-upload__size">
              {{ formatSize(file.size) }}
            </span>
          </div>
        </slot>

        <JeIcon
          v-if="file.status === 'uploading'"
          name="loading"
          :size="16"
          spin
          class="je-upload__status is-uploading"
        />
        <JeIcon
          v-else-if="file.status === 'success'"
          name="success"
          :size="16"
          class="je-upload__status is-success"
        />
        <JeIcon
          v-else-if="file.status === 'fail'"
          name="error"
          :size="16"
          class="je-upload__status is-fail"
        />

        <button
          type="button"
          class="je-upload__remove"
          :disabled="disabled"
          :aria-label="`删除 ${file.name}`"
          @click="remove(file)"
        >
          <JeIcon name="close" :size="14" />
        </button>

        <span
          v-if="file.status === 'uploading' || file.status === 'success'"
          class="je-upload__progress"
          role="progressbar"
          :aria-valuenow="Math.round(file.percentage ?? 0)"
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <span
            class="je-upload__progress-bar"
            :class="{ 'is-done': file.status === 'success' }"
            :style="{ width: `${file.percentage ?? 0}%` }"
          />
        </span>
      </li>
    </ul>

    <p v-if="listType === 'picture-card' && (tip || $slots.tip)" class="je-upload__tip-holder">
      <!-- 提示区域，替换默认的 tip 文案 -->
      <slot name="tip">
        <span class="je-upload__tip">{{ tip }}</span>
      </slot>
    </p>

    <div v-if="$slots.default" class="je-upload__extra">
      <!-- 默认插槽（与触发按钮互斥）：需要完全自定义上传入口时整个交出去 -->
      <slot />
    </div>
  </div>

  <Teleport :to="teleportTarget === false ? 'body' : teleportTarget" :disabled="teleportTarget === false">
    <div
      v-if="showPreview"
      ref="viewerRef"
      class="je-upload__viewer"
      :class="{ 'is-open': viewerOpen }"
      :style="viewerStyle"
      role="dialog"
      aria-modal="true"
      aria-label="图片预览"
      tabindex="-1"
      :aria-hidden="!viewerOpen"
      @click="closePreview"
    >
      <img
        v-if="viewerOpen && activePreview?.url"
        class="je-upload__viewer-img"
        :src="activePreview.url"
        :alt="activePreview.name"
        @click.stop
      >

      <button
        v-if="previewable.length > 1"
        type="button"
        class="je-upload__viewer-nav je-upload__viewer-nav--prev"
        aria-label="上一张"
        @click.stop="goPreview(-1)"
      >
        <JeIcon name="chevron-left" :size="22" />
      </button>

      <button
        v-if="previewable.length > 1"
        type="button"
        class="je-upload__viewer-nav je-upload__viewer-nav--next"
        aria-label="下一张"
        @click.stop="goPreview(1)"
      >
        <JeIcon name="chevron-right" :size="22" />
      </button>

      <div v-if="previewable.length > 1" class="je-upload__viewer-counter" @click.stop>
        {{ previewIndex + 1 }} / {{ previewable.length }}
      </div>

      <div class="je-upload__viewer-toolbar" @click.stop>
        <button type="button" class="je-upload__viewer-tool" aria-label="关闭" @click="closePreview">
          <JeIcon name="close" :size="20" />
        </button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.je-upload {
  font-family: inherit;
  font-size: 14px;
}

.je-upload__input {
  display: none;
}

.je-upload__dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 26px 16px;
  color: var(--je-text-muted);
  background: var(--je-surface);
  border: 2px dashed var(--je-border-color);
  border-radius: var(--je-radius);
  cursor: pointer;
  outline: none;
  transition: border-color var(--je-duration) ease, background var(--je-duration) ease,
    box-shadow var(--je-duration) ease;
}

.je-upload__dropzone:hover {
  color: var(--je-text);
  background: var(--je-surface-hover);
}

.je-upload__dropzone:focus-visible {
  border-color: var(--je-primary);
  outline: 2px solid var(--je-primary);
  outline-offset: 2px;
}

/* 拖拽进入时高亮整个区域 */
.je-upload.is-dragging .je-upload__dropzone {
  color: var(--je-text);
  background: color-mix(in srgb, var(--je-primary) 20%, transparent);
  border-color: var(--je-primary);
  box-shadow: 0 12px 32px color-mix(in srgb, var(--je-primary) 32%, transparent);
}

.je-upload__drop-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
}

.je-upload__drop-text em {
  color: color-mix(in srgb, var(--je-primary) 65%, white);
  font-style: normal;
  font-weight: 600;
}

.je-upload__drop-hint {
  margin: 0;
  font-size: 12px;
  color: var(--je-text-faint);
}

.je-upload__trigger {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 18px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  color: var(--je-text);
  background: var(--je-surface);
  border: var(--je-border);
  border-radius: var(--je-radius);
  cursor: pointer;
  outline: none;
  transition: background var(--je-duration) ease, box-shadow var(--je-duration) ease;
}

.je-upload__trigger:hover:not(:disabled) {
  background: color-mix(in srgb, var(--je-primary) 24%, transparent);
  box-shadow: 0 8px 22px color-mix(in srgb, var(--je-primary) 26%, transparent);
}

.je-upload__trigger:focus-visible {
  outline: 2px solid var(--je-primary);
  outline-offset: 2px;
}

/* tip 容器用空 <p> 常驻，保证插槽位次稳定；没有内容时不占高度 */
.je-upload__tip-holder {
  margin: 0;
}

.je-upload__tip-holder:not(:empty) {
  margin-top: 10px;
}

.je-upload__tip {
  font-size: 12px;
  color: var(--je-text-faint);
}

/* 默认插槽的内容块：与触发区 / 列表之间留出统一的间距 */
.je-upload__extra {
  margin-top: 14px;
}

.je-upload__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 14px 0 0;
  padding: 0;
  list-style: none;
}

.je-upload__item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: var(--je-surface);
  border: var(--je-border);
  border-radius: var(--je-radius-sm);
}

.je-upload__thumb-wrap {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  overflow: hidden;
  color: var(--je-text-muted);
  background: var(--je-surface-hover);
  border: var(--je-border);
  border-radius: var(--je-radius-sm);
}

.je-upload__thumb-wrap.is-clickable {
  cursor: zoom-in;
}

.je-upload__thumb {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.je-upload__info {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.je-upload__name {
  overflow: hidden;
  padding: 0;
  font-family: inherit;
  font-size: 14px;
  color: var(--je-text);
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: none;
  border: none;
  cursor: pointer;
}

.je-upload__name:hover {
  color: color-mix(in srgb, var(--je-primary) 65%, white);
}

.je-upload__size {
  font-size: 12px;
  color: var(--je-text-faint);
}

.je-upload__status {
  flex-shrink: 0;
}

.je-upload__status.is-success {
  color: var(--je-success);
}

.je-upload__status.is-fail {
  color: var(--je-danger);
}

.je-upload__status.is-uploading {
  color: color-mix(in srgb, var(--je-primary) 70%, white);
}

.je-upload__remove {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  color: var(--je-text-muted);
  background: none;
  border: none;
  border-radius: var(--je-radius-sm);
  cursor: pointer;
  outline: none;
  transition: color var(--je-duration) ease, background var(--je-duration) ease;
}

.je-upload__remove:hover:not(:disabled) {
  color: var(--je-danger);
  background: var(--je-surface-hover);
}

.je-upload__remove:focus-visible {
  outline: 2px solid var(--je-primary);
  outline-offset: 2px;
}

/* 进度条贴在条目底边，绝对定位所以不参与 flex 排版 */
.je-upload__progress {
  position: absolute;
  bottom: 0;
  left: 10px;
  right: 10px;
  height: 2px;
  overflow: hidden;
  background: color-mix(in srgb, var(--je-primary) 18%, transparent);
  border-radius: 999px;
}

.je-upload__progress-bar {
  display: block;
  height: 100%;
  background: linear-gradient(
    90deg,
    var(--je-primary),
    color-mix(in srgb, var(--je-primary-end) 85%, white)
  );
  border-radius: inherit;
  transition: width 0.2s linear;
}

.je-upload__progress-bar.is-done {
  background: var(--je-success);
}

.je-upload.is-disabled .je-upload__dropzone,
.je-upload.is-disabled .je-upload__trigger {
  cursor: not-allowed;
  opacity: 0.5;
}

/* ---------------- picture：图文列表 ---------------- */

.je-upload__list--picture .je-upload__item {
  padding: 6px 10px;
}

/* ---------------- picture-card：照片墙 ---------------- */

/* 照片墙整体是一个 wrap 容器：触发入口与图片队列在同一行内流动 */
.je-upload--picture-card {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 10px;
}

/* 列表不生成盒子，<li> 直接参与根容器的 wrap —— 触发入口才能排在图片队列之后 */
.je-upload__list--picture-card {
  display: contents;
}

/* 方形卡片：图片铺满整格，文件名 / 体积不再占卡片下方的高度（对齐 element-plus） */
.je-upload__list--picture-card .je-upload__item {
  box-sizing: border-box;
  width: 148px;
  height: 148px;
  padding: 0;
  overflow: hidden;
}

.je-upload__list--picture-card .je-upload__thumb-wrap {
  position: relative;
  width: 100%;
  height: 100%;
  border: none;
  border-radius: 0;
}

.je-upload__list--picture-card .je-upload__info {
  display: none;
}

/* 操作遮罩：默认透明且不拦截点击，悬停 / 聚焦（触屏）时才浮现 */
.je-upload__card-actions {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.je-upload__list--picture-card .je-upload__item:hover .je-upload__card-actions,
.je-upload__list--picture-card .je-upload__item:focus-within .je-upload__card-actions {
  pointer-events: auto;
  opacity: 1;
}

.je-upload__card-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  /* 压在缩略图上的半透明黑底，图标固定浅色 */
  color: var(--je-text-on-color);
  background: rgba(0, 0, 0, 0.55);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  outline: none;
  transition: background 0.2s ease;
}

.je-upload__card-action:hover:not(:disabled) {
  background: color-mix(in srgb, var(--je-primary) 75%, transparent);
}

.je-upload__card-action:focus-visible {
  outline: 2px solid var(--je-primary);
  outline-offset: 2px;
}

.je-upload__card-action:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

/* 状态角标压在右上角常显（删除已收进遮罩，不再和它抢位置）；底色用面板色垫一下保证可见 */
.je-upload__list--picture-card .je-upload__status {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 22px;
  height: 22px;
  background: color-mix(in srgb, var(--je-popup) 92%, transparent);
  border-radius: 50%;
}

/* 条目上的常驻删除按钮在照片墙里不再渲染，删除走遮罩里的操作按钮 */
.je-upload__list--picture-card .je-upload__remove {
  display: none;
}

/* 进度条贴卡片底边铺满 */
.je-upload__list--picture-card .je-upload__progress {
  right: 0;
  left: 0;
}

/* 方形触发热区，和照片墙卡片同尺寸；内部只放一个加号图标、横竖居中，并排在图片队列之后 */
.je-upload--picture-card .je-upload__dropzone,
.je-upload--picture-card .je-upload__trigger {
  order: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 148px;
  height: 148px;
  padding: 0;
  border: 1px dashed var(--je-border-color);
  border-radius: var(--je-radius);
}

/* 触发热区 hover 只强调描边，不带实体按钮那套底色与光晕 */
.je-upload--picture-card .je-upload__trigger:hover:not(:disabled),
.je-upload--picture-card .je-upload__dropzone:hover {
  background: var(--je-surface);
  border-color: var(--je-primary);
  box-shadow: none;
}

/* 提示整行铺满，不与卡片 / 入口挤在同一行 */
.je-upload--picture-card .je-upload__tip-holder {
  order: 2;
  flex: 0 0 100%;
  margin-top: 0;
}

/* 触屏设备（含平板）没有 hover，操作按钮常显，否则没法预览 / 删除 */
@media (hover: none) {
  .je-upload__list--picture-card .je-upload__card-actions {
    pointer-events: auto;
    opacity: 1;
  }
}

/* ---------------- 内置图片预览浮层 ---------------- */

/* 面板常驻 DOM，收起态用 visibility 而非 display，保住过渡又能被读屏忽略 */
.je-upload__viewer {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: inherit;
  background: rgba(0, 0, 0, 0.82);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  outline: none;
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.28s ease, visibility 0s linear 0.28s;
}

.je-upload__viewer.is-open {
  pointer-events: auto;
  opacity: 1;
  visibility: visible;
  transition: opacity 0.28s ease;
}

.je-upload__viewer-img {
  max-width: 96vw;
  max-height: 82vh;
  object-fit: contain;
  user-select: none;
  -webkit-user-drag: none;
}

.je-upload__viewer-nav {
  position: absolute;
  top: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  /* 预览浮层是深色全屏层，图标固定浅色 */
  color: var(--je-text-on-color);
  background: rgba(255, 255, 255, 0.12);
  border: var(--je-border);
  border-radius: 50%;
  cursor: pointer;
  transform: translateY(-50%);
  transition: background 0.2s ease;
}

.je-upload__viewer-nav:hover {
  background: color-mix(in srgb, var(--je-primary) 55%, transparent);
}

.je-upload__viewer-nav--prev {
  left: 12px;
}

.je-upload__viewer-nav--next {
  right: 12px;
}

.je-upload__viewer-counter {
  position: absolute;
  top: calc(14px + env(safe-area-inset-top, 0px));
  left: 50%;
  padding: 4px 12px;
  font-size: 13px;
  /* 深色全屏层上固定浅色，略微降透明度保持次要感 */
  color: color-mix(in srgb, var(--je-text-on-color) 78%, transparent);
  background: rgba(255, 255, 255, 0.12);
  border-radius: 999px;
  transform: translateX(-50%);
}

.je-upload__viewer-toolbar {
  position: absolute;
  bottom: calc(18px + env(safe-area-inset-bottom, 0px));
  left: 50%;
  display: flex;
  gap: 6px;
  padding: 5px;
  background: rgba(255, 255, 255, 0.12);
  border: var(--je-border);
  border-radius: 999px;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  transform: translateX(-50%);
}

.je-upload__viewer-tool {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  /* 深色全屏层上固定浅色 */
  color: var(--je-text-on-color);
  background: transparent;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: background 0.2s ease;
}

.je-upload__viewer-tool:hover {
  background: color-mix(in srgb, var(--je-primary) 55%, transparent);
}

.je-upload__viewer-tool:focus-visible,
.je-upload__viewer-nav:focus-visible,
.je-upload__viewer:focus-visible {
  outline: 2px solid var(--je-primary);
  outline-offset: 2px;
}

/* 窄屏：热区不小于 44px，浮层按钮上移避开底部安全区 */
@media (max-width: 768px) {
  .je-upload__dropzone {
    min-height: 44px;
    padding: 24px 16px;
  }

  .je-upload__trigger,
  .je-upload__name,
  .je-upload__remove {
    min-height: 44px;
  }

  .je-upload__remove {
    width: 44px;
  }

  .je-upload__thumb-wrap {
    width: 52px;
    height: 52px;
  }

  /* 照片墙卡片窄屏下放大，触控更好点；仍然是方形 */
  .je-upload__list--picture-card .je-upload__item,
  .je-upload--picture-card .je-upload__dropzone,
  .je-upload--picture-card .je-upload__trigger {
    width: 132px;
    height: 132px;
    min-height: 132px;
  }

  .je-upload__list--picture-card .je-upload__thumb-wrap {
    width: 100%;
    height: 100%;
  }

  /* 触屏没有 hover，遮罩里的操作按钮必须常显，否则没法预览 / 删除；44px 保证热区 */
  .je-upload__list--picture-card .je-upload__card-actions {
    pointer-events: auto;
    opacity: 1;
  }

  .je-upload__card-action {
    width: 44px;
    height: 44px;
  }

  .je-upload__viewer-img {
    max-width: 100vw;
    max-height: 70vh;
  }

  .je-upload__viewer-tool {
    width: 44px;
    height: 44px;
  }

  .je-upload__viewer-nav {
    top: auto;
    bottom: calc(84px + env(safe-area-inset-bottom, 0px));
    transform: none;
  }

  .je-upload__viewer-toolbar {
    bottom: calc(18px + env(safe-area-inset-bottom, 0px));
  }
}

/*
 * 减弱动效时全部瞬切。
 * .je-upload__viewer.is-open 里的 transition 特异性比单个类高，只写基础类会把它反压回来，
 * 所以状态选择器必须一起列进来。
 */
@media (prefers-reduced-motion: reduce) {
  .je-upload__dropzone,
  .je-upload__trigger,
  .je-upload__remove,
  .je-upload__viewer,
  .je-upload__viewer.is-open,
  .je-upload__progress-bar,
  .je-upload__card-actions,
  .je-upload__card-action {
    transition: none;
  }
}
</style>
