export const POLICY = Object.freeze({
  vehicles: 600, envelope: 470_000_000, subsidyRate: 0.25,
  singleCap: 400_000, doubleCap: 800_000, dieselFactor: 2.614,
})

export const DEFAULTS = Object.freeze({
  vehicles: 300, doubleShare: 96, annualKm: 64_000, grid: 0.34, years: 12,
  chargeEfficiency: 90, budget: 470, singleDiesel: 32, doubleDiesel: 39,
  singleElectric: 1.35, doubleElectric: 2.34,
  singlePrice: 2.5, doublePrice: 4.45, singleDieselPrice: 1.5, doubleDieselPrice: 2.89,
})

export const INPUTS = [
  ['vehicles', '替换车辆', '辆', 1, 600, 1],
  ['doubleShare', '双层车占比', '%', 0, 100, 1],
  ['annualKm', '每车年里程', 'km', 0, 120_000, 1000],
  ['grid', '供电排放强度', 'kg CO₂e/kWh', 0, 1.5, 0.01],
  ['budget', '补贴预算', '百万港元', 0, 600, 1],
  ['years', '测算运营期', '年', 1, 20, 1],
  ['chargeEfficiency', '充电效率', '%', 50, 100, 1],
  ['singleDiesel', '单层柴油油耗', 'L/100 km', 0, 120, 0.1],
  ['doubleDiesel', '双层柴油油耗', 'L/100 km', 0, 120, 0.1],
  ['singleElectric', '单层电巴能耗', 'kWh/km', 0.1, 5, 0.01],
  ['doubleElectric', '双层电巴能耗', 'kWh/km', 0.1, 5, 0.01],
  ['singlePrice', '单层电巴单价', '百万港元', 0.1, 12, 0.01],
  ['doublePrice', '双层电巴单价', '百万港元', 0.1, 12, 0.01],
  ['singleDieselPrice', '单层柴油车单价', '百万港元', 0.1, 12, 0.01],
  ['doubleDieselPrice', '双层柴油车单价', '百万港元', 0.1, 12, 0.01],
]

export function clampInput(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

export function calculate(inputs, vehicles = inputs.vehicles) {
  const doubleCount = Math.round(vehicles * inputs.doubleShare / 100)
  const singleCount = vehicles - doubleCount
  const dieselLitres = inputs.annualKm *
    (singleCount * inputs.singleDiesel + doubleCount * inputs.doubleDiesel) / 100
  const batteryKwh = inputs.annualKm *
    (singleCount * inputs.singleElectric + doubleCount * inputs.doubleElectric)
  const gridKwh = batteryKwh / (inputs.chargeEfficiency / 100)
  const dieselTonnes = dieselLitres * POLICY.dieselFactor / 1000
  const electricTonnes = gridKwh * inputs.grid / 1000
  const breakEvenGrid = gridKwh > 0 ? dieselTonnes * 1000 / gridKwh : null
  const reduction = breakEvenGrid === null ? dieselTonnes : (breakEvenGrid - inputs.grid) * gridKwh / 1000
  const lifetimeReduction = reduction * inputs.years
  const singlePrice = inputs.singlePrice * 1_000_000
  const doublePrice = inputs.doublePrice * 1_000_000
  const procurement = singleCount * singlePrice + doubleCount * doublePrice
  const dieselProcurement =
    (singleCount * inputs.singleDieselPrice + doubleCount * inputs.doubleDieselPrice) * 1_000_000
  const incrementalCapex = procurement - dieselProcurement
  const subsidy =
    singleCount * Math.min(singlePrice * POLICY.subsidyRate, POLICY.singleCap) +
    doubleCount * Math.min(doublePrice * POLICY.subsidyRate, POLICY.doubleCap)
  return {
    vehicles, singleCount, doubleCount, dieselLitres, gridKwh,
    dieselTonnes, electricTonnes, reduction, lifetimeReduction, procurement,
    incrementalCapex, subsidy, budgetRemaining: inputs.budget * 1_000_000 - subsidy,
    costPerTonne: lifetimeReduction > 0 ? subsidy / lifetimeReduction : null,
    breakEvenGrid,
  }
}

export function affordableVehicles(inputs) {
  for (let count = POLICY.vehicles; count > 0; count -= 1) {
    if (calculate(inputs, count).budgetRemaining >= 0) return count
  }
  return 0
}

export function compareScenarios(inputs) {
  const counts = [...new Set([150, 300, 600, inputs.vehicles])].sort((a, b) => a - b)
  return counts.map((count) => calculate(inputs, count))
}
