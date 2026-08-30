import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { cgrGetJson } from '../src/cgr/client.js';

const realFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = realFetch;
});

test('builds the request URL from the action and a plain params object', async () => {
  let calledUrl;
  globalThis.fetch = async (url) => {
    calledUrl = url;
    return { ok: true, json: async () => ({}) };
  };

  await cgrGetJson('scheduledMovies', { theaterId: 'P0905' });

  assert.equal(
    calledUrl.toString(),
    'https://www.cgrcinemas.fr/api/gatsby-source-boxofficeapi/scheduledMovies?theaterId=P0905',
  );
});

test('supports a repeated key via URLSearchParams', async () => {
  let calledUrl;
  globalThis.fetch = async (url) => {
    calledUrl = url;
    return { ok: true, json: async () => ({}) };
  };

  const params = new URLSearchParams();
  params.append('ids', '1');
  params.append('ids', '2');

  await cgrGetJson('movies', params);

  assert.equal(
    calledUrl.toString(),
    'https://www.cgrcinemas.fr/api/gatsby-source-boxofficeapi/movies?ids=1&ids=2',
  );
});

test('sends an honest, self-identifying user-agent', async () => {
  let calledOptions;
  globalThis.fetch = async (url, options) => {
    calledOptions = options;
    return { ok: true, json: async () => ({}) };
  };

  await cgrGetJson('scheduledMovies');

  assert.match(calledOptions.headers['user-agent'], /gladys-cgr/);
});

test('throws on a non-2xx response', async () => {
  globalThis.fetch = async () => ({ ok: false, status: 503 });

  await assert.rejects(() => cgrGetJson('scheduledMovies'), /cgrcinemas\.fr HTTP 503/);
});

test('returns the parsed JSON body', async () => {
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ hello: 'world' }) });

  assert.deepEqual(await cgrGetJson('scheduledMovies'), { hello: 'world' });
});
