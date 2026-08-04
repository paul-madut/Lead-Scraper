# Lead-Scraper Design System

One indigo brand accent on a cool-neutral surface, applied identically on the
marketing page and the dashboard. Everything is driven by the shadcn tokens in
`src/app/globals.css` - never hardcode hex colors.

## Tokens (use the Tailwind classes, not raw values)

| Purpose | Class | Notes |
|---|---|---|
| Page background | `bg-background` | app canvas (near-white, faint cool tint) |
| Card / panel | `bg-card` + `border` | white, `rounded-xl`, `shadow-sm` |
| Primary text | `text-foreground` | |
| Secondary text | `text-muted-foreground` | |
| Brand accent | `bg-primary` / `text-primary` | indigo; primary CTAs, links, active nav |
| On-accent text | `text-primary-foreground` | |
| Subtle surface | `bg-muted` / `bg-muted/40` | table headers, info strips |
| Accent tint | `bg-accent text-accent-foreground` | hover states, active sidebar item |
| Success | `text-success` / `bg-success/15` | "exhausted", positive states |
| Danger | `text-destructive` / `bg-destructive/10` | errors |
| Borders | `border-border` (just `border`) | hairline |
| Radius | `rounded-lg` (controls), `rounded-xl` (cards) | |

## Primitives (reuse - do not reinvent)

- `@/components/ui/button` - `Button` variants: `default` (brand), `outline`, `secondary`, `ghost`, `link`, `destructive`; sizes `sm|default|lg|icon`.
- `@/components/ui/card` - `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`.
- `@/components/ui/badge` - `Badge` variants: `default|secondary|outline|success|muted`.
- `@/components/ui/input` - `Input`.
- `@/components/LeadResultsTable` - the canonical leads table (photo, name, rating, contact, links). Use it everywhere leads are displayed.
- Icons: `lucide-react` (dashboard) - 16px default, `text-muted-foreground` unless semantic.

## Data + helpers (post-restoration contracts)

- `Business` (`@/lib/types`): fields are nullable - `phone|website|maps_url|business_status|total_reviews|photo_reference|rating` can be `null`. Guard with `x != null` (so a `0` rating still renders).
- Business photos: `businessPhotoUrl(photo_reference, width)` from `@/lib/photo` -> a same-origin `/api/photo?...` URL. There is **no** client Google Maps key anymore; never embed one.
- CSV export: `downloadLeadsCsv(businesses, filename)` from `@/lib/export`. Do not hand-roll CSV.
- Token balance (client): `getTokenBalance()` from `@/services/tokenService`.
- Pricing: `PRICING_CONFIG`, `estimateSearchCost`, `chargeForResults` from `@/lib/pricing`. There is no `MIN_CHARGE` and no client-side token minting.
- History reads: `getUserSearchHistory(uid)`, `getMostRecentUserSearch(uid)`, `getSearchResultsById(id)` from `@/services/query`.
- Auth: `useAuth()` from `@/components/AuthProvider` -> `{ user: User|null, loading, signInWithGoogle, signOut, authError }`. Always branch on `loading` before treating `!user` as signed-out (render a skeleton while `loading`).

## Rules

- Typescript only. No `.jsx`. No `any` - import real types.
- Guard optional Firebase user fields: `user?.providerData?.[0]?.photoURL ?? user?.photoURL ?? null`.
- Page metadata via `export const metadata`, never `next/head`.
- Every `<form>` needs a real submit handler or should not be a form.
- Loading, empty, and error states are required for anything async.
