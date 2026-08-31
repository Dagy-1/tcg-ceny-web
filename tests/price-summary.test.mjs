import assert from 'node:assert/strict';
import test from 'node:test';
import { priceSummary } from '../app/sledovani/price-summary.ts';

test('verified comparison and target distance have independent meanings', () => {
  assert.deepEqual(priceSummary(1799, 1620, false, 1999), {
    current:1799, limit:1620, previous:1999, difference:-200, percent:10, gap:179, reached:false,
  });
  assert.equal(priceSummary(1799, 1620).difference, null);
  assert.equal(priceSummary(1799, 1620).percent, null);
});
test('unknown or stale data cannot imply a price movement or target achievement', () => {
  for (const price of [null, 0, -1, NaN, Infinity]) {
    const result = priceSummary(price, 1620, false, 1999);
    assert.equal(result.current, null);
    assert.equal(result.gap, null);
    assert.equal(result.reached, false);
    assert.equal(result.difference, null);
  }
  const stale = priceSummary(1599, 1620, true, 1999);
  assert.equal(stale.current, 1599);
  assert.equal(stale.gap, null);
  assert.equal(stale.reached, false);
  assert.equal(stale.previous, null);
  assert.equal(priceSummary(1799, null).gap, null);
  assert.equal(priceSummary(1799, -10).limit, null);
});
test('reached, unchanged and rising prices are represented without fake savings', () => {
  assert.equal(priceSummary(1620, 1620).reached, true);
  assert.equal(priceSummary(1599, 1620).gap, 0);
  assert.equal(priceSummary(1799, 1620, false, 1799).difference, 0);
  assert.equal(priceSummary(1999, 1620, false, 1799).difference, 200);
});
