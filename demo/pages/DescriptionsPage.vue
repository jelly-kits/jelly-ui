<script setup lang="ts">
import { JeDescriptions, JeDescriptionsItem, JeTag } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'
</script>

<template>
  <DemoPage
    title="Descriptions 描述列表"
    description="以网格排布键值对，支持横向 / 纵向排布与描边表格模式，窄屏自动降为单列。"
  >
    <DemoBlock title="基础用法" description="span 可让某一项跨列，窄屏会按实际列数收敛。">
      <je-descriptions title="用户信息">
        <je-descriptions-item label="用户名">Jelly</je-descriptions-item>
        <je-descriptions-item label="手机号">13800000000</je-descriptions-item>
        <je-descriptions-item label="状态">
          <je-tag type="success">在线</je-tag>
        </je-descriptions-item>
        <je-descriptions-item label="邮箱" :span="2">hello@jelly.ui</je-descriptions-item>
        <je-descriptions-item label="地址">杭州市西湖区</je-descriptions-item>
      </je-descriptions>
    </DemoBlock>

    <DemoBlock title="描边模式与纵向排布">
      <je-descriptions title="订单" border :column="2">
        <je-descriptions-item label="订单号">NO.20261002</je-descriptions-item>
        <je-descriptions-item label="金额">￥1,299.00</je-descriptions-item>
        <je-descriptions-item label="备注" :span="2">
          这是一段较长的备注信息，用于展示换行效果。
        </je-descriptions-item>
      </je-descriptions>

      <je-descriptions direction="vertical" :column="3" label-width="90px">
        <je-descriptions-item label="创建时间">2026-10-02</je-descriptions-item>
        <je-descriptions-item label="更新时间">2026-10-02</je-descriptions-item>
        <je-descriptions-item label="负责人">Keko</je-descriptions-item>
      </je-descriptions>
    </DemoBlock>

    <DemoBlock title="自定义标签" description="label 插槽可替换成任意内容。">
      <je-descriptions :column="2" size="small">
        <je-descriptions-item>
          <template #label>说明</template>
          通过 label 插槽自定义标签内容。
        </je-descriptions-item>
        <je-descriptions-item label="尺寸">small</je-descriptions-item>
      </je-descriptions>
    </DemoBlock>
  </DemoPage>
</template>
