import { DEFAULT_CONFIG } from "./config";

export const playbackSpeedStorage = storage.defineItem<number>("local:playbackSpeed", {
  defaultValue: DEFAULT_CONFIG.playbackSpeed,
});

export const keybindStorage = storage.defineItem<string>("local:keybind", {
  defaultValue: DEFAULT_CONFIG.keybind,
});

export const showIndicatorStorage = storage.defineItem<boolean>("local:showIndicator", {
  defaultValue: DEFAULT_CONFIG.showIndicator,
});
