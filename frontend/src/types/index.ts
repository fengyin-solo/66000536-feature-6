export interface Device {
  id: number; type: string; status: string; position: number[]
  temperature: number; vibration: number; pressure: number
  production_count: number; fault_count: number
  uptime: number; quality_rate: number
}

export interface Anomaly {
  timestamp: number; triggers: { device_id: number; rule: string; value: number; threshold: string }[]
  device_type: string
}

export interface OEEItem {
  id: number; type: string; oee: number
  availability: number; performance: number; quality: number
}

export interface FactoryData {
  devices: Device[]
  production: number
  anomalies: Anomaly[]
  oee: OEEItem[]
}

export const DEVICE_COLORS: Record<string, string> = {
  CNC: '#e74c3c', RobotArm: '#3498db', Conveyor: '#f39c12',
  AGV: '#2ecc71', InjectionMolding: '#9b59b6', QCStation: '#1abc9c'
}

export const STATUS_COLORS: Record<string, string> = {
  RUNNING: '#2ecc71', IDLE: '#f1c40f', FAULT: '#e74c3c', OFFLINE: '#95a5a6'
}

// ---- 故障分布分组 ----
export type GroupBy = 'type' | 'area' | 'shift'

export const GROUP_BY_OPTIONS: { key: GroupBy; label: string }[] = [
  { key: 'type', label: '设备类型' },
  { key: 'area', label: '产线区域' },
  { key: 'shift', label: '班次' }
]

export const AREA_KEYS = ['A区', 'B区', 'C区', 'D区']
export const SHIFT_KEYS = ['早班', '中班', '晚班']

export const AREA_COLORS: Record<string, string> = {
  'A区': '#38bdf8', 'B区': '#f472b6', 'C区': '#a3e635', 'D区': '#fbbf24'
}

export const SHIFT_COLORS: Record<string, string> = {
  '早班': '#fbbf24', '中班': '#38bdf8', '晚班': '#a78bfa'
}

// 按设备在车间平面上的位置 (x, z) 划分产线区域
export function deviceArea(d: Device): string {
  const x = d.position[0], z = d.position[2]
  return x >= 0 ? (z >= 0 ? 'A区' : 'B区') : (z >= 0 ? 'C区' : 'D区')
}

export function deviceShift(d: Device): string {
  return SHIFT_KEYS[d.id % SHIFT_KEYS.length]
}

// 返回设备所属的分组 key 列表；正常只有一个，若未来分组规则允许
// 多重归属（如跨区设备），返回多个 key 时上层会提示“分组重叠”
export function groupKeysOf(d: Device, by: GroupBy): string[] {
  if (by === 'type') return [d.type]
  if (by === 'area') return [deviceArea(d)]
  return [deviceShift(d)]
}

export function groupColor(by: GroupBy, key: string): string {
  const palette = by === 'type' ? DEVICE_COLORS : by === 'area' ? AREA_COLORS : SHIFT_COLORS
  return palette[key] || '#64748b'
}

// 各分组方式下期望出现的全部分组（用于检测空分组）
export function expectedGroupKeys(by: GroupBy): string[] {
  if (by === 'type') return Object.keys(DEVICE_COLORS)
  if (by === 'area') return AREA_KEYS
  return SHIFT_KEYS
}