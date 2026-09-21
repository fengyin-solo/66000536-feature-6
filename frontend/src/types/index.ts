export interface Device {
  id: number; type: string; area: string; status: string; position: number[]
  temperature: number; vibration: number; pressure: number
  production_count: number; fault_count: number
  uptime: number; quality_rate: number
}

export interface Anomaly {
  timestamp: number; triggers: { device_id: number; rule: string; value: number; threshold: string }[]
  device_type: string; device_id?: number; area?: string; shift?: string
}

export interface OEEItem {
  id: number; type: string; oee: number
  availability: number; performance: number; quality: number
}

export type FaultGroupBy = 'type' | 'area' | 'shift'

export interface FaultStats {
  type: Record<string, number>
  area: Record<string, number>
  shift: Record<string, number>
}

export interface FactoryData {
  devices: Device[]
  production: number
  anomalies: Anomaly[]
  fault_stats?: FaultStats
  oee: OEEItem[]
}

export const DEVICE_COLORS: Record<string, string> = {
  CNC: '#e74c3c', RobotArm: '#3498db', Conveyor: '#f39c12',
  AGV: '#2ecc71', InjectionMolding: '#9b59b6', QCStation: '#1abc9c'
}

// 新增分组维度的配色（独立色板，不改动上面的设备配色）
export const AREA_COLORS: Record<string, string> = {
  A区: '#38bdf8', B区: '#f472b6', C区: '#a3e635', D区: '#fb923c'
}

export const SHIFT_COLORS: Record<string, string> = {
  白班: '#fbbf24', 夜班: '#818cf8', 晚班: '#2dd4bf'
}

// 各分组维度下应出现的全部组（用于检测“没有数据”的组）
export const FAULT_GROUPS: Record<FaultGroupBy, string[]> = {
  type: ['CNC', 'RobotArm', 'Conveyor', 'AGV', 'InjectionMolding', 'QCStation'],
  area: ['A区', 'B区', 'C区', 'D区'],
  shift: ['白班', '夜班', '晚班']
}

export function groupColor(groupBy: FaultGroupBy, name: string): string {
  const palette = groupBy === 'type' ? DEVICE_COLORS : groupBy === 'area' ? AREA_COLORS : SHIFT_COLORS
  return palette[name] ?? '#94a3b8'
}

// 按当前时间推导班次（后端未下发 shift 字段时兜底使用）
export function shiftOf(ts: number): string {
  const h = new Date(ts * 1000).getHours()
  if (h >= 8 && h < 16) return '白班'
  if (h >= 16 && h < 24) return '夜班'
  return '晚班'
}

export const GROUP_LABEL: Record<FaultGroupBy, string> = {
  type: '设备类型', area: '产线区域', shift: '班次'
}

export const STATUS_COLORS: Record<string, string> = {
  RUNNING: '#2ecc71', IDLE: '#f1c40f', FAULT: '#e74c3c', OFFLINE: '#95a5a6'
}