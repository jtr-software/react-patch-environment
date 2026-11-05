import { Suspense } from "react";
import { createRoot } from "react-dom/client";
import { PreviewBoundary, PreviewFailure } from "./PreviewBoundary";
import "./host.css";

const element = document.getElementById("root");
if (!element) throw new Error("index.html must contain #root.");
const root = createRoot(element);
const loading = <p className="crodox-host-loading" role="status">Loading component...</p>;

root.render(loading);

async function startPreview() {
  const { setupPreview } = await import("../preview/setup");
  await setupPreview();

  // Import after setup so module-level requests can use installed mocks.
  await import("../preview/styles.css");
  const [{ default: Preview }, { PreviewProviders }] = await Promise.all([
    import("../preview/entry"),
    import("../preview/Providers"),
  ]);

  root.render(
    <PreviewBoundary>
      <Suspense fallback={loading}>
        <PreviewProviders>
          <Preview />
        </PreviewProviders>
      </Suspense>
    </PreviewBoundary>,
  );
}

startPreview().catch((error: unknown) => root.render(<PreviewFailure error={error} />));
