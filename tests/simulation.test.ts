import { describe, it, expect } from 'vitest';
import { createCity, place } from '../src/simulation';
describe('construction boundary', () => {
  it('charges one road once and rejects duplicate construction', () => {
    const city = createCity();
    expect(place(city, 5, 5, 'road').ok).toBe(true);
    expect(city.cash).toBe(13970);
    expect(place(city, 5, 5, 'road').ok).toBe(false);
    expect(city.cash).toBe(13970);
  });
});
import { analyze, demolish, id, layUtility, removeUtility } from '../src/simulation';
function build(
  city: ReturnType<typeof createCity>,
  x: number,
  y: number,
  k: Parameters<typeof place>[3],
) {
  expect(place(city, x, y, k).ok, `${k} at ${x},${y}`).toBe(true);
}
function infrastructure() {
  const c = createCity();
  for (let x = 2; x <= 10; x++) build(c, x, 5, 'road');
  build(c, 2, 4, 'water');
  build(c, 3, 4, 'power');
  for (let x = 2; x <= 10; x++)
    for (const u of ['wire', 'pipe'] as const) expect(layUtility(c, x, 5, u).ok).toBe(true);
  return c;
}
describe('independent utility networks', () => {
  it('disconnects and reconnects supply after a water pipe is removed', () => {
    const c = infrastructure();
    build(c, 8, 4, 'residential');
    expect(analyze(c).districts[id(8, 4)].served).toBe(true);
    removeUtility(c, 6, 5, 'pipe');
    expect(analyze(c).districts[id(8, 4)].served).toBe(false);
    layUtility(c, 6, 5, 'pipe');
    expect(analyze(c).districts[id(8, 4)].served).toBe(true);
  });
});
import { tick } from '../src/simulation';
it('grows a served home then loses residents when water is demolished', () => {
  const c = infrastructure();
  build(c, 7, 4, 'residential');
  tick(c);
  expect(analyze(c).population).toBe(10);
  demolish(c, 2, 4);
  tick(c);
  expect(analyze(c).population).toBe(0);
});
