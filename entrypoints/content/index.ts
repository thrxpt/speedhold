import "@/assets/style.css";
import "@fontsource-variable/outfit/wght.css";
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

    let isSpeedingUp = false;
    let indicator: HTMLElement | undefined;

    let currentSpeed = await playbackSpeedStorage.getValue();
    let currentKeybind = await keybindStorage.getValue();

    // Watch for changes
    playbackSpeedStorage.watch((newSpeed) => {
      currentSpeed = newSpeed ?? DEFAULT_CONFIG.playbackSpeed;
    });

    keybindStorage.watch((newKeybind) => {
      currentKeybind = newKeybind ?? DEFAULT_CONFIG.keybind;
    });

    const videoElement = (await waitForElement("video")) as HTMLVideoElement;
    const rect = videoElement.getBoundingClientRect();

    const ui = await createShadowRootUi(ctx, {
      name: "speed-hold",
      position: "overlay",
      anchor: videoElement,
      append: "before",
      onMount: (container) => {
        container.style.width = `${rect.width}px`;
        container.style.height = `${rect.height}px`;
        container.style.position = "relative";
        container.style.pointerEvents = "none";
        container.style.zIndex = "99999";
        container.style.margin = "0";
        const app = createApp(App);
        app.mount(container);
        indicator = container;
        return app;
      },
      onRemove: (app) => {
        app?.unmount();
      },
    });
    ui.mount();

    const resizeObserver = new ResizeObserver(() => {
      if (indicator) {
        const newRect = videoElement.getBoundingClientRect();
        indicator.style.width = `${newRect.width}px`;
        indicator.style.height = `${newRect.height}px`;
      }
    });
    resizeObserver.observe(videoElement);

    const enforceSpeed = () => {
      if (!isSpeedingUp) return;
      const player = document.querySelector("video");
      if (player) {
        player.playbackRate = currentSpeed;
      }
      requestAnimationFrame(enforceSpeed);
    };

    const startSpeedUp = () => {
      if (isSpeedingUp) return;
      isSpeedingUp = true;
      const wrapper = indicator?.querySelector(".wrapper");
      wrapper?.classList.add("visible");
      enforceSpeed();
    };

    const stopSpeedUp = () => {
      isSpeedingUp = false;
      const wrapper = indicator?.querySelector(".wrapper");
      wrapper?.classList.remove("visible");
      const player = document.querySelector("video");
      if (player) {
        player.playbackRate = 1;
      }
    };

    ctx.addEventListener(window, "keydown", (e) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
      )
        return;

      if (e.code === currentKeybind && !e.repeat) {
        startSpeedUp();
      }
    });

    ctx.addEventListener(window, "keyup", (e) => {
      if (e.code === currentKeybind) {
        stopSpeedUp();
      }
    });

    ctx.addEventListener(window, "blur", () => {
      stopSpeedUp();
    });

    ctx.onInvalidated(() => {
      isSpeedingUp = false;
      ui.remove();
    });
  },
});
