import "@/assets/style.css";
import "@fontsource-variable/outfit/wght.css";
import { createApp, h, reactive, shallowRef } from "vue";

import App from "./App.vue";

export default defineContentScript({
  matches: ["<all_urls>"],
  cssInjectionMode: "ui",
  async main(ctx) {
    const [playbackSpeed, keybind, showIndicator] = await Promise.all([
      playbackSpeedStorage.getValue(),
      keybindStorage.getValue(),
      showIndicatorStorage.getValue(),
    ]);
    if (ctx.isInvalid) return;

    const settings = reactive({ playbackSpeed, keybind, showIndicator });
    ctx.onInvalidated(
      playbackSpeedStorage.watch((speed) => {
        settings.playbackSpeed = speed;
      }),
    );
    ctx.onInvalidated(
      keybindStorage.watch((code) => {
        settings.keybind = code;
      }),
    );
    ctx.onInvalidated(
      showIndicatorStorage.watch((visible) => {
        settings.showIndicator = visible;
      }),
    );

    const position = shallowRef<{ x: number; y: number } | null>(null);
    let indicatorMount: Promise<void> | undefined;
    const mountIndicator = async () => {
      const ui = await createShadowRootUi(ctx, {
        name: "speedhold-ui",
        position: "inline",
        anchor: document.documentElement,
        onMount(container) {
          const app = createApp({
            render: () => h(App, { speed: settings.playbackSpeed, position: position.value }),
          });
          app.mount(container);
          return app;
        },
        onRemove(app) {
          app?.unmount();
        },
      });
      if (!ctx.isInvalid) ui.mount();
    };

    const override = createPlaybackOverride({
      resolveVideo: () => document.querySelector("video"),
      getSpeed: () => settings.playbackSpeed,
      onVideo(video) {
        if (!video || !settings.showIndicator) {
          position.value = null;
          return;
        }

        const bounds = video.getBoundingClientRect();
        if (!bounds.width || !bounds.height) {
          position.value = null;
          return;
        }

        const x = bounds.left + bounds.width / 2;
        const y = bounds.top + bounds.height * 0.2;
        const previous = position.value;
        if (previous?.x !== x || previous.y !== y) position.value = { x, y };

        indicatorMount ??= mountIndicator().catch((error: unknown) => {
          console.warn("SpeedHold could not mount its indicator.", error);
        });
      },
    });

    let heldKey: string | undefined;
    const consumeShortcut = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    const stopGesture = () => {
      heldKey = undefined;
      override.stop();
    };

    ctx.addEventListener(
      window,
      "keydown",
      (event) => {
        if (event.code !== heldKey) {
          if (
            event.code !== settings.keybind ||
            event.repeat ||
            heldKey !== undefined ||
            event.isComposing
          )
            return;

          const hasModifier = event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;
          if (hasModifier && !event.getModifierState(event.key)) return;

          const target = event.composedPath()[0];
          if (
            target instanceof HTMLElement &&
            (target.closest("input, textarea, select") || target.isContentEditable)
          )
            return;

          if (!override.start()) return;
          heldKey = event.code;
        }

        consumeShortcut(event);
      },
      { capture: true },
    );
    ctx.addEventListener(
      window,
      "keyup",
      (event) => {
        if (event.code !== heldKey) return;
        consumeShortcut(event);
        stopGesture();
      },
      { capture: true },
    );
    ctx.addEventListener(window, "blur", stopGesture);
    ctx.onInvalidated(stopGesture);
  },
});
