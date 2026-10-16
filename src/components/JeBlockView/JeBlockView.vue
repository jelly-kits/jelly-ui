<script setup lang="ts">
/*
 * 块数据的只读渲染：传 JeBlockEditor 存下来的那份 JSON，按 type 分支渲染。
 *
 * 这个组件同时是「数据结构」的可执行文档 —— 小程序 / 原生端照着它实现一遍即可，
 * 字段只有 text / url / alt / poster / title / width / height / fit，
 * 没有任何需要解析的 HTML。
 */
import { computed, ref } from 'vue'
import { JeIcon } from '../JeIcon'
import { useJeLocale } from '../JeLocale'
import type { JeBlock } from '../JeBlockEditor/types'
import type { JeBlockViewValue } from './types'

defineOptions({ name: 'JeBlockView' })

const props = withDefaults(
  defineProps<{
    /** 数据：完整文档（{ version, blocks }）或块数组都行 */
    value?: JeBlockViewValue
    /** 链接的打开方式 */
    linkTarget?: string
    /** 空数据时的占位文案，传空串则不显示 */
    emptyText?: string
  }>(),
  { value: undefined, linkTarget: '_blank', emptyText: undefined },
)

const { t } = useJeLocale()

const normalize = (value: JeBlockViewValue | undefined): JeBlock[] => {
  if (!value) return []
  return Array.isArray(value) ? value : (value.blocks ?? [])
}

/** 展示侧顺手把空块滤掉：编辑器里可以先落一个空块再填内容 */
const blocks = computed(() =>
  normalize(props.value).filter((block) =>
    block.type === 'text' ? block.text.trim() !== '' : block.url.trim() !== '',
  ),
)

const emptyLabel = computed(() => props.emptyText ?? t('block.empty'))

/**
 * 正在播放的视频块，空串表示都还停在封面上。
 * 视频默认只渲染封面 + 播放键，点了才挂载播放器，免得一进页面就拉视频流量。
 */
const playingId = ref('')

const playVideo = (id: string) => {
  playingId.value = id
}

/** 图片 / 视频的尺寸与缩放；与编辑器里的取值口径保持一致 */
const mediaStyle = (block: JeBlock) => {
  if (block.type !== 'image' && block.type !== 'video') return {}
  return {
    width: block.width || '100%',
    height: block.height || undefined,
    // 显式给了高度就不再受样式里的 320px 上限约束
    maxHeight: block.height ? 'none' : undefined,
    objectFit: block.fit ?? 'contain',
  }
}
</script>

<template>
  <div class="je-block-view">
    <template v-for="block in blocks" :key="block.id">
      <p v-if="block.type === 'text'" class="je-block-view__text">{{ block.text }}</p>
      <img
        v-else-if="block.type === 'image'"
        class="je-block-view__image"
        :style="mediaStyle(block)"
        :src="block.url"
        :alt="block.alt ?? ''"
      />
      <video
        v-else-if="block.type === 'video' && playingId === block.id"
        class="je-block-view__video"
        :style="mediaStyle(block)"
        :src="block.url"
        :poster="block.poster || undefined"
        preload="none"
        controls
        autoplay
        playsinline
      />
      <!-- 没点播放键之前只放封面，播放器根本不挂载，视频文件一个字节都不拉 -->
      <button
        v-else-if="block.type === 'video'"
        type="button"
        class="je-block-view__poster"
        :style="mediaStyle(block)"
        :aria-label="t('block.play')"
        @click="playVideo(block.id)"
      >
        <img v-if="block.poster" class="je-block-view__cover" :src="block.poster" alt="" />
        <span class="je-block-view__play"><JeIcon name="play" :size="18" /></span>
      </button>
      <a
        v-else
        class="je-block-view__link"
        :href="block.url"
        :target="linkTarget"
        rel="noopener noreferrer nofollow"
      >
        {{ block.title || block.url }}
      </a>
    </template>

    <p v-if="!blocks.length && emptyLabel" class="je-block-view__empty">{{ emptyLabel }}</p>
  </div>
</template>

<style scoped>
.je-block-view {
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-size: var(--je-control-fs);
  line-height: 1.7;
  color: var(--je-text);
}

/* 每块同样占满一行 */
.je-block-view > * {
  width: 100%;
  margin: 0;
}

/* 文本块的换行原样保留 */
.je-block-view__text {
  white-space: pre-wrap;
  word-break: break-word;
}

.je-block-view__image,
.je-block-view__video {
  display: block;
  max-height: 320px;
  object-fit: contain;
  background: var(--je-surface);
  border-radius: var(--je-radius);
}

/* 视频的封面态：整块都是播放热区 */
.je-block-view__poster {
  position: relative;
  display: block;
  min-height: 180px;
  max-height: 320px;
  padding: 0;
  overflow: hidden;
  background: var(--je-surface);
  border: none;
  border-radius: var(--je-radius);
  cursor: pointer;
}

.je-block-view__cover {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.je-block-view__play {
  position: absolute;
  top: 50%;
  left: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  color: #fff;
  background: color-mix(in srgb, var(--je-text) 55%, transparent);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: background var(--je-duration);
}

.je-block-view__poster:hover .je-block-view__play {
  background: var(--je-primary);
}

.je-block-view__link {
  display: inline-block;
  color: var(--je-primary);
  text-decoration: none;
  word-break: break-all;
}

.je-block-view__link:hover {
  text-decoration: underline;
}

.je-block-view__empty {
  font-size: var(--je-control-fs-sm);
  color: var(--je-text-faint);
  text-align: center;
}
</style>
