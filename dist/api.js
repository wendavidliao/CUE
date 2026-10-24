import { createCueClient } from './frontend-client.js';
export const api = createCueClient();
// Load every page for this small teaching catalogue, without unbounded concurrency.
api.all = async function(resource) {
  const records = [];
  for (let offset = 0; ; offset += 100) {
    const result = await api.list(resource, { limit: 100, offset });
    if (!Array.isArray(result.data) || !Number.isInteger(result.meta?.total)) throw Error('Invalid API list response');
    records.push(...result.data);
    if (records.length >= result.meta.total) return records;
    if (!result.data.length) throw Error('Catalogue changed during pagination. Refresh data.');
  }
};
api.load = async function() {
  const state = {};
  for (const resource of ['tracks', 'artists', 'albums', 'genres', 'tags', 'sets', 'cues']) {
    state[resource] = await api.all(resource);
  }
  state.genre_records = state.genres;
  state.tag_records = state.tags;
  state.genres = state.genre_records.map(record => record.name);
  state.tags = state.tag_records.map(record => record.name);
  return state;
};
// Display database values, including null; never conceal an incorrect server value.
export const totalBars = track => track.total_bars;
export const cueBar = (_track, cue) => cue.bar_number;
