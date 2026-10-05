<script setup lang="ts">
import { ref } from 'vue'
import { JeBreadcrumb, JeBreadcrumbItem } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const current = ref('详情页')
</script>

<template>
  <DemoPage
    title="Breadcrumb 面包屑"
    description="显示当前页面在系统层级结构中的位置，并能向上返回。最后一项不可点击、颜色更淡，且不显示分隔符。"
  >
    <DemoBlock title="基础用法" description="分隔符默认为「/」。">
      <je-breadcrumb>
        <je-breadcrumb-item to="#/">首页</je-breadcrumb-item>
        <je-breadcrumb-item to="#/list">列表页</je-breadcrumb-item>
        <je-breadcrumb-item>{{ current }}</je-breadcrumb-item>
      </je-breadcrumb>
    </DemoBlock>

    <DemoBlock title="自定义分隔符">
      <je-breadcrumb separator=">">
        <je-breadcrumb-item to="#/">首页</je-breadcrumb-item>
        <je-breadcrumb-item to="#/components">组件</je-breadcrumb-item>
        <je-breadcrumb-item>面包屑</je-breadcrumb-item>
      </je-breadcrumb>
      <je-breadcrumb separator-icon="arrow-right">
        <je-breadcrumb-item to="#/">首页</je-breadcrumb-item>
        <je-breadcrumb-item to="#/components">组件</je-breadcrumb-item>
        <je-breadcrumb-item>面包屑</je-breadcrumb-item>
      </je-breadcrumb>
    </DemoBlock>

    <DemoBlock
      title="移动端表现"
      description="窄屏下整条不换行、可横向滑动，滚动条隐藏，热区不小于 44px。"
    >
      <je-breadcrumb separator="/">
        <je-breadcrumb-item to="#/">首页</je-breadcrumb-item>
        <je-breadcrumb-item to="#/group">分组页面</je-breadcrumb-item>
        <je-breadcrumb-item to="#/group/list">二级列表</je-breadcrumb-item>
        <je-breadcrumb-item>当前页面名称较长也不会换行</je-breadcrumb-item>
      </je-breadcrumb>
    </DemoBlock>
  </DemoPage>
</template>
