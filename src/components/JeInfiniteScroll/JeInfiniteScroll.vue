<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import JeIcon from '../JeIcon/JeIcon.vue'

defineOptions({ name: 'JeInfiniteScroll' })

const props = withDefaults(
  defineProps<{
    /** 是否正在加载 */
    loading?: boolean
    /** 是否已全部加载完，置 true 后不再触发 load */
    finished?: boolean
    /** 是否加载失败，点击状态区可重试 */
    error?: boolean
    /** 距滚动容器底部多少像素时触发加载 */
    offset?: number
    /** 挂载时立即检查一次（内容不足一屏时很有用） */
    immediateCheck?: boolean
    /** 加载中提示 */
    loadingText?: string
    /** 加载完成提示 */
    finishedText?: string
    /** 加载失败提示 */
    errorText?: string
  }>(),
  {
    loading: false,
    finished: false,
    error: false,
    offset: 300,
    immediateCheck: true,
    loadingText: '加载中...',
    finishedText: '没有更多了',
    errorText: '加载失败，点击重试',
  },
)

const emit = defineEmits<{
  /** 滚动到底部附近，需要加载下一页 */
  load: []
}>()

const rootRef = ref<HTMLElement | null>(null)

/** 已发出 load 但调用方尚未把 loading 置回，避免同一批内容重复触发 */
let pending = false
let observer: ResizeObserver | null = null

/** 找到最近的可滚动祖先，没有就退回文档 */
const getScrollParent = (el: HTMLElement | null): HTMLElement | Window => {
  let node = el?.parentElement ?? null
  while (node) {
    const overflowY = getComputedStyle(node).overflowY
    if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight) {
      return node
    }
    node = node.parentElement
  }
  return window
}

const check = () => {
  const el = rootRef.value
  if (!el || pending || props.loading || props.finished || props.error) return

  const parent = getScrollParent(el)
  const parentBottom =
    parent === window
      ? window.innerHeight
      : (parent as HTMLElement).getBoundingClientRect().bottom

  if (el.getBoundingClientRect().bottom - parentBottom < props.offset) {
    pending = true
    emit('load')
  }
}

const state = computed(() => {
  if (props.loading) return 'loading'
  if (props.error) return 'error'
  if (props.finished) return 'finished'
  return ''
})

const stateText = computed(() => {
  if (state.value === 'loading') return props.loadingText
  if (state.value === 'error') return props.errorText
  if (state.value === 'finished') return props.finishedText
  return ''
})

const onStatusClick = () => {
  if (state.value !== 'error' || pending) return
  pending = true
  emit('load')
}

onMounted(() => {
  // 捕获阶段监听：嵌套滚动容器（如文档站主内容区）的滚动也能收到
  window.addEventListener('scroll', check, true)
  observer = new ResizeObserver(check)
  if (rootRef.value) observer.observe(rootRef.value)
  if (props.immediateCheck) nextTick(check)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', check, true)
  observer?.disconnect()
  observer = null
})

watch(
  () => [props.loading, props.finished, props.error] as const,
  ([loading]) => {
    if (loading) return
    pending = false
    nextTick(check)
  },
)
</script>

<template>
  <div ref="rootRef" class="je-infinite-scroll">
    <slot />

    <div
      v-if="state"
      class="je-infinite-scroll__status"
      :class="`is-${state}`"
      @click="onStatusClick"
    >
      <slot :name="state" :text="stateText">
        <JeIcon
          v-if="state === 'loading'"
          class="je-infinite-scroll__spinner"
          name="loading"
          spin
          :size="16"
        />
        <span class="je-infinite-scroll__text">{{ stateText }}</span>
      </slot>
    </div>
  </div>
</template>

<style scoped>
.je-infinite-scroll {
  font-family: inherit;
}

.je-infinite-scroll__status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 14px 0;
  font-size: 13px;
  line-height: 1.4;
  color: var(--je-text-faint);
}

.je-infinite-scroll__status.is-error {
  color: var(--je-danger);
  cursor: pointer;
}

.je-infinite-scroll__spinner {
  color: var(--je-primary);
}

.je-infinite-scroll__text {
  white-space: nowrap;
}

@media (max-width: 768px) {
  /* 触屏上状态区保持足够大的点击热区，失败时方便重试 */
  .je-infinite-scroll__status {
    min-height: 44px;
    padding: 10px 0;
  }
}
</style>
