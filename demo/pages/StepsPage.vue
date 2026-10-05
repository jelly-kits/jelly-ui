<script setup lang="ts">
import { ref } from 'vue'
import { JeButton, JeStep, JeSteps } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const active = ref(1)

const simpleActive = ref(1)

const steps = [
  { title: '填写信息', description: '录入基础资料' },
  { title: '确认信息', description: '核对填写内容' },
  { title: '完成', description: '提交并等待审核' },
]
</script>

<template>
  <DemoPage
    title="Steps 步骤条"
    description="引导用户按照流程完成任务，当前步骤由 active 控制，已完成节点显示对勾、出错节点显示叉号。"
  >
    <DemoBlock title="基础用法" description="切换 active 可以看到节点状态与连接线进度的变化。">
      <je-steps :active="active">
        <je-step
          v-for="step in steps"
          :key="step.title"
          :title="step.title"
          :description="step.description"
        />
      </je-steps>
      <div class="actions">
        <je-button variant="ghost" :disabled="active <= 0" @click="active -= 1">上一步</je-button>
        <je-button :disabled="active >= steps.length - 1" @click="active += 1">下一步</je-button>
      </div>
    </DemoBlock>

    <DemoBlock title="纵向与居中">
      <je-steps :active="2" direction="vertical">
        <je-step title="创建账号" description="使用邮箱注册" />
        <je-step title="完善资料" description="填写个人与公司信息" />
        <je-step title="实名认证" description="等待人工审核" />
        <je-step title="开始使用" description="认证通过后即可使用" />
      </je-steps>
      <je-steps :active="1" align-center>
        <je-step title="下单" description="选择商品" />
        <je-step title="付款" description="确认金额" />
        <je-step title="发货" description="等待收货" />
      </je-steps>
    </DemoBlock>

    <DemoBlock title="状态与简洁模式">
      <je-steps :active="1" finish-status="finish">
        <je-step title="已完成" />
        <je-step title="进行中" />
        <je-step title="等待中" />
        <je-step title="出错了" status="error" description="这一步校验未通过" />
      </je-steps>
      <je-steps :active="simpleActive" simple>
        <je-step title="填写信息" />
        <je-step title="确认信息" />
        <je-step title="完成" />
      </je-steps>
      <div class="actions">
        <je-button variant="ghost" :disabled="simpleActive <= 0" @click="simpleActive -= 1">
          上一步
        </je-button>
        <je-button :disabled="simpleActive >= 2" @click="simpleActive += 1">下一步</je-button>
      </div>
    </DemoBlock>

    <DemoBlock
      title="移动端表现"
      description="窄屏下建议使用 direction=&quot;vertical&quot;；保持横向时整条可左右滑动，节点热区不小于 44px。"
    >
      <je-steps :active="1" space="12px">
        <je-step title="步骤一" description="横向滚动查看" />
        <je-step title="步骤二" description="节点宽 44px" />
        <je-step title="步骤三" description="滑动查看后续" />
        <je-step title="步骤四" description="最后一步" />
      </je-steps>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.actions {
  display: flex;
  gap: 12px;
  margin-top: 18px;
}
</style>
