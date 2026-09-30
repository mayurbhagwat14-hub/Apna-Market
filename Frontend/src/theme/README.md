# ZEVYGO Design System

Single source of truth for brand identity and visual tokens.

## Files

| File | Role |
|------|------|
| `brand.js` | `APP_NAME`, tagline, description |
| `tokens.js` | Colors, gradients, type, spacing, radius, elevation, booking-status map |
| `colors.js` | Legacy panel themes (`userTheme` / `vendorTheme`) derived from tokens |
| `index.js` | Public barrel exports |

## Brand

```js
import { APP_NAME } from '../theme';
// APP_NAME === 'ZEVYGO'
```

Do **not** hardcode `"ZEVYGO"` in components — import `APP_NAME`.

## Colors

Prefer Tailwind token classes from `index.css` `@theme`:

```jsx
<button className="bg-primary-500 text-white" />
<span className="text-error-600" />
```

Or JS tokens when inline styles are required:

```js
import { colors, gradients } from '../theme';
style={{ background: gradients.brand, color: colors.primary[500] }}
```

## Shared UI

```js
import { Button } from '../components/ui';
```

## Legacy

`themeColors`, `userTheme`, `vendorTheme`, and `brand.teal` still work — teal/orange aliases now resolve to the blue/cyan palette.
