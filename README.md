# CUE DJ set database demo

A browser frontend for the A1 DJ Set Management System. It displays fictional metadata from PostgreSQL through the deployed CUE v1 HTTPS API and implements proposal operations R1–R5. It has no audio features or personal accounts.

## Run

Serve the hand-written `dist/` source with `python3 -m http.server 4173 --directory dist`. No build or package installation is required for the application.

API base: `https://db.yhluk.com/api/v1`. The documented permitted browser origin is `https://wendavidliao.github.io`; the existing Pages workflow publishes `dist/` on pushes to main. A local server needs its precise origin allowed by the backend. On 2026-10-24 a preflight from `http://localhost:4173` did not receive an allow-origin header. Do not disable browser security to bypass CORS.

## Demo operations

- R1: search by track title or artist and filter by genre, tag, key and inclusive BPM bounds.
- R2: select tracks and create a set with initial membership in one POST transaction. Empty sets are supported.
- R3: open a set, add/remove tracks, drag or use arrows to reorder, edit notes, and save the full arrangement atomically. Rename saves separately; save an arrangement before renaming.
- R4: create/edit/delete cue annotations and display database-derived bars. Track timing edits refresh cues so trigger-maintained bars can be shown.
- R5: view ordered contents, count, average BPM and source duration. Statistics are browser calculations from the loaded track records, not evidence that the SQL summary view was queried. Empty-set average BPM displays an em dash.

Browsing is public. Enable editing by entering the privately supplied shared write token in the runtime dialog. It remains in memory only and is checked by the server on writes; enabling the interface does not validate the token. Locking or reloading clears it. No token belongs in Git, localStorage, screenshots or build variables.

Reset was removed because there is no reset API. Track and set deletion use fresh detail ETags and explicit confirmation. Track deletion is rejected while a set references it; deleting a set preserves library tracks. No additional catalogue-management screens were added. The existing track forms use catalogue records from the database.

## Integration behaviour

`frontend-client.js` handles individual resources and HTTP errors. `api.js` assembles all pages for the small teaching catalogue; it does not read localStorage or silently fall back to mock records. Separate list requests do not provide a cross-resource snapshot; use Refresh data if another demonstrator changes related records.

Forms send explicit writable fields only. Server-generated IDs, derived bars, set positions and addition timestamps are never submitted. Classification uses stable IDs, including distinct tags with duplicate names. Unknown timing and metadata remain null. Arbitrary stored colour text is not injected into inline CSS; unsupported colours use a neutral display fallback.

Editing starts with a detail GET and retains its exact ETag. PATCH/PUT/DELETE send If-Match. A 412 preserves input and blocks stale form submission; set conflicts offer side-by-side JSON comparison and explicit discard/reload. There is no automatic overwrite. Unsaved set arrangements prompt before navigation or refresh.

Writes are not automatically retried. Network failures may happen after commit: creation forms stop resubmission and ask the demonstrator to refresh/verify. Only successful responses produce saved notifications. Requests time out after 15 seconds. Database field errors appear in forms. The API limits lists to 100 associations/items and request bodies to 16 KiB; long notes can hit the body limit before 100 items.

## Verification

Run API-client checks with `node tests/client.mjs` (modern Node). Run isolated browser tests with `node tests/smoke.cjs`, with Playwright available through module resolution or `CUE_PLAYWRIGHT_PATH`. Chrome is the default browser channel; override with `CUE_BROWSER_CHANNEL`. This test runs its own localhost server on port 4173 and intercepts all API requests. Its fixture is not a SQL backend and cannot prove database constraints, rollback or triggers.

Run public read-only deployment checks with `python3 tests/live-reads.py`; curl must be installed. This script sends GET requests only.

See `tests/VERIFICATION.md` for tested coverage and outstanding live-write checks. Do not test writes on shared records. Keep SQL/CLI evidence for transaction rollback, constraints, normalisation and advisory-lock behaviour.

For a browser-level live read check, run `node tests/live-browser.cjs` with the same Playwright setup. It substitutes local application files at the documented allowed origin inside its isolated browser only, reads the real API, and rejects any non-GET API request. It does not publish files or change the hosted page.

The frontend is complete against the supplied v1.1 contract. At the user’s direction, backend write behaviour is assumed to follow that contract; no claim of live write verification is made.
