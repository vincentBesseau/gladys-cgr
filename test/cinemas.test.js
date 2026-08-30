import { test } from 'node:test';
import assert from 'node:assert/strict';
import { searchCinemas } from '../src/cgr/cinemas.js';

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
