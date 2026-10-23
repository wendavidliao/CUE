# CUE DJ set frontend demo

A responsive frontend for the DJ Set Management System proposal. It uses fictional text metadata, has no audio features, and does not connect to or create a database. Built with browser ES modules, HTML and CSS; no installation or build step is required.

## Run

Serve `dist/` with any static HTTP server, for example `python3 -m http.server 4173 --directory dist`, then open http://localhost:4173. ES modules require HTTP rather than opening the HTML with file://.

## Demo walkthrough

1. Filter the Track Library by genre, tag, key or inclusive BPM range.
2. Select tracks and create a named set, or open After Hours under DJ Sets.
3. Add tracks, reorder with arrow buttons or drag handles, and edit performance notes. Click Save changes to commit the arrangement.
4. Open a track's Details, inspect Timing, then use Cues to add or edit timestamp annotations.
5. Edit timing metadata to see derived bars recalculate. Invalid timestamps and duration changes that would invalidate existing cues are rejected.
6. Reset demo data restores the original fictional sample. Artist, album, genre and tag records remain available in track forms and filters; there is no separate catalogue management screen.

Edits are stored in localStorage for this browser and origin. Set changes are staged until Save changes. Navigating away from the builder currently discards unsaved set edits.

## Backend integration boundary

`dist/api.js` exports async `api.load()`, `api.save(nextState)`, and `api.reset()`. The UI imports only this adapter for persistence. Replace these methods with HTTP calls and map response records into the frontend shape. `reset()` is demo-only and should be removed from a connected deployment.

Recommended API operations:

| Operation | Suggested route | Backend responsibility |
| --- | --- | --- |
| Search tracks | GET /api/tracks?genre=&tag=&key=&bpm_min=&bpm_max= | Filtering, joins and artist credits |
| Create/edit track | POST /api/tracks; PATCH /api/tracks/:id | Track plus credits/classification transaction |
| Read catalogue | GET /api/artists; /api/albums; /api/genres; /api/tags | Entity records |
| Read sets | GET /api/sets; GET /api/sets/:id | Contents and summary |
| Create set | POST /api/sets | Name and initial items in one transaction |
| Save arrangement | PUT /api/sets/:id/items | Membership, unique positions and notes in one transaction |
| Edit cues | POST /api/tracks/:id/cues; PATCH /api/cues/:id; DELETE /api/cues/:id | Timing bounds and derived bar consistency |

The route names are proposed contracts, not an implemented server. The initial `save(nextState)` adapter is convenient for the demo; replace it with operation-specific calls for integration. The backend must enforce constraints and return friendly error messages. Add version tokens/optimistic concurrency handling for shared multi-client updates.

## Record mapping

Frontend `id` maps to each entity's primary key. Track `key`, `duration`, `downbeat`, `album`, and `instrumental` map to `musical_key`, `duration`, `first_downbeat_seconds`, `album_id`, and `is_instrumental`. Artist `{id, role}` maps to Track_Artist. Genre/tag arrays map to their junction tables (use IDs in the connected adapter, since tag names need not be unique). Set items `{track_id, position, notes, date_added}` map to Set_Track, with `notes` mapping to `performance_notes`. Cue `seconds` maps to `position_seconds` and cue `id` to `cue_info_id`.

`totalBars()` and `cueBar()` compute previews using the proposal's formulas. In the connected version, display backend-derived fields after successful writes. A null first downbeat produces unknown bars; cues before the downbeat have no bar number. Source duration sums full tracks and does not estimate mixed performance time.

## Files

- `dist/index.html`: entry point
- `dist/style.css`: responsive visual system
- `dist/app.js`: screens, forms and local interaction state
- `dist/api.js`: mock API adapter, fictional seed data and validation

## Continued development

The project consists of this README and the four files in `dist/`. In this buildless project, `dist/` is the hand-written application source, not disposable generated output. No package installation is required, so there is no package manifest or lockfile yet.

Local Git metadata and the former Sites hosting configuration have been removed. No hosting service is required to run this project. Removing these local files does not disable the previously published remote demo.

For database integration, start with `dist/api.js` and the operation contracts above. If a framework/build tool is introduced later, move application code into a source directory and keep generated output separate from source files.

This is a frontend prototype, not production database middleware. Albums currently expose only title; release date editing is deferred. Genre hierarchy and user accounts are outside the supplied schema. No real songs, audio files, media upload, waveform or playback are present.
