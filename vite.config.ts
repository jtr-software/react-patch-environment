import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, mergeConfig } from "vite";
import extensions from "./preview/vite.extensions.ts";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig(({ mode }) => {
  const publicEnv = loadEnv(mode, root, ["REACT_APP_", "NEXT_PUBLIC_"]);

  return mergeConfig(
    {
      plugins: [react()],
      envPrefix: ["VITE_", "REACT_APP_", "NEXT_PUBLIC_"],
      define: {
        // CRA's asset prefix; Vite already handles process.env.NODE_ENV.
        "process.env.PUBLIC_URL": JSON.stringify(""),
        ...Object.fromEntries(
          Object.entries(publicEnv).map(([name, value]) => [
            `process.env.${name}`,
            JSON.stringify(value),
          ]),
        ),
      },
      resolve: {
        tsconfigPaths: true,
        dedupe: ["react", "react-dom"],
      },
      server: { host: "127.0.0.1", port: 5174, strictPort: true },
      preview: { host: "127.0.0.1", port: 4174, strictPort: true },
    },
    extensions,
  );
});
