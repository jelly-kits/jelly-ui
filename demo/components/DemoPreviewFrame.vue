<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useDemoI18n } from '../i18n'

const route = useRoute()
const { locale } = useDemoI18n()

/*
 * 预览页与文档页共用同一个页面组件，只是换了外壳。这里必须用 iframe：
 * 库内所有窄屏判定都走 core/useMediaQuery.ts 的 window.matchMedia('(max-width: 768px)')，
 * 量的是**视口**而不是容器 —— 在宽窗口里塞一个 390px 的盒子，组件仍会自认桌面端。
 * 换成 iframe 后它有了自己的视口，390px 才真正生效；顺带把 Teleport 到 body 的浮层、
 * 命令式 API 的宿主节点、nextZIndex 计数器一并隔离在这份 document 里。
 *
 * src 用仅含 hash 的相对地址：换文档页时浏览器走的是 iframe 内的 fragment 导航，
 * 不会整页重载，路由由 iframe 里的同一套 router 接管。
 * 语言段取自 i18n 状态（它跟着 URL 走）：切语言时 src 跟着变，iframe 会以新语言的地址重载，
 * 于是 iframe 内也不需要额外的跨文档同步。
 */
const src = computed(() => {
  const basePath = (route.meta.basePath as string | undefined) ?? '/'
  return `#/${locale.value}/preview${basePath}`
})
</script>

<template>
  <div class="preview-frame">
    <div class="preview-frame__bar">
      <span class="preview-frame__dots" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span class="preview-frame__url">{{ src }}</span>
    </div>
    <iframe class="preview-frame__viewport" :src="src" title="移动端预览" />
  </div>
</template>

<style scoped>
.preview-frame {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: 100%;
  /* 顶栏 60 + sticky 上下各 24 + 上方分段开关（48 + 间隔 16）；高屏封顶免得拉太长 */
  height: min(820px, calc(100vh - 172px));
  overflow: hidden;
  background: var(--je-popup);
  border-radius: var(--je-radius);
  /* 边框用 box-shadow 画在外侧：不占宽度，iframe 的视口才能正好等于列宽 */
  box-shadow: 0 0 0 1px var(--je-border-color), var(--je-shadow-popup);
}

.preview-frame__bar {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 10px;
  height: 34px;
  padding: 0 12px;
  border-bottom: var(--je-border);
}

.preview-frame__dots {
  display: inline-flex;
  gap: 5px;
}

.preview-frame__dots i {
  width: 8px;
  height: 8px;
  background: var(--je-text-faint);
  border-radius: 50%;
}

.preview-frame__url {
  min-width: 0;
  overflow: hidden;
  font-size: 11px;
  color: var(--je-text-faint);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-frame__viewport {
  /* 撑满剩下的高度，宽度即 iframe 的视口宽度 */
  flex: 1 1 auto;
  width: 100%;
  border: 0;
}
</style>
