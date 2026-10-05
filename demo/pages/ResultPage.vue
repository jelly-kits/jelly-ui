<script setup lang="ts">
import { JeButton, JeResult, JeSpace } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'
</script>

<template>
  <DemoPage
    title="Result 结果页"
    description="用于反馈一系列操作任务的处理结果。图标圆底色由语义 token 现算，支持自定义图标、标题、副标题与操作区。"
  >
    <DemoBlock title="四种状态" description="icon 取 success / warning / info / error，默认 info。">
      <je-result icon="success" title="提交成功" sub-title="工单已创建，稍后会有专员与你联系。" />
      <je-result icon="warning" title="存在风险" sub-title="检测到 2 项配置不符合最佳实践。" />
      <je-result icon="error" title="提交失败" sub-title="网络异常，请检查连接后重试。" />
    </DemoBlock>

    <DemoBlock title="带操作区" description="extra 插槽放下一步操作按钮。">
      <je-result icon="info" title="审核中" sub-title="预计 1 个工作日内完成审核。">
        <template #extra>
          <je-space justify="center" wrap>
            <je-button variant="ghost">查看详情</je-button>
            <je-button>返回首页</je-button>
          </je-space>
        </template>
      </je-result>
    </DemoBlock>

    <DemoBlock title="自定义标题与图标" description="title / subTitle / icon 均可通过插槽替换。">
      <je-result icon="success" sub-title="插槽内容优先于 props。">
        <template #title>
          <span>订单已完成</span>
        </template>
        <template #subTitle>共 3 件商品，实付 ¥199.00</template>
      </je-result>
    </DemoBlock>
  </DemoPage>
</template>
