// -----------------------------------------------------------------------------
// "Now playing" for one CGR cinema.
//
// cgrcinemas.fr's own site calls these exact endpoints (verified live: no
// authentication, no session cookie) to render its cinema page: `schedule`
// for today's sessions, `movies` for the film metadata (title, poster,
// synopsis, release date, trailer — all in one call, unlike a site that only
// serves rendered HTML).
// -----------------------------------------------------------------------------

import { createLogger } from '@gladysassistant/integration-sdk';
import { cgrGetJson } from './client.js';

const logger = createLogger({ name: 'cgr-now-playing' });

const VERSION_TAGS = {
  ORIGINAL: 'Localization.Version.Original',
  FRENCH: 'Localization.Language.French',
  SUBTITLED: 'Showtime.Accessibility.Subtitled',
};

function todayWindow(now = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const isoLocal = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(
      date.getHours(),
    ).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:00`;

  return { from: isoLocal(start), to: isoLocal(end), dateKey: isoLocal(start).slice(0, 10) };
}

/**
 * Turn a session's tags into a short display label, the same VF/VO/VOST
 * vocabulary UGC's own site already uses.
 * @param {string[]} tags
 * @returns {string|undefined}
 */
function versionLabel(tags = []) {
  if (tags.includes(VERSION_TAGS.ORIGINAL)) {
    return tags.includes(VERSION_TAGS.SUBTITLED) ? 'VOST' : 'VO';
  }
  if (tags.includes(VERSION_TAGS.FRENCH)) {
    return 'VF';
  }
  return undefined;
}

function slugify(title) {
  return title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * @param {string} theaterId
 * @param {string} dateKey - "YYYY-MM-DD"
 * @returns {Promise<Map<string, Array<{time: string, version?: string}>>>}
 */
async function fetchShowtimesByFilmId(theaterId, from, to, dateKey) {
  const theaters = JSON.stringify({ id: theaterId, timeZone: 'Europe/Paris' });
  const payload = await cgrGetJson('schedule', { from, to, theaters });
  const scheduleByFilmId = payload?.[theaterId]?.schedule || {};

  const showtimesByFilmId = new Map();

  for (const [filmId, byDate] of Object.entries(scheduleByFilmId)) {
    const sessions = byDate[dateKey];

    if (!Array.isArray(sessions) || sessions.length === 0) {
      continue;
    }

    const showtimes = sessions
      .filter((session) => typeof session.startsAt === 'string')
      .map((session) => {
        const time = session.startsAt.slice(11, 16);
        const version = versionLabel(session.tags);

        return version ? { time, version } : { time };
      });

    if (showtimes.length > 0) {
      showtimesByFilmId.set(filmId, showtimes);
    }
  }

  return showtimesByFilmId;
}

function toMovie(rawMovie, showtimes) {
  const locale = rawMovie.locale || {};
  const title = locale.title || rawMovie.title;
  const releaseDate = typeof rawMovie.release === 'string' ? rawMovie.release.slice(0, 10) : null;

  if (!rawMovie.id || !title || !releaseDate) {
    logger.debug(`CGR film ${rawMovie.id} (${title}) is missing a required field, skipping it`);

    return null;
  }

  const posterUrl = locale.poster?.url || rawMovie.poster || undefined;
  const overview = locale.synopsis || rawMovie.synopsis || undefined;
  const trailerUrl = rawMovie.trailer?.HD || rawMovie.trailer?.SD || undefined;

  return {
    id: String(rawMovie.id),
    title,
    releaseDate,
    overview,
    posterUrl,
    trailerUrl,
    sourceUrl: `https://www.cgrcinemas.fr/films-a-l-affiche/${rawMovie.id}-${slugify(title)}/`,
    showtimes,
  };
}

/**
 * Fetch and parse the films currently playing at a CGR cinema, including
 * their showtimes and trailer.
 * @param {string} theaterId
 * @param {object} [options]
 * @param {Date} [options.now] - Overridable for tests; defaults to the real current time.
 * @returns {Promise<Array<{id: string, title: string, releaseDate: string, overview?: string, posterUrl?: string, trailerUrl?: string, sourceUrl: string, showtimes?: Array<{time: string, version?: string}>}>>}
 */
export async function fetchNowPlaying(theaterId, { now = new Date() } = {}) {
  const { from, to, dateKey } = todayWindow(now);
  const showtimesByFilmId = await fetchShowtimesByFilmId(theaterId, from, to, dateKey);

  const filmIds = [...showtimesByFilmId.keys()];

  if (filmIds.length === 0) {
    logger.info(`CGR cinema ${theaterId}: 0 film(s) currently playing`);

    return [];
  }

  const params = new URLSearchParams({ basic: 'false', castingLimit: '3' });
  filmIds.forEach((id) => params.append('ids', id));

  const rawMovies = await cgrGetJson('movies', params);

  const movies = (Array.isArray(rawMovies) ? rawMovies : [])
    .map((rawMovie) => toMovie(rawMovie, showtimesByFilmId.get(String(rawMovie.id))))
    .filter(Boolean);

  logger.info(`CGR cinema ${theaterId}: ${movies.length} film(s) currently playing`);

  return movies;
}
