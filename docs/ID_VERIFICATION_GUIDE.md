# ID Verification Guide

This document explains how ID verification works in this project, including both the code structure and the runtime process.

## 1. Purpose

The system verifies that the signup form data matches the uploaded ID card by checking:

- Full name entered in the form
- NIC number entered in the form
- Text extracted from the uploaded ID image (OCR)

Registration only proceeds when both name and NIC match.

## 2. Files Involved

- Frontend signup page: `app/auth/register/page.tsx`
- Verify API endpoint: `app/api/auth/verify-id/route.ts`
- Register API endpoint: `app/api/auth/register/route.ts`
- Core verification logic: `lib/id-card-verification.ts`
- Auth context/register call: `lib/context/AuthContext.tsx`
- API client payload: `lib/api-client.ts`

## 3. End-to-End Process

### Step A: User enters signup details

On the signup form, the user enters:

- Name
- Email
- Password
- Phone
- Optional NIC
- Optional ID image

If NIC or image is provided, both are required together.

### Step B: OCR runs on the uploaded ID image (client-side)

In `app/auth/register/page.tsx`:

1. The selected image is encoded to data URL.
2. The image is optimized (`compressImageForOcr`) for OCR quality/speed.
3. Tesseract OCR runs in the browser.
4. Extracted text is stored in state (`identityCardOcrText`).
$ pnpm dev

> my-project@0.1.0 dev C:\Users\Kavithima Siluni\Downloads\b_33LZhvzyw17-1773776642898-main (2)\b_33LZhvzyw17-1773776642898-main\b_33LZhvzyw17-1773776642898-main
> next dev --webpack

⚠ Port 3000 is in use by process 2260, using available port 3001 instead.
▲ Next.js 16.1.6 (webpack)
- Local:         http://localhost:3001
- Network:       http://192.168.218.1:3001
- Environments: .env.local

✓ Starting...
⨯ Unable to acquire lock at C:\Users\Kavithima Siluni\Downloads\b_33LZhvzyw17-1773776642898-main (2)\b_33LZhvzyw17-1773776642898-main\b_33LZhvzyw17-1773776642898-main\.next\dev\lock, is another instance of next dev running?
  Suggestion: If you intended to restart next dev, terminate the other process, and then try again.

 ELIFECYCLE  Command failed with exit code 1.
This avoids server-side OCR worker issues and keeps OCR responsive.

### Step C: Real-time verification badge request

Still in `app/auth/register/page.tsx`:

- A debounced request is sent to `POST /api/auth/verify-id` with:
  - `name`
  - `nicNumber`
  - `identityCardImage`
  - `ocrText`

The UI badge updates to states such as:

- checking
- matched
- name-mismatch
- nic-mismatch
- both-mismatch
- scan-failed

### Step D: Backend verification (`/api/auth/verify-id`)

In `app/api/auth/verify-id/route.ts`:

1. Validates required fields.
2. Ensures OCR text is present.
3. Calls `verifyIdCardDetails` from `lib/id-card-verification.ts`.
4. Returns a structured verification result.

### Step E: Final registration guard (`/api/auth/register`)

In `app/api/auth/register/route.ts`:

- If NIC+image are provided, registration re-runs verification with the same OCR text.
- If verification fails, registration is blocked.
- If verification passes, user is created.

This prevents bypassing verification by direct API calls.

## 4. Core Logic (`lib/id-card-verification.ts`)

Main function:

- `verifyIdCardDetails(input)`

Input:

- `name`
- `nicNumber`
- `ocrText` (plus optional image field for request contract compatibility)

Output:

- `{ valid: true, ocrText }` on success
- `{ valid: false, reason, ocrText? }` on failure

### 4.1 NIC validation

`isValidSLNicFormat` supports Sri Lankan NIC patterns:

- New format: 12 digits (`YYYYDDDSSSS`)
- Old format: 9 digits + `V/X` (`YYDDDSSSSV`)

Day-of-year rules handled:

- Male: `001-366`
- Female: `501-866` (day value +500)

### 4.2 OCR normalization

`normalizeOcrDigits` corrects common OCR misreads:

- `O -> 0`
- `I/L -> 1`
- `S -> 5`
- `B -> 8`

### 4.3 NIC extraction from OCR text

`extractSlNicCandidatesFromOcr` does:

1. Label-based extraction near terms like `NIC`, `No`, `ID`
2. Fallback token scanning across OCR text
3. Validation of each candidate with Sri Lankan NIC rules

Final NIC match is exact equality against normalized user NIC.

### 4.4 Name matching

Name comparison uses:

- Direct normalized substring checks
- Token-based matching for multi-part names
- Candidate name lines extracted from OCR (especially lines after `Name:`)

This helps with OCR noise while still enforcing meaningful name consistency.

## 5. Failure Paths and Messages

Examples returned by verification:

- `Name doesn't match the uploaded ID card.`
- `NIC doesn't match the uploaded ID card.`
- `Name and NIC number don't match the uploaded ID card.`
- `Could not read text from the identity card image. Please upload a clearer image.`

## 6. Why this design is generic (not personalized)

The logic does not hardcode any person-specific value.
It always works from:

- Form name
- Form NIC
- OCR text from current uploaded image

So each signup is evaluated independently using that request data.

## 7. Practical Notes

- OCR quality depends on image clarity, lighting, and crop.
- Full ID card in frame gives best extraction.
- Slightly tolerant name matching is used to handle OCR imperfections.
- NIC matching is strict after normalization/validation.

## 8. Suggested Future Improvements

- Add optional OCR debug panel in UI (show extracted NIC/name candidates).
- Add unit tests for NIC parser and name matcher.
- Add confidence scoring for OCR extraction quality.
- Add multi-language OCR support for Sinhala/Tamil-heavy cards while keeping English fallback.
