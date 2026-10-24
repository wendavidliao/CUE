/** Resource API client. Keep the write token in memory; never put it in GitHub. */
export class CueApiError extends Error {
  constructor(status, error) {
    super(error?.message || `HTTP ${status}`);
    this.name = 'CueApiError';
    this.status = status;
    this.code = error?.code || 'HTTP_ERROR';
    this.fields = error?.fields || {};
    this.constraint = error?.constraint || null;
  }
}

export function createCueClient({ baseUrl = 'https://db.yhluk.com/api/v1' } = {}) {
  let writeToken = '';
  async function request(path, { method = 'GET', body, etag } = {}) {
    const headers = { Accept: 'application/json' };
    if (method !== 'GET') {
      if (!writeToken) throw new CueApiError(401, { code: 'TOKEN_REQUIRED', message: '请先输入组内写入令牌。' });
      headers.Authorization = `Bearer ${writeToken}`;
    }
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (etag) headers['If-Match'] = etag;
    // No automatic retry: a network failure may occur after the server commits.
    const response = await fetch(baseUrl + path, {
      method, headers, body: body === undefined ? undefined : JSON.stringify(body),
      credentials: 'omit', cache: 'no-store', signal: AbortSignal.timeout(15000),
    });
    const text = await response.text();
    let payload = null;
    try { payload = text ? JSON.parse(text) : null; } catch { /* proxy/network error */ }
    if (!response.ok) throw new CueApiError(response.status, payload?.error);
    if (response.status !== 204 && (!payload || !Object.hasOwn(payload, 'data'))) throw new CueApiError(502, { code: 'INVALID_RESPONSE', message: 'The API returned an invalid response. Refresh to confirm the current database state.' });
    return { data: payload?.data ?? null, meta: payload?.meta,
      etag: response.headers.get('ETag'), location: response.headers.get('Location') };
  }
  const resources = new Set(['tracks', 'artists', 'albums', 'genres', 'tags', 'sets', 'cues']);
  function resourcePath(resource, id) {
    if (!resources.has(resource)) throw new TypeError('Unknown CUE resource');
    if (id !== undefined && (!Number.isSafeInteger(id) || id <= 0)) throw new TypeError('Invalid CUE ID');
    return `/${resource}${id === undefined ? '' : `/${id}`}`;
  }
  return {
    setWriteToken(token) { writeToken = String(token || '').trim(); },
    clearWriteToken() { writeToken = ''; },
    list(resource, filters = {}) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(filters)) if (value !== undefined && value !== null) params.set(key, value);
      return request(`${resourcePath(resource)}?${params}`);
    },
    get: (resource, id) => request(resourcePath(resource, id)),
    create: (resource, body) => request(resourcePath(resource), { method: 'POST', body }),
    update: (resource, id, body, etag) => request(resourcePath(resource, id), { method: 'PATCH', body, etag }),
    remove: (resource, id, etag) => request(resourcePath(resource, id), { method: 'DELETE', etag }),
    replaceSetItems: (id, items, etag) => request(`${resourcePath('sets', id)}/items`, { method: 'PUT', body: { items }, etag }),
    listTrackCues: (id, filters = {}) => request(`${resourcePath('tracks', id)}/cues?${new URLSearchParams(filters)}`),
    createTrackCue: (id, body) => request(`${resourcePath('tracks', id)}/cues`, { method: 'POST', body }),
  };
}
