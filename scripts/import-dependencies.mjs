import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const sections = ["dependencies", "optionalDependencies", "peerDependencies", "devDependencies"];
const hostToolchain = new Set(["vite", "typescript", "@vitejs/plugin-react", "@types/node"]);
const localSpec = /^(?:workspace|file|link|portal|catalog|patch):|^(?:\.{1,2}[/\\]|[/\\]|[A-Za-z]:[/\\])/;

function lookup(manifest, name) {
  for (const section of sections) {
    const version = manifest[section]?.[name];
    if (version !== undefined) return { section, version };
  }
  throw new Error(`The source manifest does not declare ${name}.`);
}

export function planDependencyImport(host, source, requestedNames = []) {
  const names = new Set(
    requestedNames.length
      ? requestedNames
      : [...Object.keys(source.dependencies ?? {}), ...Object.keys(source.peerDependencies ?? {})],
  );

  // Keep the runtime pair together, including matching types when supplied.
  if (names.has("react") || names.has("react-dom")) {
    names.add("react");
    names.add("react-dom");
    for (const name of ["@types/react", "@types/react-dom"]) {
      if (sections.some((section) => source[section]?.[name])) names.add(name);
    }
  }

  const manifest = structuredClone(host);
  const changes = [];
  for (const name of names) {
    if (hostToolchain.has(name)) {
      throw new Error(`${name} belongs to the preview toolchain. Review and change it manually.`);
    }
    const { section: sourceSection, version } = lookup(source, name);
    if (typeof version !== "string" || !version.trim() || localSpec.test(version)) {
      throw new Error(`${name} uses a local/workspace dependency (${version}). Copy that package or use a published version first.`);
    }
    const section = sourceSection === "peerDependencies" ? "dependencies" : sourceSection;
    const previous = sections.flatMap((key) =>
      manifest[key]?.[name] === undefined ? [] : [`${key}: ${manifest[key][name]}`],
    );
    if (manifest[section]?.[name] === version && previous.length === 1) continue;

    for (const key of sections) {
      if (manifest[key]) delete manifest[key][name];
    }
    manifest[section] ??= {};
    manifest[section][name] = version;
    changes.push({ name, previous, section, version });
  }

  return { manifest, changes };
}

async function main() {
  const args = process.argv.slice(2);
  const shouldWrite = args.includes("--write");
  const positional = args.filter((argument) => argument !== "--write");
  if (!positional[0] || positional.some((argument) => argument.startsWith("--"))) {
    throw new Error("Usage: npm run deps:import -- <source/package.json> [package ...] [--write]");
  }

  const hostUrl = new URL("../package.json", import.meta.url);
  const [host, source] = await Promise.all([
    readFile(hostUrl, "utf8").then(JSON.parse),
    readFile(resolve(positional[0]), "utf8").then(JSON.parse),
  ]);
  const { manifest, changes } = planDependencyImport(host, source, positional.slice(1));
  console.log(JSON.stringify({ mode: shouldWrite ? "write" : "dry-run", changes }, null, 2));

  if (shouldWrite && changes.length) {
    await writeFile(hostUrl, `${JSON.stringify(manifest, null, 2)}\n`);
    console.log("Updated package.json. Run npm install to update dependencies and package-lock.json.");
  } else if (!shouldWrite) {
    console.log("No files changed. Add --write to apply this plan, then run npm install.");
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
