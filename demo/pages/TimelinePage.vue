<script setup lang="ts">
import { JeIcon, JeTimeline, JeTimelineItem } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'
</script>

<template>
  <DemoPage
    title="Timeline 时间轴"
    description="竖向时间轴，支持语义色、空心节点、图标、自定义节点与倒序排列。"
  >
    <DemoBlock title="基础用法">
      <je-timeline>
        <je-timeline-item timestamp="2026-10-01 09:00">提交了需求评审</je-timeline-item>
        <je-timeline-item timestamp="2026-10-01 14:30" type="success">
          完成组件开发
        </je-timeline-item>
        <je-timeline-item timestamp="2026-10-02 10:00" type="warning">等待联调</je-timeline-item>
      </je-timeline>
    </DemoBlock>

    <DemoBlock title="空心、图标与尺寸">
      <je-timeline>
        <je-timeline-item timestamp="空心节点" hollow>圆点可切换为空心样式</je-timeline-item>
        <je-timeline-item timestamp="图标节点" icon="check" type="success">
          用图标代替圆点
        </je-timeline-item>
        <je-timeline-item timestamp="大尺寸" type="danger" size="large">
          放大节点与字号
        </je-timeline-item>
      </je-timeline>
    </DemoBlock>

    <DemoBlock title="自定义节点与倒序" description="开启 reverse 后最新的一条排在最上方。">
      <je-timeline reverse>
        <je-timeline-item timestamp="较早">列表按时间正序书写</je-timeline-item>
        <je-timeline-item timestamp="最新" type="primary">
          <template #dot><je-icon name="star" :size="10" /></template>
          通过 dot 插槽自定义节点
        </je-timeline-item>
      </je-timeline>
    </DemoBlock>
  </DemoPage>
</template>
