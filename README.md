# Crodox React patch environment

A standalone Vite host for browser-renderable React function components, with TypeScript/TSX and JavaScript/JSX support. Crodox patches `preview/entry.tsx` and supplies the component's dependency files. The HTML and React bootstrap stay reusable.

## Run the example

Use Node 20.19.x or Node 22.12+ (Node 24 works) and npm.

```powershell
cd react-patch-environment
npm ci
npm run dev
```

Open http://127.0.0.1:5174. The included card demonstrates typed props, state, a relative helper import, an `@/` import, CSS modules, and a public SVG. Vite reloads patched files during development.

```powershell
npm run typecheck
npm test
npm run build
npm run preview
```

The build is written to `dist/`; the built preview uses port 4174. `build` transpiles and bundles; `typecheck` checks types separately so unrelated extraction typing issues do not prevent a visual preview.

## Repository shape

```text
index.html                    Fixed HTML entry, loads src/main.tsx
src/
  main.tsx                    Fixed React root, setup, lazy imports
  PreviewBoundary.tsx         Import/setup/render error display
  host.css                    Styles scoped to host status/error UI
preview/
  entry.tsx                   PATCH HERE: import + props + selected component
  Providers.tsx               Router, theme, store, query/auth context
  setup.ts                    Async fixtures or API mock initialization
  styles.css                  Original global CSS and font imports
  vite.extensions.ts          Additional plugins, aliases, API proxy
extracted/
  src/                        Extracted source, preserving original paths
  public/                     Public assets, served at /
scripts/
  import-dependencies.mjs     Preview/merge source dependency declarations
tsconfig.json                 Compiler options and source import aliases
vite.config.ts               Shared preview tooling
package.json                  Host tooling + selected source dependencies
package-lock.json             Lockfile for this combined environment
docs/PATCH-CONTRACT.md        File contract for Crodox-generated patches
```

## Preview a selected component

Suppose the original project contains `src/components/ProductCard.tsx`.

1. Put the component at `extracted/src/components/ProductCard.tsx`. Include its imported hooks, helpers, child components, types, CSS, images, JSON, generated modules, and their transitive imports. Preserve paths relative to the original project root. If extracting only declarations, also retain the imports and declarations they depend on, and export the selected component.
2. Install its external packages using the source project's version declarations. Start with the dependency importer below.
3. Replace `preview/entry.tsx`:

   ```tsx
   import { ProductCard } from "@/components/ProductCard";

   export default function Preview() {
     return (
       <ProductCard
         product={{ id: "demo", name: "Preview product", price: 29 }}
         onAddToCart={(product) => console.log("Add", product)}
       />
     );
   }
   ```

   Use a default import if the selected module has a default export. The props must match the actual component; TypeScript cannot invent fixture data or meaningful callbacks.

4. Add required providers in `preview/Providers.tsx`. Reuse copied provider code or create fixtures, for example:

   ```tsx
   import type { PropsWithChildren } from "react";
   import { AppProviders } from "@/providers/AppProviders";

   export function PreviewProviders({ children }: PropsWithChildren) {
     return <AppProviders>{children}</AppProviders>;
   }
   ```

5. Import global styles in `preview/styles.css`, and copy root-served files such as `/logo.svg` to `extracted/public/logo.svg`. Keep imported assets beside the extracted source that references them. Initialize API mocks in `setupPreview()`; the host awaits it before importing the component and providers.
6. Adjust aliases in `tsconfig.json`. The defaults map `@/` and `~/` to `extracted/src/`. For a source alias such as `@ui/* -> packages/ui/src/*`, use `@ui/* -> ./extracted/packages/ui/src/*`. Keep the original monorepo layout inside `extracted/` when relative imports cross package boundaries.

With the dev server running, a new patch is just a set of file changes. No change to `index.html` is needed.

## What to take from package.json

Keep this environment's scripts and Vite toolchain. Merge the dependencies used by the extracted code, including peer dependencies and any build plugins it actually needs. Match the source's React and React DOM versions, plus React type versions. The host uses `createRoot`, so React 18+ is supported; React 17 or older needs a different mounting adapter.

The importer defaults to a **dry run**:

```powershell
# Import selected packages from a source manifest (recommended).
npm run deps:import -- ../some-project/package.json react clsx lucide-react

# Apply the reviewed dependency changes, then install.
npm run deps:import -- ../some-project/package.json react clsx lucide-react --write
npm install

# Without package names, plan all source dependencies and peers.
npm run deps:import -- ../some-project/package.json

# Build dependencies from devDependencies can be selected explicitly.
npm run deps:import -- ../some-project/package.json sass --write
npm install
```

Selecting either React package includes both and imports their type packages when the source declares them. A source that declares only React as a peer must be given a compatible React DOM declaration before importing that pair. Peer packages become installed dependencies. Explicitly selected dev/optional packages retain their sections. Source scripts are never imported. The importer rejects local/workspace protocols and replacement of the host toolchain; these need deliberate configuration.

For exact reproducibility, match versions resolved in the original lockfile, especially React, peer dependencies, and styling plugins. Importing semver ranges from `package.json` alone can resolve newer versions. Keep the source lockfile as a reference; `npm install` generates this environment's own lockfile because its dependency graph differs. Yarn/Pnpm overrides, catalogs, patched packages, workspace packages, package-manager settings, and code generation need to be recreated when the selection uses them. The importer does not resolve those features or determine which imports are actually used.

## Styles and build integrations

CSS and CSS modules work directly. Sass, Less, SVG-as-component imports, MDX, custom Babel transforms, and similar features need their matching tools/plugins. Do not copy an entire source build configuration without reviewing its paths and assumptions. Put portable project-specific Vite settings into `preview/vite.extensions.ts`.

For a Tailwind 4 selection, install versions matching the source:

```powershell
npm install -D tailwindcss@4 @tailwindcss/vite@4
```

```ts
// preview/vite.extensions.ts
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({ plugins: [tailwindcss()] });
```

```css
/* preview/styles.css: use the source theme/custom CSS as needed. */
@import "tailwindcss";
@source "../extracted";
```

Tailwind 3 needs its PostCSS pipeline and original theme/configuration instead. A Tailwind 4 installation cannot reproduce arbitrary Tailwind 3 configuration. Recreate fonts and theme tokens as well as utility generation.

## Runtime integrations

- **Routing:** wrap the selection with the source router's memory router and fixture route/parameters. Route-dependent components need the expected URL and route hierarchy.
- **Context and stores:** mount the required providers with representative initial state. The host does not assume a specific router, state manager, or design system.
- **Network requests:** install request mocks in `preview/setup.ts`, or configure `server.proxy` in `preview/vite.extensions.ts` for an available API. This host does not supply a backend.
- **Environment:** copy `.env.example` to `.env.local` and supply public values. `import.meta.env.VITE_*` is supported. Explicitly supplied `REACT_APP_*` and `NEXT_PUBLIC_*` variables are also available through direct `process.env.NAME` references. `process.env.PUBLIC_URL` is an empty asset prefix. Only put browser-public configuration in these variables; private server env files do not belong here.
- **Portals/browser globals:** add required DOM containers in `index.html`, and fixtures for globals in `setup.ts`. Event-handler errors and later rejected promises are reported by browser devtools; the error boundary handles rendering errors.

## Compatibility boundary

This covers conventional browser React components across Vite, CRA, and many client-side components from other frameworks **when their dependency graph and runtime setup are supplied**. A function signature does not guarantee that a component can run independently.

Next.js Server Components, server actions, framework routing/image behavior, server-only modules, native modules, and React Native require framework-specific adapters or the original framework runtime. Browser globals do not implement a server runtime. Legacy React versions and applications with custom compiler behavior also need adapters. There is no single `index.html` that can reproduce every application's runtime.

For Crodox, use the shared host plus small project-specific adapters. See [the patch contract](docs/PATCH-CONTRACT.md) for the concrete output your extraction/patch pipeline should produce.

## Reference documentation

- [Vite: TypeScript, JSX, and styles](https://vite.dev/guide/features)
- [Vite: tsconfig import path resolution](https://vite.dev/config/shared-options#resolve-tsconfigpaths)
- [Vite: public assets](https://vite.dev/guide/assets#the-public-directory)
- [Vite: browser environment variables](https://vite.dev/guide/env-and-mode)
- [React: mounting components with createRoot](https://react.dev/reference/react-dom/client/createRoot)
- [React: Server Components and their runtime](https://react.dev/reference/rsc/server-components)
- [Tailwind: Vite integration](https://tailwindcss.com/docs/installation/using-vite)
- [Tailwind: source detection](https://tailwindcss.com/docs/detecting-classes-in-source-files)
