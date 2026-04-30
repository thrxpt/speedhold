import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-vue", "@wxt-dev/auto-icons"],
  manifest: {
    name: "SpeedHold: Hold to Speed Up",
    permissions: ["storage"],
    browser_specific_settings: {
      gecko: {
        data_collection_permissions: {
          required: ["none"],
        },
      },
    },
  },
  hooks: {
    "build:manifestGenerated": (wxt, manifest) => {
      if (wxt.config.mode === "development") {
        manifest.name += " (DEV)";
      }
    },
  },
});
