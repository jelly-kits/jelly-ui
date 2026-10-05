<script setup lang="ts">
import { computed, ref } from 'vue'
import JeIcon from '../JeIcon/JeIcon.vue'
import { useIsMobile } from '../../core/useMediaQuery'
import { buildPager, type JePagerItem } from './types'

defineOptions({ name: 'JePagination' })

const props = withDefaults(
  defineProps<{
    modelValue?: number
    total?: number
    pageSize?: number
    pageSizes?: number[]
    /** 支持 total / sizes / prev / pager / next / jumper，逗号分隔且按顺序渲染 */
    layout?: string
    background?: boolean
    small?: boolean
    disabled?: boolean
    hideOnSinglePage?: boolean
    pagerCount?: number
  }>(),
  {
    modelValue: 1,
    total: 0,
    pageSize: 10,
    pageSizes: () => [10, 20, 50, 100],
    layout: 'prev, pager, next',
    background: false,
    small: false,
    disabled: false,
    hideOnSinglePage: false,
    pagerCount: 7,
  },
)

const emit = defineEmits<{
  'update:modelValue': [page: number]
  'update:pageSize': [size: number]
  change: [page: number, pageSize: number]
  'current-change': [page: number]
  'size-change': [size: number]
}>()

const isMobile = useIsMobile()

const pageCount = computed(() => {
  const size = props.pageSize > 0 ? props.pageSize : 1
  return Math.max(1, Math.ceil(Math.max(0, props.total) / size))
})

/** 对外始终暴露合法页码，避免父级传入越界值 */
const currentPage = computed(() => {
  const page = Math.floor(props.modelValue) || 1
  return Math.min(Math.max(1, page), pageCount.value)
})

const layoutItems = computed(() =>
  props.layout
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0),
)

const pagerItems = computed<JePagerItem[]>(() =>
  isMobile.value
    ? [currentPage.value]
    : buildPager(currentPage.value, pageCount.value, props.pagerCount),
)

const visible = computed(() => !props.hideOnSinglePage || pageCount.value > 1)

const go = (page: number) => {
  if (props.disabled) return
  const next = Math.min(Math.max(1, Math.floor(page)), pageCount.value)
  if (next === currentPage.value) return
  emit('update:modelValue', next)
  emit('change', next, props.pageSize)
  emit('current-change', next)
}

const onSizeChange = (event: Event) => {
  const select = event.target as HTMLSelectElement
  const size = Number(select.value)
  if (!size) return
  emit('update:pageSize', size)
  emit('size-change', size)

  const maxPage = Math.max(1, Math.ceil(Math.max(0, props.total) / size))
  if (currentPage.value > maxPage) {
    emit('update:modelValue', maxPage)
    emit('change', maxPage, size)
    emit('current-change', maxPage)
  }
}

const jumpValue = ref('')

const onJump = () => {
  const page = Number.parseInt(jumpValue.value, 10)
  if (!Number.isNaN(page)) go(page)
  jumpValue.value = ''
}
</script>

<template>
  <nav
    v-if="visible"
    class="je-pagination"
    :class="{ 'is-background': background, 'is-small': small, 'is-disabled': disabled }"
    aria-label="分页"
  >
    <template v-for="(item, index) in layoutItems" :key="`${item}-${index}`">
      <span v-if="item === 'total'" class="je-pagination__total">共 {{ total }} 条</span>

      <label v-else-if="item === 'sizes'" class="je-pagination__sizes">
        <select
          :value="pageSize"
          :disabled="disabled"
          aria-label="每页条数"
          @change="onSizeChange"
        >
          <option v-for="size in pageSizes" :key="size" :value="size">{{ size }} 条/页</option>
        </select>
        <JeIcon name="chevron-down" :size="14" />
      </label>

      <button
        v-else-if="item === 'prev'"
        type="button"
        class="je-pagination__btn"
        aria-label="上一页"
        :disabled="disabled || currentPage <= 1"
        @click="go(currentPage - 1)"
      >
        <JeIcon name="chevron-left" :size="16" />
      </button>

      <template v-else-if="item === 'pager'">
        <template v-for="pager in pagerItems" :key="pager">
          <span v-if="typeof pager !== 'number'" class="je-pagination__ellipsis" aria-hidden="true">
            ⋯
          </span>
          <button
            v-else
            type="button"
            class="je-pagination__btn"
            :class="{ 'is-active': pager === currentPage }"
            :aria-label="`第 ${pager} 页`"
            :aria-current="pager === currentPage ? 'page' : undefined"
            :disabled="disabled"
            @click="go(pager)"
          >
            {{ pager }}
          </button>
        </template>
      </template>

      <button
        v-else-if="item === 'next'"
        type="button"
        class="je-pagination__btn"
        aria-label="下一页"
        :disabled="disabled || currentPage >= pageCount"
        @click="go(currentPage + 1)"
      >
        <JeIcon name="chevron-right" :size="16" />
      </button>

      <span v-else-if="item === 'jumper'" class="je-pagination__jumper">
        前往
        <input
          v-model="jumpValue"
          class="je-pagination__input"
          type="text"
          inputmode="numeric"
          aria-label="跳转页码"
          :disabled="disabled"
          @keydown.enter="onJump"
          @blur="onJump"
        />
        页
      </span>
    </template>
  </nav>
</template>

<style scoped>
.je-pagination {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  box-sizing: border-box;
  font-family: inherit;
  font-size: 13px;
  color: var(--je-text-muted);
}

.je-pagination__total {
  color: var(--je-text-faint);
}

.je-pagination__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  min-width: 36px;
  height: 36px;
  padding: 0 6px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  color: var(--je-text-muted);
  background: none;
  border: var(--je-border);
  border-radius: var(--je-radius-sm);
  cursor: pointer;
  outline: none;
  transition: color var(--je-duration) ease, background var(--je-duration) ease,
    border-color var(--je-duration) ease;
}

.je-pagination__btn:hover:not(:disabled) {
  color: var(--je-text);
  background: var(--je-surface-hover);
}

.je-pagination__btn:focus-visible {
  outline: 2px solid var(--je-primary);
  outline-offset: 2px;
}

.je-pagination__btn:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.je-pagination__btn.is-active {
  /* 页码压在品牌渐变上，文字固定浅色 */
  color: var(--je-text-on-color);
  font-weight: 600;
  background: linear-gradient(135deg, var(--je-primary), var(--je-primary-end));
  border-color: transparent;
  box-shadow: 0 6px 18px color-mix(in srgb, var(--je-primary) 35%, transparent);
}

.je-pagination__ellipsis {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 36px;
  color: var(--je-text-faint);
  letter-spacing: 2px;
  user-select: none;
}

.je-pagination__sizes {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.je-pagination__sizes select {
  height: 36px;
  padding: 0 28px 0 10px;
  font-family: inherit;
  font-size: 13px;
  color: var(--je-text-muted);
  appearance: none;
  cursor: pointer;
  background: var(--je-surface);
  border: var(--je-border);
  border-radius: var(--je-radius-sm);
  outline: none;
}

.je-pagination__sizes select:focus-visible {
  outline: 2px solid var(--je-primary);
  outline-offset: 2px;
}

.je-pagination__sizes select option {
  color: #1f2430;
  background: #ffffff;
}

.je-pagination__sizes .je-icon {
  position: absolute;
  right: 8px;
  color: var(--je-text-faint);
  pointer-events: none;
}

.je-pagination__jumper {
  display: inline-flex;
  gap: 6px;
  align-items: center;
}

.je-pagination__input {
  width: 52px;
  height: 36px;
  font-family: inherit;
  font-size: 13px;
  color: var(--je-text);
  text-align: center;
  background: var(--je-surface);
  border: var(--je-border);
  border-radius: var(--je-radius-sm);
  outline: none;
}

.je-pagination__input:focus-visible {
  outline: 2px solid var(--je-primary);
  outline-offset: 2px;
}

/* 背景模式：按钮式底色 */
.je-pagination.is-background .je-pagination__btn {
  background: var(--je-surface);
  border-color: transparent;
}

.je-pagination.is-background .je-pagination__btn:hover:not(:disabled) {
  background: var(--je-surface-hover);
}

.je-pagination.is-background .je-pagination__btn.is-active {
  background: linear-gradient(135deg, var(--je-primary), var(--je-primary-end));
}

/* 小尺寸 */
.je-pagination.is-small .je-pagination__btn {
  min-width: 28px;
  height: 28px;
  font-size: 12px;
}

.je-pagination.is-small .je-pagination__sizes select,
.je-pagination.is-small .je-pagination__input {
  height: 28px;
}

.je-pagination.is-small .je-pagination__ellipsis {
  height: 28px;
}

.je-pagination.is-disabled {
  opacity: 0.6;
}

/* 窄屏：热区统一拉到 44px，页码已由 JS 精简为 prev / 当前页 / next */
@media (max-width: 768px) {
  .je-pagination {
    gap: 6px;
  }

  .je-pagination__btn,
  .je-pagination.is-small .je-pagination__btn,
  .je-pagination__sizes select,
  .je-pagination.is-small .je-pagination__sizes select,
  .je-pagination__input,
  .je-pagination.is-small .je-pagination__input {
    min-width: 44px;
    height: 44px;
  }

  .je-pagination__ellipsis,
  .je-pagination.is-small .je-pagination__ellipsis {
    height: 44px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .je-pagination__btn {
    transition: none;
  }
}
</style>
