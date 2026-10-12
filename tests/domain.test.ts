import { describe, it, expect } from 'vitest';
import {
  analyze,
  advance,
  createCity,
  demolish,
  id,
  place,
  qualifies,
  rescue,
  setTax,
  tick,
} from '../src/simulation';
import { serialize, deserialize } from '../src/save';
import { build, charterCity, settle } from './fixtures';
describe('safe construction', () => {
  it('rejects river, rock, remote pump and invalid coordinates without charging', () => {
    const c = createCity();
    for (const [x, y, k] of [
      [0, 0, 'road'],
      [15, 0, 'residential'],
      [7, 7, 'water'],
      [-1, 5, 'road'],
      [16, 5, 'road'],
      [5.5, 5, 'road'],
      [NaN, 4, 'road'],
    ] as const)
      expect(place(c, x, y, k).ok).toBe(false);
    expect(c.cash).toBe(14000);
    expect(c.tiles.every((t) => t.kind === 'empty')).toBe(true);
  });
  it('rejects unaffordable placement and does not replace occupied tiles', () => {
    const c = createCity();
    for (let y = 0; y < 16; y++) for (let x = 2; x < 15; x++) place(c, x, y, 'power');
    const cash = c.cash;
    expect(place(c, 10, 15, 'power').ok).toBe(false);
    expect(place(c, 3, 0, 'road').ok).toBe(false);
    expect(c.cash).toBe(cash);
    expect(c.cash).toBeGreaterThanOrEqual(0);
  });
  it('free repeated demolition never removes terrain or refunds money', () => {
    const c = createCity();
    build(c, 5, 5, 'road');
    expect(demolish(c, 5, 5)).toBe(true);
    expect(demolish(c, 5, 5)).toBe(false);
    expect(demolish(c, 0, 0)).toBe(false);
    expect(demolish(c, NaN, 0)).toBe(false);
    expect(c.cash).toBe(13970);
    expect(c.tiles[0].terrain).toBe('river');
  });
});
describe('network supply and reserved capacity', () => {
  it('does not supply an island from a distant utility', () => {
    const c = charterCity();
    build(c, 12, 12, 'road');
    build(c, 12, 11, 'residential');
    const d = analyze(c).districts[id(12, 11)];
    expect(d.road).toBe(true);
    expect(d.power).toBe(false);
    expect(d.water).toBe(false);
    tick(c);
    expect(c.tiles[id(12, 11)].amount).toBe(0);
  });
  it('empty districts reserve capacity; additional plants restore an overflow', () => {
    const c = createCity();
    for (let x = 2; x <= 13; x++) build(c, x, 5, 'road');
    build(c, 2, 4, 'water');
    build(c, 3, 4, 'power');
    for (let x = 4; x <= 12; x++) build(c, x, 4, 'residential');
    for (let x = 2; x <= 8; x++) build(c, x, 6, 'residential');
    let r = analyze(c);
    expect(Object.values(r.districts).filter((d) => d.served)).toHaveLength(15);
    expect(r.reserved).toBe(640);
    build(c, 13, 4, 'power');
    demolish(c, 2, 6);
    build(c, 2, 6, 'water');
    build(c, 9, 6, 'residential');
    r = analyze(c);
    expect(Object.values(r.districts).filter((d) => d.served)).toHaveLength(16);
    expect(r.power).toBe(1200);
    expect(r.water).toBe(1200);
  });
  it('a power plant touching two isolated roads cannot duplicate its capacity', () => {
    const c = createCity();
    build(c, 3, 5, 'power');
    build(c, 2, 5, 'road');
    build(c, 4, 5, 'road');
    const r = analyze(c);
    expect(r.networks).toHaveLength(2);
    expect(r.networks.filter((n) => n.power > 0)).toHaveLength(1);
    expect(r.power).toBe(600);
  });
  it('cuts supply and growth then recovers when the road is rebuilt', () => {
    const c = charterCity();
    settle(c, 6, tick);
    demolish(c, 4, 5);
    expect(analyze(c).utilities).toBe(0);
    tick(c);
    expect(analyze(c).population).toBe(180);
    build(c, 4, 5, 'road');
    tick(c);
    expect(analyze(c).population).toBe(240);
    expect(analyze(c).utilities).toBe(100);
  });
});
describe('growth, work and local conditions', () => {
  it('does not grow a home without a road', () => {
    const c = createCity();
    build(c, 7, 7, 'residential');
    settle(c, 5, tick);
    expect(analyze(c).population).toBe(0);
    expect(analyze(c).districts[id(7, 7)].reason).toContain('road');
  });
  it('a new town stalls after startup residents without jobs', () => {
    const c = createCity();
    for (let x = 2; x <= 7; x++) build(c, x, 5, 'road');
    build(c, 2, 4, 'water');
    build(c, 3, 4, 'power');
    build(c, 4, 4, 'residential');
    settle(c, 10, tick);
    const r = analyze(c);
    expect(r.population).toBe(40);
    expect(r.workforce).toBe(24);
    expect(r.employed).toBe(0);
    expect(r.income).toBe(101);
    expect(r.districts[id(4, 4)].reason).toContain('jobs');
  });
  it('counts available jobs, workforce and employment separately', () => {
    const c = charterCity();
    tick(c);
    const r = analyze(c);
    expect(r.population).toBe(40);
    expect(r.jobs).toBe(60);
    expect(r.workforce).toBe(24);
    expect(r.employed).toBe(24);
    expect(r.unemployment).toBe(0);
    expect(r.income).toBe(140);
    expect(r.demand.commercial).toBeLessThan(60);
  });
  it('rejects invalid taxes and declines above the growth threshold', () => {
    const c = charterCity();
    settle(c, 6, tick);
    setTax(c, 100);
    setTax(c, NaN);
    expect(c.tax).toBe(9);
    setTax(c, 13);
    tick(c);
    expect(analyze(c).population).toBe(180);
    setTax(c, 12);
    tick(c);
    expect(analyze(c).population).toBe(240);
  });
  it('pollution stops homes and parks provide a spatial remedy', () => {
    const c = charterCity();
    build(c, 7, 7, 'industrial');
    expect(analyze(c).districts[id(7, 6)].pollution).toBe(54);
    tick(c);
    expect(c.tiles[id(7, 6)].amount).toBe(0);
    build(c, 6, 7, 'park');
    expect(analyze(c).districts[id(7, 6)].pollution).toBe(30);
    tick(c);
    expect(c.tiles[id(7, 6)].amount).toBe(10);
  });
  it('civic coverage needs proximity and the same connected road network', () => {
    const c = charterCity();
    settle(c, 4, tick);
    expect(analyze(c).coverage).toBe(100);
    demolish(c, 7, 4);
    expect(analyze(c).coverage).toBe(0);
    build(c, 14, 12, 'road');
    build(c, 14, 11, 'fire');
    expect(analyze(c).coverage).toBe(0);
  });
  it('unemployed residents depress satisfaction and never pay workplace tax', () => {
    const c = charterCity();
    settle(c, 5, tick);
    for (const [x, y] of [
      [10, 4],
      [11, 4],
      [10, 6],
      [11, 6],
      [8, 7],
      [10, 7],
    ])
      demolish(c, x, y);
    const r = analyze(c);
    expect(r.jobs).toBe(0);
    expect(r.employed).toBe(0);
    expect(r.unemployment).toBe(100);
    expect(r.satisfaction).toBe(66);
    expect(r.income).toBe(605);
  });
});
describe('charter and treasury', () => {
  it('has an ordinary-controls construction path to victory, then sandbox continues', () => {
    const c = charterCity();
    expect(c.cash).toBe(9050);
    tick(c);
    expect(c.cash).toBe(9458);
    expect(c.milestones).toEqual([true, false, false]);
    tick(c);
    tick(c);
    expect(c.milestones).toEqual([true, true, false]);
    tick(c);
    expect(c.stable).toBe(0);
    tick(c);
    expect(c.stable).toBe(1);
    tick(c);
    expect(c.won).toBe(false);
    tick(c);
    expect(c.won).toBe(true);
    expect(c.cash).toBe(13006);
    expect(analyze(c).net).toBe(606);
    tick(c);
    expect(c.month).toBe(8);
    expect(c.won).toBe(true);
    expect(c.cash).toBe(13612);
  });
  it('requires every exact final threshold', () => {
    const c = charterCity();
    settle(c, 5, tick);
    const r = analyze(c);
    expect(qualifies(r, c)).toBe(true);
    for (const [key, value] of [
      ['population', 239],
      ['jobs', 119],
      ['satisfaction', 64],
      ['utilities', 99],
      ['coverage', 74],
      ['net', -1],
    ] as const)
      expect(qualifies({ ...r, [key]: value }, c), key).toBe(false);
    expect(qualifies(r, { ...c, cash: 1499 })).toBe(false);
  });
  it('resets consecutive stability if a network is cut; never repeats grants', () => {
    const c = charterCity();
    settle(c, 6, tick);
    expect(c.stable).toBe(2);
    demolish(c, 4, 5);
    tick(c);
    expect(c.stable).toBe(0);
    expect(c.won).toBe(false);
    const cash = c.cash;
    build(c, 4, 5, 'road');
    tick(c);
    expect(c.stable).toBe(1);
    expect(c.cash - cash).toBe(576);
  });
  it('runs into debt under ordinary overbuilding, recovers by grant and demolition', () => {
    const c = createCity();
    for (let x = 3; x <= 12; x++) build(c, x, 8, 'power');
    settle(c, 10, tick);
    expect(c.cash).toBe(-1000);
    expect(place(c, 6, 6, 'road').ok).toBe(false);
    expect(rescue(c)).toBe(true);
    expect(c.cash).toBe(2000);
    expect(rescue(c)).toBe(false);
    for (let x = 3; x <= 12; x++) demolish(c, x, 8);
    tick(c);
    expect(analyze(c).upkeep).toBe(0);
    build(c, 2, 5, 'road');
    build(c, 2, 4, 'water');
    build(c, 3, 5, 'road');
    build(c, 3, 4, 'power');
    build(c, 2, 6, 'residential');
    build(c, 3, 6, 'commercial');
    settle(c, 8, tick);
    expect(analyze(c).net).toBeGreaterThan(0);
    expect(c.cash).toBeGreaterThan(0);
  });
  it('keeps accounting bounded over a long sandbox', () => {
    const c = charterCity();
    settle(c, 150, tick);
    const r = analyze(c);
    expect(r.population).toBe(240);
    expect(r.jobs).toBe(180);
    expect(r.employed).toBe(144);
    expect(c.history).toHaveLength(24);
    expect(c.tiles.every((t) => t.amount >= 0 && t.amount <= 40)).toBe(true);
    expect(c.cash).toBeGreaterThan(0);
  });
});
describe('clock boundary', () => {
  it('paused elapsed time does not change month, tiles or treasury', () => {
    const c = charterCity(),
      snapshot = serialize(c),
      clock = { elapsed: 1 };
    advance(c, clock, 20);
    expect(serialize(c)).toBe(snapshot);
    expect(clock.elapsed).toBe(0);
  });
  it('equal months are identical at normal and fast speed', () => {
    const a = charterCity(),
      b = charterCity();
    a.speed = 1;
    b.speed = 4;
    const ca = { elapsed: 0 },
      cb = { elapsed: 0 };
    for (let n = 0; n < 12; n++) advance(a, ca, 1);
    for (let n = 0; n < 12; n++) advance(b, cb, 0.25);
    a.speed = 0;
    b.speed = 0;
    expect(a.month).toBe(6);
    expect(serialize(a)).toBe(serialize(b));
  });
  it('ignores invalid time and bounds catch-up after interruptions', () => {
    const c = charterCity();
    c.speed = 1;
    const clock = { elapsed: 0 };
    advance(c, clock, NaN);
    advance(c, clock, -1);
    expect(c.month).toBe(0);
    advance(c, clock, 10000);
    expect(c.month).toBe(1);
  });
});
it('an exhausted grant cannot strand an empty indebted city', () => {
  const c = createCity();
  for (let x = 3; x <= 12; x++) build(c, x, 8, 'power');
  settle(c, 10, tick);
  rescue(c);
  settle(c, 10, tick);
  expect(c.cash).toBe(-4000);
  for (let x = 3; x <= 12; x++) demolish(c, x, 8);
  tick(c);
  expect(c.cash).toBe(3000);
  expect(place(c, 5, 5, 'road').ok).toBe(true);
});
it('shares the 40-person jobless startup allowance across every home', () => {
  const c = createCity();
  for (let x = 2; x <= 12; x++) build(c, x, 5, 'road');
  build(c, 2, 4, 'water');
  build(c, 3, 4, 'power');
  for (let x = 4; x <= 12; x++) build(c, x, 4, 'residential');
  for (let x = 2; x <= 7; x++) build(c, x, 6, 'residential');
  tick(c);
  expect(analyze(c).population).toBe(40);
  expect(analyze(c).jobs).toBe(0);
  tick(c);
  expect(analyze(c).population).toBe(40);
});
