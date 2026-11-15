import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DEFAULTS, affordableVehicles, calculate, compareScenarios } from '../public/model.mjs';

function closeTo(actual, expected, tolerance = 1e-8) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `Expected ${actual} to be within ${tolerance} of ${expected}`);
}

test('default case agrees with independently calculated annual and lifetime results', () => {
  const result = calculate(DEFAULTS);

  assert.equal(result.vehicles, 300);
  assert.equal(result.singleCount, 12);
  assert.equal(result.doubleCount, 288);
  // 768,000 single-deck km and 18,432,000 double-deck km. Diesel uses 0.32 and 0.39 L/km.
  assert.equal(result.dieselLitres, 7_434_240);
  closeTo(result.dieselTonnes, 19_433.10336);
  // The battery needs 44,167,680 kWh per year and charging delivers 90% of grid draw.
  assert.equal(result.gridKwh, 49_075_200);
  closeTo(result.electricTonnes, 16_685.568);
  closeTo(result.reduction, 2_747.53536);
  closeTo(result.lifetimeReduction, 32_970.42432);

  assert.equal(result.procurement, 1_311_600_000);
  assert.equal(result.incrementalCapex, 461_280_000);
  assert.equal(result.subsidy, 235_200_000);
  assert.equal(result.budgetRemaining, 234_800_000);
  closeTo(result.costPerTonne, 7_133.666152343901);
  closeTo(result.breakEvenGrid, 0.3959862284820031);
});

test('subsidy applies the lower of 25% and the corresponding per-bus cap', () => {
  const mixed = { ...DEFAULTS, vehicles: 2, doubleShare: 50 };
  const subsidy = (singlePrice, doublePrice) => calculate({ ...mixed, singlePrice, doublePrice }).subsidy;

  assert.equal(subsidy(1.2, 2), 800_000);
  assert.equal(subsidy(1.6, 3.2), 1_200_000);
  assert.equal(subsidy(3, 5), 1_200_000);
  assert.equal(subsidy(1.2, 5), 1_100_000);
  assert.equal(subsidy(3, 2), 900_000);
});

test('at the illustrative 96% double-deck mix, 600 buses exceed HK$470m and 599 fit', () => {
  const inputs = { ...DEFAULTS, vehicles: 600, doubleShare: 96, budget: 470 };
  const full = calculate(inputs);

  assert.equal(full.singleCount, 24);
  assert.equal(full.doubleCount, 576);
  assert.equal(full.subsidy, 470_400_000);
  assert.equal(full.budgetRemaining, -400_000);
  assert.equal(affordableVehicles(inputs), 599);
  assert.equal(calculate(inputs, 599).budgetRemaining, 400_000);
  assert.equal(affordableVehicles({ ...inputs, budget: 470.4 }), 600);
  assert.equal(affordableVehicles({ ...inputs, budget: 0 }), 0);
});

test('increasing grid intensity changes the sign of operational emissions savings at break-even', () => {
  const base = calculate(DEFAULTS);
  const atBreakEven = calculate({ ...DEFAULTS, grid: base.breakEvenGrid });
  const higherGrid = calculate({ ...DEFAULTS, grid: 0.5 });

  assert.ok(base.reduction > 0);
  closeTo(atBreakEven.reduction, 0);
  assert.equal(atBreakEven.costPerTonne, null);
  closeTo(higherGrid.reduction, -5_104.49664);
  assert.ok(higherGrid.lifetimeReduction < 0);
  assert.equal(higherGrid.costPerTonne, null);
  assert.equal(higherGrid.breakEvenGrid, base.breakEvenGrid);
  assert.equal(higherGrid.subsidy, base.subsidy);
});

test('rounding at exact break-even cannot produce a finite subsidy per tonne', () => {
  const inputs = { ...DEFAULTS, vehicles: 15 };
  const { breakEvenGrid } = calculate(inputs);
  const result = calculate({ ...inputs, grid: breakEvenGrid });

  assert.equal(result.reduction, 0);
  assert.equal(result.costPerTonne, null);
});

test('zero distance produces no operational emissions or ratio outputs', () => {
  const result = calculate({ ...DEFAULTS, annualKm: 0 });

  for (const key of ['dieselLitres', 'gridKwh', 'dieselTonnes', 'electricTonnes', 'reduction', 'lifetimeReduction']) {
    assert.equal(result[key], 0, key);
  }
  assert.equal(result.costPerTonne, null);
  assert.equal(result.breakEvenGrid, null);
  assert.equal(result.subsidy, 235_200_000);
});

test('comparison keeps numerical order, adds the custom case, and de-duplicates preset cases', () => {
  assert.deepEqual(compareScenarios(DEFAULTS).map(({ vehicles }) => vehicles), [150, 300, 600]);
  const inputs = { ...DEFAULTS, vehicles: 225, grid: 0.5 };
  const comparison = compareScenarios(inputs);

  assert.deepEqual(comparison.map(({ vehicles }) => vehicles), [150, 225, 300, 600]);
  assert.deepEqual(comparison[1], calculate(inputs));
  assert.ok(comparison.every(({ reduction }) => reduction < 0));
  assert.deepEqual(compareScenarios({ ...DEFAULTS, vehicles: 600 }).map(({ vehicles }) => vehicles), [150, 300, 600]);
});
