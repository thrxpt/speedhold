<script lang="ts" setup>
import { Minus, Plus, RotateCcw } from "@lucide/vue";

const speed = ref(DEFAULT_CONFIG.playbackSpeed);
const keybind = ref(DEFAULT_CONFIG.keybind);
const showIndicator = ref(DEFAULT_CONFIG.showIndicator);
const isRecording = ref(false);

onMounted(async () => {
  speed.value = await playbackSpeedStorage.getValue();
  keybind.value = await keybindStorage.getValue();
  showIndicator.value = await showIndicatorStorage.getValue();
});

watch(speed, (newVal) => {
  playbackSpeedStorage.setValue(newVal);
});

watch(keybind, (newVal) => {
  keybindStorage.setValue(newVal);
});

watch(showIndicator, (newVal) => {
  showIndicatorStorage.setValue(newVal);
});

const startRecording = () => {
  isRecording.value = true;
  window.addEventListener("keydown", handleKeydown, { once: true });
};

const handleKeydown = (e: KeyboardEvent) => {
  e.preventDefault();
  if (e.code !== "Escape") {
    keybind.value = e.code;
  }
  isRecording.value = false;
};

const formatKey = (code: string) => {
  return code.replace("Key", "").replace("Digit", "");
};

const adjustSpeed = (delta: number) => {
  const newSpeed = Math.round((speed.value + delta) * 10) / 10;
  if (newSpeed >= 1 && newSpeed <= 5) {
    speed.value = newSpeed;
  }
};

const resetToDefaults = () => {
  speed.value = DEFAULT_CONFIG.playbackSpeed;
  keybind.value = DEFAULT_CONFIG.keybind;
  showIndicator.value = DEFAULT_CONFIG.showIndicator;
};

const setPreset = (val: number) => {
  speed.value = val;
};
</script>

<template>
  <div class="app-wrapper">
    <header class="header">
      <h1>
        <img :src="browser.runtime.getURL('/icons/32.png')" alt="logo" />
        SpeedHold
      </h1>
      <button @click="resetToDefaults" class="reset-btn" title="Reset">
        <RotateCcw :size="14" />
      </button>
    </header>

    <main class="content">
      <div class="speed-section">
        <div class="speed-display">
          <span class="speed-number">{{ speed.toFixed(1) }}</span>
          <span class="speed-unit">×</span>
        </div>

        <div class="slider-wrapper">
          <button
            @click="adjustSpeed(-0.1)"
            class="adjust-btn"
            :disabled="speed <= 1"
            title="Decrease"
          >
            <Minus :size="14" />
          </button>
          <div class="slider-container">
            <input type="range" v-model.number="speed" min="1" max="5" step="0.1" class="slider" />
          </div>
          <button
            @click="adjustSpeed(0.1)"
            class="adjust-btn"
            :disabled="speed >= 5"
            title="Increase"
          >
            <Plus :size="14" />
          </button>
        </div>

        <div class="presets">
          <button
            v-for="val in [1.5, 2.0, 3.0]"
            :key="val"
            @click="setPreset(val)"
            :class="['preset-btn', { active: speed === val }]"
          >
            {{ val }}x
          </button>
        </div>
      </div>

      <div class="divider"></div>

      <div class="settings-grid">
        <div class="setting-row">
          <span class="label">Keybind</span>
          <button @click="startRecording" :class="['keybind', { recording: isRecording }]">
            {{ isRecording ? "..." : formatKey(keybind) }}
          </button>
        </div>

        <div class="setting-row">
          <span class="label">Overlay</span>
          <label class="switch">
            <input type="checkbox" v-model="showIndicator" />
            <span class="switch-slider"></span>
          </label>
        </div>
      </div>
    </main>
  </div>
</template>

<style>
body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: "Outfit Variable", sans-serif;
  width: 280px;
}

.app-wrapper {
  padding: 24px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

h1 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: var(--text-dim);
  display: flex;
  align-items: center;
  gap: 4px;
}

.reset-btn {
  background: none;
  border: none;
  color: var(--text-dim);
  cursor: pointer;
  padding: 4px;
}

.reset-btn:hover {
  color: var(--text);
}

.speed-section {
  text-align: center;
  margin-bottom: 24px;
}

.speed-display {
  margin-bottom: 16px;
}

.speed-number {
  font-size: 48px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.speed-unit {
  font-size: 40px;
  font-weight: 800;
  color: var(--text-dim);
  margin-left: 2px;
}

.slider-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.slider-container {
  flex: 1;
  display: flex;
  align-items: center;
}

.adjust-btn {
  background: none;
  border: none;
  color: var(--text-dim);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.adjust-btn:hover:not(:disabled) {
  color: var(--text);
}

.adjust-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.slider {
  width: 100%;
  height: 2px;
  background: var(--border);
  outline: none;
  border-radius: 2px;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px;
  height: 12px;
  background: var(--accent);
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.1s;
}

.slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.presets {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.preset-btn {
  background: none;
  border: 1px solid var(--border);
  color: var(--text-dim);
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-family: "Outfit Variable", sans-serif;
}

.preset-btn:hover {
  border-color: var(--text-dim);
  color: var(--text);
}

.preset-btn.active {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--bg);
}

.divider {
  height: 1px;
  background: var(--border);
  margin: 24px 0;
}

.settings-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.label {
  font-size: 12px;
  color: var(--text-dim);
  font-weight: 500;
}

.keybind {
  background: var(--hover);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  min-width: 40px;
  text-align: center;
}

.keybind.recording {
  border-color: var(--accent);
  color: var(--accent);
  animation: blink 1s infinite;
}

@keyframes blink {
  50% {
    opacity: 0.5;
  }
}

.switch {
  position: relative;
  display: inline-block;
  width: 32px;
  height: 18px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.switch-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--border);
  transition: 0.2s;
  border-radius: 18px;
}

.switch-slider:before {
  position: absolute;
  content: "";
  height: 12px;
  width: 12px;
  left: 3px;
  bottom: 3px;
  background-color: var(--bg);
  transition: 0.2s;
  border-radius: 50%;
}

input:checked + .switch-slider {
  background-color: var(--accent);
}

input:checked + .switch-slider:before {
  transform: translateX(14px);
}
</style>
