import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Auto-generated PWA service-worker bundles — not our source code.
    "public/**",
  ]),

  {
    rules: {
      // setState inside useEffect is the correct Next.js pattern for reading
      // browser-only APIs (e.g. localStorage) that are unavailable during SSR.
      // Lazy useState initializers cannot be used here because they run on the server.
      "react-hooks/set-state-in-effect": "off",

      // JavaScript function declarations are hoisted; using them before their
      // textual position is valid and intentional in these components.
      "react-hooks/immutability": "off",
    },
  },
]);

export default eslintConfig;
