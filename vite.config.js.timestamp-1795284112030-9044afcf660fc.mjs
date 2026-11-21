// vite.config.js
import { defineConfig } from "file:///home/user/nuestra-casita/node_modules/vite/dist/node/index.js";
import react from "file:///home/user/nuestra-casita/node_modules/@vitejs/plugin-react/dist/index.js";
import { execSync } from "node:child_process";
var build = (() => {
  let h = "sin-git";
  try {
    h = execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
  }
  return `${h} \xB7 ${(/* @__PURE__ */ new Date()).toISOString().slice(0, 16).replace("T", " ")}`;
})();
var vite_config_default = defineConfig({
  define: { __BUILD__: JSON.stringify(build) },
  plugins: [react()],
  build: {
    assetsInlineLimit: 1e6,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ["three"],
          r3f: ["@react-three/fiber", "@react-three/drei"]
        }
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS91c2VyL251ZXN0cmEtY2FzaXRhXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS91c2VyL251ZXN0cmEtY2FzaXRhL3ZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3VzZXIvbnVlc3RyYS1jYXNpdGEvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5cbmltcG9ydCB7IGV4ZWNTeW5jIH0gZnJvbSAnbm9kZTpjaGlsZF9wcm9jZXNzJztcbmNvbnN0IGJ1aWxkID0gKCgpID0+IHsgbGV0IGggPSAnc2luLWdpdCc7IHRyeSB7IGggPSBleGVjU3luYygnZ2l0IHJldi1wYXJzZSAtLXNob3J0IEhFQUQnLCB7IHN0ZGlvOiBbJ2lnbm9yZScsICdwaXBlJywgJ2lnbm9yZSddIH0pLnRvU3RyaW5nKCkudHJpbSgpOyB9IGNhdGNoIHsgLyogc2luIGdpdCAqLyB9IHJldHVybiBgJHtofSBcdTAwQjcgJHtuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkuc2xpY2UoMCwgMTYpLnJlcGxhY2UoJ1QnLCAnICcpfWA7IH0pKCk7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIGRlZmluZTogeyBfX0JVSUxEX186IEpTT04uc3RyaW5naWZ5KGJ1aWxkKSB9LFxuICBwbHVnaW5zOiBbcmVhY3QoKV0sXG4gIGJ1aWxkOiB7XG4gICAgYXNzZXRzSW5saW5lTGltaXQ6IDEwMDAwMDAsXG4gICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiAxNTAwLFxuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIG91dHB1dDoge1xuICAgICAgICBtYW51YWxDaHVua3M6IHtcbiAgICAgICAgICB0aHJlZTogWyd0aHJlZSddLFxuICAgICAgICAgIHIzZjogWydAcmVhY3QtdGhyZWUvZmliZXInLCAnQHJlYWN0LXRocmVlL2RyZWknXSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUE2UCxTQUFTLG9CQUFvQjtBQUMxUixPQUFPLFdBQVc7QUFFbEIsU0FBUyxnQkFBZ0I7QUFDekIsSUFBTSxTQUFTLE1BQU07QUFBRSxNQUFJLElBQUk7QUFBVyxNQUFJO0FBQUUsUUFBSSxTQUFTLDhCQUE4QixFQUFFLE9BQU8sQ0FBQyxVQUFVLFFBQVEsUUFBUSxFQUFFLENBQUMsRUFBRSxTQUFTLEVBQUUsS0FBSztBQUFBLEVBQUcsUUFBUTtBQUFBLEVBQWdCO0FBQUUsU0FBTyxHQUFHLENBQUMsVUFBTSxvQkFBSSxLQUFLLEdBQUUsWUFBWSxFQUFFLE1BQU0sR0FBRyxFQUFFLEVBQUUsUUFBUSxLQUFLLEdBQUcsQ0FBQztBQUFJLEdBQUc7QUFFaFEsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsUUFBUSxFQUFFLFdBQVcsS0FBSyxVQUFVLEtBQUssRUFBRTtBQUFBLEVBQzNDLFNBQVMsQ0FBQyxNQUFNLENBQUM7QUFBQSxFQUNqQixPQUFPO0FBQUEsSUFDTCxtQkFBbUI7QUFBQSxJQUNuQix1QkFBdUI7QUFBQSxJQUN2QixlQUFlO0FBQUEsTUFDYixRQUFRO0FBQUEsUUFDTixjQUFjO0FBQUEsVUFDWixPQUFPLENBQUMsT0FBTztBQUFBLFVBQ2YsS0FBSyxDQUFDLHNCQUFzQixtQkFBbUI7QUFBQSxRQUNqRDtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
