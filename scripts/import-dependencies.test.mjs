import assert from "node:assert/strict";
import test from "node:test";
import { planDependencyImport } from "./import-dependencies.mjs";

const host = {
  scripts: { dev: "vite", build: "vite build" },
  dependencies: { react: "19.3.1", "react-dom": "19.3.1" },
  devDependencies: { vite: "8.3.5", "@types/react": "19.3.0", "@types/react-dom": "19.3.0" },
};

test("imports runtime packages and peers without taking over scripts or toolchain", () => {
  const source = {
    scripts: { postinstall: "original-project-command", dev: "next dev" },
    dependencies: { clsx: "2.1.1" },
    peerDependencies: { "some-peer": "^2.0.0" },
    devDependencies: { vite: "7.0.0" },
  };
  const { manifest } = planDependencyImport(host, source);
  assert.equal(manifest.dependencies.clsx, "2.1.1");
  assert.equal(manifest.dependencies["some-peer"], "^2.0.0");
  assert.deepEqual(manifest.scripts, host.scripts);
  assert.equal(manifest.devDependencies.vite, "8.3.5");
  assert.equal(host.dependencies.clsx, undefined);
});

test("aligns both React packages and their types when selecting just one", () => {
  const source = {
    dependencies: { react: "18.3.1", "react-dom": "18.3.1", unused: "1.0.0" },
    devDependencies: { "@types/react": "^18.3.0", "@types/react-dom": "^18.3.0" },
  };
  const { manifest, changes } = planDependencyImport(host, source, ["react"]);
  assert.equal(manifest.dependencies["react-dom"], "18.3.1");
  assert.equal(manifest.devDependencies["@types/react"], "^18.3.0");
  assert.equal(manifest.dependencies.unused, undefined);
  assert.equal(changes.length, 4);
});

test("selected dev and optional packages retain their installation semantics", () => {
  const source = { devDependencies: { sass: "^1.0.0" }, optionalDependencies: { optional: "^2.0.0" } };
  const { manifest } = planDependencyImport(host, source, ["sass", "optional"]);
  assert.equal(manifest.devDependencies.sass, "^1.0.0");
  assert.equal(manifest.optionalDependencies.optional, "^2.0.0");
});

test("rejects missing packages, incomplete React pairs, and host toolchain replacement", () => {
  assert.throws(() => planDependencyImport(host, {}, ["missing"]), /does not declare/);
  assert.throws(() => planDependencyImport(host, { dependencies: { react: "18.3.1" } }), /react-dom/);
  assert.throws(() => planDependencyImport(host, { devDependencies: { vite: "7.0.0" } }, ["vite"]), /toolchain/);
});

test("rejects dependencies whose paths or workspace protocols would change meaning", () => {
  for (const spec of ["workspace:*", "file:../ui", "link:../ui", "catalog:", "patch:ui@1#fix", "../ui", "C:\\ui"]) {
    assert.throws(() => planDependencyImport(host, { dependencies: { ui: spec } }), /local\/workspace/);
  }
});

test("moves declarations between sections without keeping conflicting versions", () => {
  const { manifest } = planDependencyImport(
    { devDependencies: { clsx: "1.0.0" } },
    { dependencies: { clsx: "2.1.1" } },
  );
  assert.equal(manifest.dependencies.clsx, "2.1.1");
  assert.equal(manifest.devDependencies.clsx, undefined);
});

test("reimporting identical declarations makes no changes", () => {
  const { changes } = planDependencyImport(host, host, ["react"]);
  assert.deepEqual(changes, []);
});
