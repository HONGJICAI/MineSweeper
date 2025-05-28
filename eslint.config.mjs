import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import react from "eslint-plugin-react";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    plugins: { react },
    rules: {
      "react/jsx-no-bind": [
        "warn",
        {
          ignoreRefs: true,
          allowArrowFunctions: false,
          allowFunctions: false,
          allowBind: false,
        },
      ],
    },
  },
];

export default eslintConfig;
