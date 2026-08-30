// -----------------------------------------------------------------------------
// Thin HTTP client for cgrcinemas.fr's own public JSON API.
//
// cgrcinemas.fr's own site calls these exact endpoints (under
// /api/gatsby-source-boxofficeapi/) to render its "now playing" and
// showtimes pages for every visitor: no API key, no session cookie, no
// authentication of any kind (verified live: a fresh HTTP client with no
// prior request gets the same 200 response as a browser). It is unofficial
// (CGR does not publish or support it) and can change or disappear without
// notice — see the manifest's disclaimer.
//
// Node 20+ provides `fetch` natively: no HTTP client dependency needed.
// -----------------------------------------------------------------------------

import { createLogger } from '@gladysassistant/integration-sdk';

const logger = createLogger({ name: 'cgr-client' });

const BASE_URL = 'https://www.cgrcinemas.fr/api/gatsby-source-boxofficeapi';
const REQUEST_TIMEOUT_MS = 15_000;

/**
 * GET one of cgrcinemas.fr's own JSON API actions.
 * @param {string} action - e.g. "scheduledMovies"
 * @param {Record<string, string>|URLSearchParams} params - A URLSearchParams
 * is required when a key repeats (e.g. `ids=1&ids=2`), which a plain object
 * cannot represent.
 * @returns {Promise<any>} The parsed JSON body.
 */
export async function cgrGetJson(action, params = {}) {
  const url = new URL(`${BASE_URL}/${action}`);
  const entries = params instanceof URLSearchParams ? params.entries() : Object.entries(params);
  for (const [key, value] of entries) {
    url.searchParams.append(key, value);
  }

  logger.debug('cgrcinemas.fr request ->', url.toString());

  const response = await fetch(url, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: {
      // A plain, honest identification: not spoofing a browser, not hiding
      // what this is. cgrcinemas.fr answers it exactly like any other client.
      'user-agent': 'gladys-cgr integration (github.com/vincentBesseau/gladys-cgr)',
    },
  });

  if (!response.ok) {
    throw new Error(`cgrcinemas.fr HTTP ${response.status} on ${action}`);
  }

  return response.json();
}
