<script lang="ts" setup>
import { FastForward } from "@lucide/vue";

const currentSpeed = ref(DEFAULT_CONFIG.playbackSpeed);
const showIndicator = ref(DEFAULT_CONFIG.showIndicator);

onMounted(async () => {
  currentSpeed.value = (await playbackSpeedStorage.getValue()) ?? DEFAULT_CONFIG.playbackSpeed;
  showIndicator.value = (await showIndicatorStorage.getValue()) ?? DEFAULT_CONFIG.showIndicator;

  playbackSpeedStorage.watch((newSpeed) => {
    currentSpeed.value = newSpeed ?? DEFAULT_CONFIG.playbackSpeed;
  });

  showIndicatorStorage.watch((newVal) => {
    showIndicator.value = newVal ?? DEFAULT_CONFIG.showIndicator;
  });
});
</script>

<template>
  <div v-if="showIndicator" class="wrapper">
    <div class="box">
      <div class="speed">{{ currentSpeed.toFixed(1) }}<span>×</span></div>
      <FastForward :size="16" fill="var(--text)" strokeWidth="0" />
    </div>
  </div>
</template>

<style scoped>
.wrapper {
  position: absolute;
  left: 50%;
  top: 20%;
  opacity: 0;
  transform: translateX(-50%) scale(0.98);
  transition:
    opacity 0.2s ease-out,
    transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.wrapper.visible {
  opacity: 1;
  transform: translateX(-50%) scale(1);
}

.box {
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px 18px;
  border-radius: calc(infinity * 1px);
}

.speed {
  color: var(--text);
  font-size: 20px;
  font-weight: 800;
  font-family: "Outfit Variable", sans-serif;
  font-variant-numeric: tabular-nums;

  span {
    font-size: 18px;
    color: var(--text-dim);
    margin-left: 1px;
  }
}
</style>
