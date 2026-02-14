
## Fix: Map Flickering and Infinite Error Loop on /delivery

### Root Cause Analysis

Two bugs interact to create an infinite flicker loop:

1. **New array reference every render**: In `DeliveryPage.tsx` line 75, `businessLocation` is declared as a plain array literal `[-0.9533, 52.4673]`. Every time the component re-renders, this creates a NEW array reference. Since `businessLocation` is in the `useEffect` dependency array of `DeliveryMap.tsx` (line 201), the map gets destroyed and recreated on every render.

2. **ErrorBoundary auto-recovery at 100ms**: The `ErrorBoundary` component (line 38-40) catches `removeChild` errors and automatically resets after 100ms. When the map cleanup triggers a DOM error, the boundary catches it, recovers, re-mounts the map, which fails again -- creating an infinite loop of error/recovery/error.

### Changes

#### 1. `src/pages/DeliveryPage.tsx`
- Move `businessLocation` outside the component (as a module-level constant) so it's always the same reference
- This prevents unnecessary re-renders of the map

```tsx
// Move OUTSIDE the component (before const DeliveryPage = ...)
const BUSINESS_LOCATION: [number, number] = [-0.9533, 52.4673];
```

Then use `BUSINESS_LOCATION` instead of `businessLocation` throughout the component.

#### 2. `src/components/DeliveryMap.tsx`
- Remove `businessLocation` and `deliveryRadius` from the `useEffect` dependency array -- these values don't change at runtime
- Remove `cleanupMap` from the dependency array as well
- Use an empty dependency array `[]` so the map initializes only once on mount
- Store `businessLocation` and `deliveryRadius` in refs for use inside the effect

#### 3. `src/components/ErrorBoundary.tsx`
- Remove the automatic 100ms recovery for `removeChild` errors, or increase the delay significantly (e.g., 5 seconds) and add a max retry counter to prevent infinite loops
- This stops the error-recovery-error cycle

### Technical Details

**File: `src/pages/DeliveryPage.tsx`**
- Extract `const BUSINESS_LOCATION: [number, number] = [-0.9533, 52.4673]` to module scope (before the component function)
- Replace all `businessLocation` references with `BUSINESS_LOCATION`

**File: `src/components/DeliveryMap.tsx`**
- Add refs for businessLocation and deliveryRadius:
  ```tsx
  const businessLocationRef = useRef(businessLocation);
  const deliveryRadiusRef = useRef(deliveryRadius);
  ```
- Change the main useEffect dependency array from `[businessLocation, deliveryRadius, cleanupMap]` to `[]`
- Use ref values inside the effect instead of the props directly

**File: `src/components/ErrorBoundary.tsx`**
- Add a retry counter (`retryCount` in state) 
- Only auto-recover up to 3 times maximum
- Increase the recovery delay from 100ms to 2000ms
- After max retries, show the fallback UI permanently

### Expected Result
- Map initializes once and stays stable
- No more flickering or page flashing
- If a rare DOM error occurs, it recovers gracefully with a limit instead of looping infinitely
