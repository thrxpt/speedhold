import { createApp } from "vue";
import App from "./App.vue";

export default defineContentScript({
  matches: ["<all_urls>"],
  cssInjectionMode: "ui",
  async main(ctx) {
    const waitForElement = (selector: string): Promise<Element> => {
      return new Promise((resolve) => {
        if (document.querySelector(selector)) {
          return resolve(document.querySelector(selector)!);
        }

        const observer = new MutationObserver(() => {
          if (document.querySelector(selector)) {
            observer.disconnect();
            resolve(document.querySelector(selector)!);
          }
        });

        observer.observe(document.documentElement, {
          childList: true,
          subtree: true,
        });
      });
    };

    const videoElement = await waitForElement("video");

    const ui = await createShadowRootUi(ctx, {
      name: "speed-hold",
      position: "inline",
      anchor: videoElement,
      append: (anchor, ui) => anchor.parentElement?.insertBefore(ui, anchor.nextSibling),
      onMount: (container) => {
        const app = createApp(App);
        app.mount(container);
        return app;
      },
      onRemove: (app) => {
        app?.unmount();
      },
    });
    ui.mount();
  },
});
