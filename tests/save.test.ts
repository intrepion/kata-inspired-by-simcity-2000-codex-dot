import { it, expect } from 'vitest';
import { createCity, place } from '../src/simulation';
import { serialize, deserialize } from '../src/save';
it('round trips a city but resumes paused', () => {
  const c = createCity();
  place(c, 5, 5, 'road');
  c.speed = 4;
  const d = deserialize(serialize(c));
  expect(d.tiles).toEqual(c.tiles);
  expect(d.cash).toBe(13970);
  expect(d.speed).toBe(0);
});
it('rejects nonfinite treasury and wrong terrain', () => {
  const c = createCity();
  expect(() => deserialize('{broken')).toThrow();
  c.cash = Infinity;
  expect(() => deserialize(JSON.stringify(c))).toThrow();
});
import { id } from '../src/simulation';
import { charterCity, settle } from './fixtures';
import { tick } from '../src/simulation';
it('preserves a completed charter and exact economic state', () => {
  const c = charterCity();
  settle(c, 7, tick);
  const d = deserialize(serialize(c));
  expect(d).toEqual(c);
  expect(d.won).toBe(true);
});
it('rejects malformed shapes, oversized saves and unsupported versions', () => {
  for (const raw of ['null', '[]', '{}', '"city"', ' '.repeat(100001)])
    expect(() => deserialize(raw)).toThrow();
  const c = createCity();
  expect(() => deserialize(JSON.stringify({ ...c, version: 3 }))).toThrow();
  expect(() => deserialize(JSON.stringify({ ...c, tiles: c.tiles.slice(1) }))).toThrow();
});
it('rejects bounds, invalid flags and incoherent milestones', () => {
  const c = createCity();
  for (const patch of [
    { cash: -1000001 },
    { cash: 1000000001 },
    { cash: 1.5 },
    { month: -1 },
    { month: Infinity },
    { tax: 16 },
    { speed: 2 },
    { grant: 1 },
    { stable: 4 },
    { won: true },
    { milestones: [false, true, false] },
    { milestones: [true] },
    { history: [{ pop: -1, cash: 0, net: 0 }] },
  ])
    expect(() => deserialize(JSON.stringify({ ...c, ...patch }))).toThrow();
});
it('rejects changed terrain, unknown buildings and impossible occupancy', () => {
  for (const patch of [
    { terrain: 'rock' },
    { kind: 'alien' },
    { amount: NaN },
    { amount: -10 },
    { amount: 5 },
    { kind: 'commercial', amount: 40 },
    { kind: 'road', amount: 10 },
    { kind: 'empty', amount: 10 },
  ]) {
    const c = createCity();
    c.tiles[id(5, 5)] = { ...c.tiles[id(5, 5)], ...patch } as (typeof c.tiles)[number];
    expect(() => deserialize(serialize(c))).toThrow();
  }
});
it('rejects construction on protected terrain and a pump away from the river', () => {
  const c = createCity();
  c.tiles[0].kind = 'road';
  expect(() => deserialize(serialize(c))).toThrow();
  const d = createCity();
  d.tiles[id(7, 7)].kind = 'water';
  expect(() => deserialize(serialize(d))).toThrow();
});
it('does not mutate the city when deserialization fails', () => {
  const c = charterCity(),
    before = serialize(c);
  try {
    deserialize('{corrupted');
  } catch {}
  expect(serialize(c)).toBe(before);
});
it('rejects impossible progression but allows a won city to be demolished later', () => {
  const c = createCity();
  for (const patch of [
    { stable: 3 },
    { won: true, milestones: [true, true, true] },
    { stable: 1 },
    { month: 1, milestones: [true, true, false] },
    { month: 5, history: [] },
  ])
    expect(() => deserialize(JSON.stringify({ ...c, ...patch }))).toThrow();
  const d = charterCity();
  settle(d, 7, tick);
  d.tiles.forEach((t) => {
    t.kind = 'empty';
    t.amount = 0;
  });
  tick(d);
  expect(deserialize(serialize(d)).won).toBe(true);
});

it('loads the independent browser-played exported city without changing its finances', async () => {
  const { readFile } = await import('node:fs/promises');
  const raw = await readFile(new URL('../qa/browser-played-city.json', import.meta.url), 'utf8');
  const city = deserialize(raw);
  expect(city.month).toBe(503);
  expect(city.cash).toBe(313582);
  expect(city.won).toBe(true);
  expect(city.speed).toBe(0);
});
