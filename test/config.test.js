import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeConfig, validateConfig, resolveWidgetCinema } from '../src/config.js';

test('normalizeConfig reads the default cinema (slot 1 keeps the historical keys)', () => {
  assert.deepEqual(normalizeConfig(), { cinema_id: '', cinemas: [] });
  assert.deepEqual(normalizeConfig({ cinema_id: ' p0905 ', cinema_name: ' Le Rex ' }), {
    cinema_id: 'P0905',
    cinemas: [{ id: 'P0905', name: 'Le Rex' }],
  });
});

test('normalizeConfig collects up to five cinemas in slot order, skipping empty slots', () => {
  const config = normalizeConfig({
    cinema_id: 'p0905',
    cinema_name: 'One',
    cinema_id_2: '',
    cinema_id_3: 'c0159',
    cinema_name_3: 'Three',
  });

  assert.equal(config.cinema_id, 'P0905');
  assert.deepEqual(config.cinemas, [
    { id: 'P0905', name: 'One' },
    { id: 'C0159', name: 'Three' },
  ]);
});

test('validateConfig throws when no cinema is set', () => {
  assert.throws(() => validateConfig({ cinema_id: '', cinemas: [] }), /Find my cinema/);
});

test('validateConfig rejects any badly-formatted cinema id (letter + four digits required)', () => {
  assert.throws(() => validateConfig({ cinema_id: 'P905' }), /must look like P0905/);
  assert.throws(() => validateConfig({ cinema_id: '5914Z' }), /must look like P0905/);
  assert.throws(
    () =>
      validateConfig({
        cinema_id: 'P0905',
        cinemas: [
          { id: 'P0905', name: '' },
          { id: 'ABCDE', name: '' },
        ],
      }),
    /must look like P0905/,
  );
});

test('validateConfig accepts well-formed cinema ids', () => {
  assert.doesNotThrow(() => validateConfig({ cinema_id: 'P0905' }));
  assert.doesNotThrow(() =>
    validateConfig({
      cinema_id: 'P0905',
      cinemas: [
        { id: 'P0905', name: '' },
        { id: 'C0159', name: '' },
      ],
    }),
  );
});

test('resolveWidgetCinema picks the cinema at the selected slot', () => {
  const config = normalizeConfig({
    cinema_id: 'P0905',
    cinema_name: 'One',
    cinema_id_2: 'C0159',
    cinema_name_2: 'Two',
  });

  assert.deepEqual(resolveWidgetCinema(config, { cinema: '2' }), { id: 'C0159', name: 'Two' });
});

test('resolveWidgetCinema falls back to the first cinema when the slot is missing or out of range', () => {
  const config = normalizeConfig({ cinema_id: 'P0905', cinema_name: 'One', cinema_id_2: 'C0159' });

  assert.deepEqual(resolveWidgetCinema(config, {}), { id: 'P0905', name: 'One' });
  assert.deepEqual(resolveWidgetCinema(config, { cinema: '5' }), { id: 'P0905', name: 'One' });
  assert.deepEqual(resolveWidgetCinema(config), { id: 'P0905', name: 'One' });
});
