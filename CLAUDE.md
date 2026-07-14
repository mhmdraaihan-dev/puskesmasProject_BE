# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Backend API (Express + Prisma + PostgreSQL) for "SiBidan", a Puskesmas/midwifery health-data system covering pregnancy checkups (pemeriksaan kehamilan), childbirth (persalinan), family planning (keluarga berencana / KB), and immunization (imunisasi) records, scoped across villages (desa) and practice places (tempat praktik bidan). ESM throughout (`"type": "module"`).

## Commands

- `npm run dev` — start the API with nodemon (reads `PORT` from `.env`, default 9090)
- `npm run seed:sample` — seed sample data via `seed-sample-data.js`
- `docker-compose up -d` — start the Postgres container only (app itself runs via `Dockerfile`/`npm run dev`, not compose)
- `npx prisma migrate dev --name <desc>` — create/apply a migration after editing `prisma/schema.prisma`
- `npx prisma generate` — regenerate the Prisma client (needed after pulling schema changes)
- `npx prisma studio` — inspect the DB visually

There is no configured test runner (`npm test` is a stub) and no lint script — verify changes by running the server and hitting the relevant endpoint.

## Architecture

Layered per resource, all under `src/`: `routes/` → `middlewares/` → `controllers/` → `services/` → Prisma (`lib/prisma.js`, a singleton `PrismaClient` using the `pg` adapter). `server.js` mounts every router under `/api`. Routes never talk to Prisma directly except for a couple of controllers reading `practice_place` inline for convenience (e.g. auto-injecting `req.body.practice_id` for `bidan_praktik` before calling the service).

Controllers are thin: parse `req`, call one service function, shape the `{ success, message, data }` response, map thrown errors to a status code (`error.statusCode || (message includes "tidak ditemukan" ? 404 : 400/500)`). Services own business logic, Prisma calls, and throw plain `Error` objects with a `.statusCode` attached for anything but a generic 500. `src/utils/error-response.util.js` (`getErrorResponse`) exists to translate raw Prisma errors (P2002/P2003/P2025) and message-pattern heuristics into friendly Indonesian messages/status codes — check it before hand-rolling new error mapping.

Validation is Zod, wired through `src/middlewares/validate.middleware.js`'s `validate(schema)`, where schemas validate `{ body, query, params }` together (see `src/validations/*.validation.js`). Only the four "pelayanan" (health-service) modules currently have Zod schemas; older modules (pasien, user, auth, village, practicePlace) validate ad hoc inside the service/controller.

### Auth & RBAC

JWT auth via `src/middlewares/auth.middleware.js`. `authenticateToken` verifies the token, rejects revoked tokens (checked against the `revoked_tokens` table by SHA-256 hash — see `src/utils/auth-token.util.js`), and attaches `req.user` (`user_id, full_name, email, role, status_user, position_user`) and `req.auth` (`token, tokenHash, decoded`). Logout works by upserting a `revoked_token` row keyed on the token's hash with its JWT `exp` as `expires_at` (`src/services/auth.service.js`), not a blocklist you push to elsewhere.

Two independent axes of access control, both stored on `user`:
- `role`: `ADMIN` | `USER` — ADMIN is superuser for user/master-data management.
- `position_user`: `bidan_praktik` | `bidan_desa` | `bidan_koordinator` — governs the 4 pelayanan modules only.

Rules (see `RBA_DOCUMENTATION.md` for the full matrix): `bidan_praktik` creates/updates/deletes only their own practice's data (status starts `PENDING`; update/delete only while `PENDING`/`REJECTED`); `bidan_desa` verifies (`APPROVE`/`REJECT`) data within their assigned village and otherwise sees `APPROVED`+`REJECTED` history; `bidan_koordinator` is read-only across villages, `APPROVED` only. `authorizePelayananMutation` / `authorizePelayananVerification` (bottom of `auth.middleware.js`) are the canonical guards for these — reuse them rather than re-deriving from `authorizePosition`.

The actual scoping logic (which `where` clause a role/position is allowed to see, and per-record forbidden checks) lives in `src/services/pelayanan-access.service.js` — `getPelayananUserScope`, `applyPelayananRoleScope`, `applyPelayananStatusFilter`, `ensurePelayananDetailAccess`, `ensurePelayananPracticeMutationAccess`, `ensurePelayananVerificationAccess`. Every pelayanan service (`pemeriksaan-kehamilan`, `persalinan`, `keluarga-berencana`, `imunisasi`) and `report.service.js` builds on these rather than reimplementing village/practice scoping — extend this file when adding a new pelayanan-like module instead of writing new scoping logic per module.

List-endpoint query params (`month`/`bulan`, `year`/`tahun`, `village_id`, `practice_id`, `pasien_id`, date range, `search`, `status_verifikasi`, pagination) are normalized once via `normalizePelayananListFilters` in `src/utils/pelayanan-filter.util.js` — use it for any new pelayanan-module list endpoint rather than reading `req.query` fields ad hoc.

### Domain model (`prisma/schema.prisma`)

`user` belongs to a `village` and/or a `practice_place`; `practice_place` belongs to a `village`. The four pelayanan tables (`pemeriksaan_kehamilan`, `persalinan`, `keluarga_berencana`, `imunisasi`) all share the same shape: FK to `practice_id` + `pasien_id`, a `status_verifikasi` enum (`PENDING`/`APPROVED`/`REJECTED`), `alasan_penolakan`, `tanggal_verifikasi`, `diverifikasi_oleh`, and full audit trail (`created_by`/`updated_by` + matching relations on `user`). `pemeriksaan_kehamilan` and `persalinan` each have an optional 1:1 sub-record (`ceklab_report`; `keadaan_ibu_persalinan` + `keadaan_bayi_persalinan`) — when adding fields to those, check whether they belong on the parent or the sub-record. `health_data` is a legacy/generic table kept for backward compatibility (`server.js` marks its route as "Legacy — keep for now"); prefer the specific pelayanan tables for new work.

### Reporting

`src/services/report.service.js` generates Excel (`exceljs`) and PDF (`pdfkit-table`) exports, always filtered to `status_verifikasi: "APPROVED"`. Access to reports is itself scoped by role (ADMIN/`bidan_koordinator` see everything, `bidan_desa` is forced to their own village) via `resolveReportFiltersForUser`, which also reuses `getPelayananUserScope`.

## Conventions

- All Prisma model/column names and most user-facing strings (error messages, validation messages) are in Indonesian — keep new user-facing text consistent with the existing tone (e.g. "tidak ditemukan", "tidak memiliki akses", "wajib diisi").
- IDs are UUIDs (`@default(uuid())`), not autoincrement ints.
- `bcryptjs` for password hashing, `jsonwebtoken` for auth, `zod` for validation — don't introduce alternative libraries for these.
- Root-level one-off scripts (`assign-bidan-desa.js`, `check-user-practice.js`, `list-villages.js`, `update-password*.js`, `test-*.js`, etc.) are manual maintenance/debug utilities run directly with `node`, not part of the app or an automated test suite.
