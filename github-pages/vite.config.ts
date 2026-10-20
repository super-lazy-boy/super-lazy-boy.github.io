import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/postcss";
import path from "node:path";
import { fileURLToPath } from "node:url";
const folder=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(folder,"..");
export default defineConfig({
  root:folder,publicDir:path.join(root,"public"),base:"./",
  plugins:[react()],css:{postcss:{plugins:[tailwind()]}},resolve:{alias:{"@":root}},
  build:{outDir:path.join(root,"docs"),emptyOutDir:true,sourcemap:false},
  server:{host:"127.0.0.1",port:4174},preview:{host:"127.0.0.1",port:4174}
});
