import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  ...nextVitals,
  {
    ignores: [".next/**", ".next/dev/**", "node_modules/**", "ORIGINAL/**", "next-env.d.ts"],
  },
];

export default eslintConfig;
