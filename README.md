# i-Age demo site

Static Next.js (App Router, TypeScript) site. No backend: the whole journey runs in the browser and saves to localStorage.

## Run
```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static site written to ./out (deploy anywhere: Vercel, Netlify, S3)
```

## What's in it
Landing, sign up / log in, dashboard with three phase tiles (locked tiles dimmed), Phase 1/2/3 forms with validation,
built-in reaction-time test and timers, mock checkout (test mode), DNA consent + report upload, result screens
(age gap, confidence range, six sub-scores, drivers, management plan, phase breakdown, trend), PDF report (print to PDF),
profile with consent record, data export and delete. "Demo tools" (bottom-right) fills forms with sample values.

## Swapping in the real model
All scoring goes through `src/lib/scoring/index.ts`. Contract: `POST /assess` with `AssessRequest`, returns `AssessResponse`
(see `src/lib/scoring/types.ts`). To switch, set in `.env.local`:
```
NEXT_PUBLIC_SCORING_PROVIDER=http
NEXT_PUBLIC_SCORING_URL=https://your-model-service
```
The mock engine (`mock.ts`) is illustrative only, and every result is labelled "Demo model".

## Where things live
- `src/lib/params.ts` : every parameter (unit, hard/soft limits, reference rule, weights). Forms, validation, scoring and demo autofill all read this.
- `src/lib/plan.ts` : rules-based management plan and threshold flags.
- `src/lib/config.ts` : prices (placeholders, INR) and tagline.
- `src/lib/store.tsx` : client state. Replace with API calls when a backend exists.
- `public/samples/sample-dna-report.csv` : sample DNA report for the upload flow.

## Not built yet (planned)
Real auth, payments (Razorpay), backend and database, lab-report OCR, operator/camp mode, admin, B2B partner portal.
