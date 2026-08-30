import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { fetchNowPlaying } from '../src/cgr/nowPlaying.js';

const realFetch = globalThis.fetch;

const scheduleSample = JSON.parse(
  readFileSync(fileURLToPath(new URL('./fixtures/schedule-sample.json', import.meta.url)), 'utf-8'),
);
const moviesSample = JSON.parse(
  readFileSync(fileURLToPath(new URL('./fixtures/movies-sample.json', import.meta.url)), 'utf-8'),
);

// Matches the fixtures' "today" (2026-08-30); noon avoids any day-boundary edge case.
const TODAY = new Date('2026-08-30T12:00:00');

afterEach(() => {
  globalThis.fetch = realFetch;
});

function fetchRouter({ schedule = scheduleSample, movies = moviesSample } = {}) {
  return async (url) => {
    const href = url.toString();

    if (href.includes('/schedule?')) {
      return { ok: true, json: async () => schedule };
    }

    if (href.includes('/movies?')) {
      return { ok: true, json: async () => movies };
    }

    throw new Error(`Unexpected fetch: ${href}`);
  };
}

test('parses films playing today, with showtimes and trailer', async () => {
  globalThis.fetch = fetchRouter();

  const movies = await fetchNowPlaying('P0905', { now: TODAY });

  assert.equal(
    movies.length,
    2,
    'the film missing a release date is dropped, and tomorrow-only film is never fetched',
  );

  const [harryPotter, spiderMan] = movies;

  assert.deepEqual(harryPotter, {
    id: '134925',
    title: 'Harry Potter et les reliques de la mort - partie 2',
    releaseDate: '2011-07-13',
    overview: 'Le combat final entre Harry et Voldemort.',
    posterUrl: 'https://all.web.img.acsta.net/medias/nmedia/18/78/64/49/19762436.jpg',
    trailerUrl: 'https://fr.vid.web.acsta.net/nmedia/s3/33/18/78/64/49/19215613_hd_013.mp4',
    sourceUrl:
      'https://www.cgrcinemas.fr/films-a-l-affiche/134925-harry-potter-et-les-reliques-de-la-mort-partie-2/',
    showtimes: [
      { time: '20:00', version: 'VF' },
      { time: '20:15', version: 'VOST' },
    ],
  });

  assert.equal(spiderMan.id, '276608');
  assert.equal(spiderMan.posterUrl, undefined, 'no poster in either field of the fixture');
  assert.equal(spiderMan.trailerUrl, undefined, 'no trailer in the fixture');
  assert.deepEqual(spiderMan.showtimes, [{ time: '18:30', version: 'VO' }]);
});

test('omits the version label for a showtime with no recognizable language/version tag', async () => {
  const schedule = {
    P0905: {
      schedule: {
        276608: { '2026-08-30': [{ startsAt: '2026-08-30T21:00:00', tags: [] }] },
      },
    },
  };
  globalThis.fetch = fetchRouter({ schedule });

  const movies = await fetchNowPlaying('P0905', { now: TODAY });
  const spiderMan = movies.find((movie) => movie.id === '276608');

  assert.deepEqual(spiderMan.showtimes, [{ time: '21:00' }]);
});

test('requests the correct theater and stays within the requested date', async () => {
  let scheduleUrl;
  globalThis.fetch = async (url) => {
    const href = url.toString();
    if (href.includes('/schedule?')) {
      scheduleUrl = href;
      return { ok: true, json: async () => scheduleSample };
    }
    return { ok: true, json: async () => moviesSample };
  };

  await fetchNowPlaying('P0905', { now: TODAY });

  const parsed = new URL(scheduleUrl);
  const theaters = JSON.parse(parsed.searchParams.get('theaters'));
  assert.equal(theaters.id, 'P0905');
  assert.equal(theaters.timeZone, 'Europe/Paris');
  assert.equal(parsed.searchParams.get('from'), '2026-08-30T00:00:00');
  assert.equal(parsed.searchParams.get('to'), '2026-08-31T00:00:00');
});

test('returns an empty array and skips the movies call when nothing plays today', async () => {
  let moviesCalled = false;
  globalThis.fetch = async (url) => {
    const href = url.toString();
    if (href.includes('/schedule?')) {
      return { ok: true, json: async () => ({ P0905: { schedule: {} } }) };
    }
    moviesCalled = true;
    return { ok: true, json: async () => [] };
  };

  const movies = await fetchNowPlaying('P0905', { now: TODAY });

  assert.deepEqual(movies, []);
  assert.equal(moviesCalled, false);
});
