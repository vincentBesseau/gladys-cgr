// -----------------------------------------------------------------------------
// Static list of CGR cinemas (id, name), refreshed by hand from
// cgrcinemas.fr's own public sitemap (see README "Refreshing the cinema
// list"). There is no dynamic "select" field type in Gladys for anything
// other than devices, so the "Find my cinema" action searches this list and
// the user pastes the chosen ID into the `cinema_id` config field.
// -----------------------------------------------------------------------------

import cinemas from './cinemas.json' with { type: 'json' };

function normalize(value = '') {
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // strip combining diacritics left by NFD normalization
}

/**
 * @param {string} [query] - city or name fragment (case/accent-insensitive).
 * @returns {Array<{id: string, name: string}>}
 */
export function searchCinemas(query = '') {
  const needle = normalize(query.trim());

  if (!needle) {
    return cinemas.map(({ id, name }) => ({ id, name }));
  }

  return cinemas
    .filter((cinema) => normalize(cinema.name).includes(needle))
    .map(({ id, name }) => ({ id, name }));
}
