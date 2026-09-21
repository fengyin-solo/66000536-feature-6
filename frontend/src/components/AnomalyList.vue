<template>
  <div class="panel">
    <h4>⚠️ 近期告警<span v-if="store.selectedGroup" class="filter">已选分组: {{ store.selectedGroup }}</span></h4>
    <div v-if="!anomalies.length" class="empty">暂无告警</div>
    <div v-for="(a,i) in anomalies" :key="i" class="anomaly-row" :class="{ hl: inSelectedGroup(a) }">
      <span class="a-time">{{ ts(a.timestamp) }}</span>
      <span v-for="t in a.triggers" :key="t.rule" class="a-tag">{{ t.rule }}: {{ t.value.toFixed(1) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useFactoryStore } from '../store/factory'
import { groupKeysOf } from '../types'
import type { Anomaly } from '../types'
const store = useFactoryStore()
const anomalies = computed(() => store.data?.anomalies || [])
function ts(t: number) { return new Date(t * 1000).toLocaleTimeString() }

// 告警触发的设备是否属于当前选中的分组 → 清单同步高亮
function inSelectedGroup(a: Anomaly) {
  if (!store.selectedGroup || !store.data) return false
  return a.triggers.some(t => {
    const dev = store.data!.devices.find(d => d.id === t.device_id)
    return dev ? groupKeysOf(dev, store.groupBy).includes(store.selectedGroup!)
      : a.device_type === store.selectedGroup
  })
}
</script>

<style scoped>
.panel{background:#0d1b2a;border-radius:8px;padding:12px;border:1px solid #1e3a5f;flex:1}
.panel h4{color:#f87171;margin-bottom:8px;font-size:13px}
.filter{margin-left:8px;font-size:11px;color:#fbbf24;font-weight:400}
.empty{color:#64748b;font-size:12px}
.anomaly-row{display:flex;gap:8px;padding:4px 4px;font-size:11px;color:#fca5a5;flex-wrap:wrap;border-left:2px solid transparent;border-radius:3px}
.anomaly-row.hl{background:#7f1d1d33;border-left-color:#f87171}
.a-time{color:#64748b;min-width:70px}
.a-tag{background:#7f1d1d33;padding:1px 6px;border-radius:3px;border:1px solid #7f1d1d55}
</style>