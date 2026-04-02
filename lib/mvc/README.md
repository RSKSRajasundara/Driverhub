# MVC Folder Map

This project uses Next.js App Router, so routes must remain under `app/`.

A practical MVC-style mapping for this codebase is:

- Models: `lib/mvc/models/`
- Views: `app/**/*.tsx`, `components/**/*.tsx`
- Controllers: `app/api/**/route.ts`

Compatibility note:

- Legacy imports from `lib/models/*` still work through re-export wrappers.
- This keeps functionality unchanged while making structure easier to understand.
