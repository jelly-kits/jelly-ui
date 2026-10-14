<script setup lang="ts">
import { computed, ref } from 'vue'
import JeIcon from '../JeIcon/JeIcon.vue'
import JeSelect from '../JeSelect/JeSelect.vue'
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

/** 每页条数下拉的选项，文案与原来的原生 select 一致 */
const sizeOptions = computed(() =>
  props.pageSizes.map((size) => ({ label: `${size} 条/页`, value: size })),
)

const onSizeChange = (value: string | number) => {
  const size = Number(value)
  if (!size || size === props.pageSize) return
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

      <div
        v-else-if="item === 'sizes'"
        class="je-pagination__sizes"
        role="group"
        aria-label="每页条数"
      >
        <je-select
          :model-value="pageSize"
          :options="sizeOptions"
          :size="small ? 'small' : 'default'"
          :disabled="disabled"
          @update:model-value="onSizeChange"
        />
      </div>

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
  /* 页码按钮 / 每页条数 / 跳页输入共用的高度与字号档位；窄屏只改这两个变量的指向 */
  --je-pagination-h: 36px;
  --je-pagination-fs: 13px;

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
  min-width: var(--je-pagination-h);
  height: var(--je-pagination-h);
  padding: 0 6px;
  font-family: inherit;
  font-size: var(--je-pagination-fs);
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
  height: var(--je-pagination-h);
  color: var(--je-text-faint);
  letter-spacing: 2px;
  user-select: none;
}

.je-pagination__sizes {
  display: inline-flex;
  align-items: center;
}

/* 下拉的高度与字号跟随分页档位，避免和页码按钮错位；选项行仍用 JeSelect 自己的一档 */
.je-pagination__sizes :deep(.je-select) {
  --js-h: var(--je-pagination-h);
  --js-fs: var(--je-pagination-fs);
}

.je-pagination__jumper {
  display: inline-flex;
  gap: 6px;
  align-items: center;
}

.je-pagination__input {
  width: 52px;
  height: var(--je-pagination-h);
  font-family: inherit;
  font-size: var(--je-pagination-fs);
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
.je-pagination.is-small {
  --je-pagination-h: 28px;
  --je-pagination-fs: 12px;
}

.je-pagination.is-disabled {
  opacity: 0.6;
}

/* 窄屏：页码已由 JS 精简为 prev / 当前页 / next；尺寸仍分档，small 落到触屏的小档 */
@media (max-width: 768px) {
  .je-pagination {
    --je-pagination-h: var(--je-touch-h);
    --je-pagination-fs: var(--je-touch-fs);
    gap: 6px;
  }

  .je-pagination.is-small {
    --je-pagination-h: var(--je-touch-h-sm);
    --je-pagination-fs: var(--je-touch-fs-sm);
  }

  /* 跳页是真实输入框，字号低于 16px 时 iOS 聚焦会自动放大页面 */
  .je-pagination__input {
    font-size: max(16px, var(--je-pagination-fs));
  }
}

@media (prefers-reduced-motion: reduce) {
  .je-pagination__btn {
    transition: none;
  }
}
</style>
