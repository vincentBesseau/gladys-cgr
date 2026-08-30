import { test } from 'node:test';
import assert from 'node:assert/strict';
import { searchCinemas, nearestCinemas } from '../src/cgr/cinemas.js';

test('returns every cinema when the query is empty', () => {
  const results = searchCinemas('');
  assert.ok(results.length > 60);
  assert.ok(results.every((c) => c.id && c.name));
});

test('filters by name, case and accent insensitively', () => {
  const results = searchCinemas('rennes');
  assert.ok(results.length > 0);
  assert.ok(results.every((c) => c.name.toLowerCase().includes('rennes')));
});

test('returns an empty array when nothing matches', () => {
  assert.deepEqual(searchCinemas('this-city-does-not-exist'), []);
});

test('every cinema id matches the P0000-style format', () => {
  const results = searchCinemas('');
  assert.ok(results.every((c) => /^[A-Z]\d{4}$/.test(c.id)));
});

test('every cinema has a valid latitude/longitude', () => {
  const results = searchCinemas('');

  assert.ok(
    results.every(
      (c) =>
        typeof c.latitude === 'number' &&
        typeof c.longitude === 'number' &&
        Math.abs(c.latitude) <= 90 &&
        Math.abs(c.longitude) <= 180,
    ),
  );
});

test('nearestCinemas sorts by distance, nearest first, and attaches distanceKm', () => {
  // A point right next to CGR Brignais Lyon.
  const nearBrignais = { latitude: 45.68, longitude: 4.77 };

  const results = nearestCinemas(nearBrignais, 5);

  assert.equal(results.length, 5);
  assert.ok(results.every((c) => typeof c.distanceKm === 'number'));

  for (let i = 1; i < results.length; i += 1) {
    assert.ok(results[i].distanceKm >= results[i - 1].distanceKm);
  }

  assert.equal(results[0].id, 'P0905', 'CGR Brignais Lyon should be the closest match');
});

test('nearestCinemas respects the limit', () => {
  const nearBrignais = { latitude: 45.68, longitude: 4.77 };

  assert.equal(nearestCinemas(nearBrignais, 3).length, 3);
  assert.equal(nearestCinemas(nearBrignais, 1).length, 1);
});
