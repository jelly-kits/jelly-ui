<script setup lang="ts">
import { ref } from 'vue'
import { JeSplitter, JeSplitterPanel } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

/** 三栏尺寸（百分比），由 v-model 双向同步 */
const sizes = ref<number[]>([25, 45, 30])
const verticalSizes = ref<number[]>([40, 60])

/** 最近一次拖拽结果，用于展示 resize 事件 */
const log = ref('尚未拖动')
const dragging = ref(false)

/** 面板内的行号，用来撑出滚动内容 */
const lines = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

const onResize = (index: number, next: number[]) => {
  log.value = `第 ${index + 1} 个分割条 → ${next.map((value) => `${Math.round(value)}%`).join(' / ')}`
}
</script>

<template>
  <DemoPage
    title="Splitter 分栏"
    description="面板之间是可拖拽的分割条，支持键盘方向键微调；拖动时锁定文字选中，只在分割条上禁用触屏手势。"
  >
    <DemoBlock
      title="基础三栏"
      description="v-model 绑定各面板百分比；拖动分割条会同步更新并派发 resize 事件。"
    >
      <div class="splitter-demo">
        <je-splitter
          v-model="sizes"
          @resize="onResize"
          @resize-start="dragging = true"
          @resize-end="dragging = false"
        >
          <je-splitter-panel>
            <div class="pane">
              <h5>左栏</h5>
              <p v-for="n in lines" :key="n">第 {{ n }} 行内容</p>
            </div>
          </je-splitter-panel>
          <je-splitter-panel>
            <div class="pane">
              <h5>中栏</h5>
              <p v-for="n in lines" :key="n">第 {{ n }} 行内容</p>
            </div>
          </je-splitter-panel>
          <je-splitter-panel>
            <div class="pane">
              <h5>右栏</h5>
              <p v-for="n in lines" :key="n">第 {{ n }} 行内容</p>
            </div>
          </je-splitter-panel>
        </je-splitter>
      </div>
      <p class="state">{{ dragging ? '拖拽中…' : log }}</p>
    </DemoBlock>

    <DemoBlock title="纵向分栏" description="layout 设为 vertical，分割条改为上下拖动，方向键对应上下键。">
      <div class="splitter-demo">
        <je-splitter v-model="verticalSizes" layout="vertical">
          <je-splitter-panel>
            <div class="pane">
              <h5>上栏</h5>
              <p v-for="n in lines" :key="n">第 {{ n }} 行内容</p>
            </div>
          </je-splitter-panel>
          <je-splitter-panel>
            <div class="pane">
              <h5>下栏</h5>
              <p v-for="n in lines" :key="n">第 {{ n }} 行内容</p>
            </div>
          </je-splitter-panel>
        </je-splitter>
      </div>
    </DemoBlock>

    <DemoBlock
      title="尺寸约束"
      description="min / max 限制可拖范围，collapsible 允许拖到 0 折叠，resizable=false 时分割条不可拖动。"
    >
      <div class="splitter-demo">
        <je-splitter>
          <je-splitter-panel :size="30" :min="20" :max="40">
            <div class="pane">
              <h5>min 20 / 40</h5>
              <p v-for="n in lines" :key="n">第 {{ n }} 行内容</p>
            </div>
          </je-splitter-panel>
          <je-splitter-panel :min="15" collapsible>
            <div class="pane">
              <h5>min 15 / 可折叠</h5>
              <p v-for="n in lines" :key="n">第 {{ n }} 行内容</p>
            </div>
          </je-splitter-panel>
          <je-splitter-panel :resizable="false">
            <div class="pane">
              <h5>右侧已锁定</h5>
              <p v-for="n in lines" :key="n">第 {{ n }} 行内容</p>
            </div>
          </je-splitter-panel>
          <je-splitter-panel>
            <div class="pane">
              <h5>末栏</h5>
              <p v-for="n in lines" :key="n">第 {{ n }} 行内容</p>
            </div>
          </je-splitter-panel>
        </je-splitter>
      </div>
    </DemoBlock>

    <DemoBlock title="移动端说明">
      <p class="tip">
        窄屏下分割条的透明命中区加宽到 16px（视觉线仍为 4px），方便手指拖拽；面板内容区域保持正常滚动，
        只有分割条自身禁用触屏手势。键盘用户可聚焦分割条后用方向键调整，按住 Shift 步长加大。
      </p>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.splitter-demo {
  height: 240px;
  overflow: hidden;
  background: var(--je-surface);
  border: var(--je-border);
  border-radius: var(--je-radius);
}

.pane {
  padding: 12px 14px;
  font-size: 13px;
  color: var(--je-text-muted);
}

.pane h5 {
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: 600;
  color: var(--je-text);
}

.pane p {
  margin: 0 0 10px;
  line-height: 1.5;
}

.state,
.tip {
  margin: 12px 0 0;
  font-size: 13px;
  line-height: 1.7;
  color: var(--je-text-faint);
}

@media (max-width: 768px) {
  .splitter-demo {
    height: 200px;
  }
}
</style>
