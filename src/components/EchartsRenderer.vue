<template>
  <div 
    ref="chartContainer" 
    class="echarts-container"
    :class="{ 'echarts-ready': isReady }"
  ></div>
</template>

<script setup lang="ts">
import * as echarts from 'echarts'
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'

const props = defineProps<{
  option: Record<string, any>
}>()

const chartContainer = ref<HTMLElement | null>(null)
const isReady = ref(false)
let myChart: echarts.ECharts | null = null
let resizeObserver: ResizeObserver | null = null

const renderChart = () => {
  if (!chartContainer.value) return

  if (!myChart) {
    myChart = echarts.init(chartContainer.value)
  }
  
  // 确保 option 包含动画配置
  const defaultDelayFn = (idx: number) => idx * 50
  const animatedOption = {
    ...props.option,
    animation: props.option.animation !== false,
    animationDuration: props.option.animationDuration ?? 1000,
    animationEasing: props.option.animationEasing ?? 'cubicOut',
    animationDelay: props.option.animationDelay ?? defaultDelayFn
  }
  
  if (myChart) {
    myChart.setOption(animatedOption, { notMerge: true, lazyUpdate: false })
    myChart.resize()
  }
  
  // 图表渲染完成后触发动画
  if (!isReady.value) {
    // 使用 requestAnimationFrame 确保 DOM 更新后再触发动画
    requestAnimationFrame(() => {
      isReady.value = true
    })
  }
}

onMounted(() => {
  nextTick(() => {
    renderChart()
    if (chartContainer.value && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        myChart?.resize()
      })
      resizeObserver.observe(chartContainer.value)
    } else {
      window.addEventListener('resize', renderChart)
    }
  })
})

watch(
  () => props.option,
  () => {
    if (myChart && isReady.value) {
      renderChart()
    }
  },
  { deep: true }
)

onUnmounted(() => {
  if (resizeObserver && chartContainer.value) {
    resizeObserver.unobserve(chartContainer.value)
    resizeObserver.disconnect()
    resizeObserver = null
  }
  window.removeEventListener('resize', renderChart)
  if (myChart) {
    myChart.dispose()
    myChart = null
  }
})
</script>

<style scoped>
.echarts-container {
  width: 100%;
  height: 360px;
  min-height: 260px;
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(148, 163, 184, 0.06), rgba(148, 163, 184, 0.03));
  opacity: 0;
  transform: translateY(10px) scale(0.98);
  transition: opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.echarts-container.echarts-ready {
  opacity: 1;
  transform: translateY(0) scale(1);
}
</style>
