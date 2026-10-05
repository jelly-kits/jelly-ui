<script setup lang="ts">
import { computed } from 'vue'
import { JeScrollbar } from '@jelly-kits/jelly-ui'
import { apiGroupId, apiSectionId, componentLabel, visibleApiGroups } from './apiGroups'
import type { ComponentApi } from '../api-data'
import { useDemoI18n } from '../i18n'

const props = defineProps<{ name: string; api: ComponentApi }>()

/** 中文原文即 key，未收录回落中文（见 demo/i18n/index.ts） */
const { t } = useDemoI18n()

const groups = computed(() => visibleApiGroups(props.api))
</script>

<template>
  <section class="api">
    <!-- id 给右侧目录的「组件」一级用；展示名去掉 Je 前缀，与目录口径一致 -->
    <h3 :id="apiSectionId(name)" class="api__name">{{ componentLabel(name) }}</h3>

    <section v-for="group in groups" :key="group.key" class="api__group">
      <!-- id 给右侧目录的「属性 / 事件 / 插槽 / 方法」一级用 -->
      <h4 :id="apiGroupId(name, group.key)" class="api__group-title">{{ t(group.title) }}</h4>
      <je-scrollbar class="api__scroll">
        <table class="api__table">
          <thead>
            <tr>
              <th>{{ t('名称') }}</th>
              <th>{{ t('说明') }}</th>
              <th>{{ t('类型') }}</th>
              <th v-if="group.withDefault">{{ t('默认值') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in group.rows" :key="row.name">
              <td class="api__name-cell">{{ row.name }}</td>
              <td>{{ row.description ? t(row.description) : '—' }}</td>
              <td class="api__code-cell">{{ row.type || '—' }}</td>
              <td v-if="group.withDefault" class="api__code-cell">{{ row.default || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </je-scrollbar>
    </section>
  </section>
</template>

<style scoped>
.api {
  margin-top: 28px;
}

.api__name {
  margin: 0 0 16px;
  font-size: 18px;
  font-weight: 700;
  color: var(--je-text);
}

.api__group + .api__group {
  margin-top: 20px;
}

.api__group-title {
  margin: 0 0 10px;
  font-size: 14px;
  font-weight: 600;
  color: var(--je-text);
}

/* 窄屏下表格横向滚动，不撑破页面；滚动交给 JeScrollbar，这里只管外框 */
.api__scroll {
  border: var(--je-border);
  border-radius: var(--je-radius);
}

.api__table {
  width: 100%;
  min-width: 520px;
  border-collapse: collapse;
  font-size: 13px;
  line-height: 1.6;
  text-align: left;
}

.api__table th,
.api__table td {
  padding: 10px 14px;
  vertical-align: top;
  border-bottom: 1px solid var(--je-border-color);
}

.api__table th {
  font-size: 12px;
  font-weight: 600;
  color: var(--je-text-muted);
  background: var(--je-surface);
  white-space: nowrap;
}

.api__table tbody tr:last-child td {
  border-bottom: none;
}

.api__table td {
  color: var(--je-text-muted);
}

.api__name-cell {
  font-weight: 600;
  color: var(--je-text);
  white-space: nowrap;
}

.api__code-cell {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  color: color-mix(in srgb, var(--je-primary) 45%, var(--je-text));
}
</style>
