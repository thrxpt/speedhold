<script lang="ts" setup>
import { FastForward } from "@lucide/vue";
import { ref, onMounted } from "vue";

import { DEFAULT_CONFIG } from "@/utils/config";
import { playbackSpeedStorage } from "@/utils/storage";

import "@fontsource-variable/outfit/wght.css";

const currentSpeed = ref(DEFAULT_CONFIG.playbackSpeed);

onMounted(async () => {
  currentSpeed.value = (await playbackSpeedStorage.getValue()) ?? DEFAULT_CONFIG.playbackSpeed;
  playbackSpeedStorage.watch((newSpeed) => {
    currentSpeed.value = newSpeed ?? DEFAULT_CONFIG.playbackSpeed;
  });
});
</script>

<template>
  <div class="wrapper">
    <div class="box">
      <div class="speed">{{ currentSpeed.toFixed(1) }}<span>×</span></div>
      <FastForward :size="16" fill="#ffffff" strokeWidth="0" />
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
  color: #ffffff;
  font-size: 20px;
  font-weight: 800;
  font-family: "Outfit Variable", sans-serif;
  font-variant-numeric: tabular-nums;

  span {
    font-size: 18px;
    color: #a1a1a1;
    margin-left: 1px;
  }
}
</style>
