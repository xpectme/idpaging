import { build } from "esbuild";

// build for node
build({
  entryPoints: ["mod.ts"],
  outfile: "dest/idbpaging.js",
  bundle: true,
  sourcemap: true,
  minify: true,
  format: "esm",
  platform: "node",
  external: ["npm:idbx"],
}).catch(() => process.exit(1));
