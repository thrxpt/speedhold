<script lang="ts" setup>
import { FastForward } from "@lucide/vue";

defineProps<{
  speed: number;
  position: { x: number; y: number } | null;
}>();

const wrapper = useTemplateRef<HTMLDivElement>("wrapper");
const popover = typeof HTMLElement.prototype.showPopover === "function" ? "manual" : undefined;

const showPopover = () => {
  const element = wrapper.value;
  if (!popover || !element) return;

  // Fullscreen may have entered the top layer above the open indicator.
  element.hidePopover();
  element.showPopover();
};

watchPostEffect(showPopover);
onMounted(() => document.addEventListener("fullscreenchange", showPopover));
onUnmounted(() => document.removeEventListener("fullscreenchange", showPopover));
</script>

<template>
  <div
    v-if="position"
    ref="wrapper"
    class="wrapper"
    :popover="popover"
    :style="{ left: `${position.x}px`, top: `${position.y}px` }"
    aria-hidden="true"
  >
    <div class="box">
      <div class="speed">{{ speed.toFixed(1) }}<span>×</span></div>
      <FastForward :size="16" fill="var(--text)" strokeWidth="0" />
    </div>
  </div>
</template>

<style>
:host {
  /* WXT resets the shadow host with `all: initial !important`. */
  position: fixed !important;
  inset: 0 auto auto 0 !important;
  width: 0 !important;
  height: 0 !important;
  z-index: 2147483647 !important;
  pointer-events: none !important;
}
</style>

<style scoped>
.wrapper {
  position: fixed;
  inset: auto;
  margin: 0;
  border: 0;
  padding: 0;
  background: transparent;
  overflow: visible;
  pointer-events: none;
  transform: translateX(-50%);
}

.wrapper::backdrop {
  pointer-events: none;
}

@media (prefers-reduced-motion: no-preference) {
  .wrapper {
    animation: appear 0.15s ease-out;
  }
}

@keyframes appear {
  from {
    opacity: 0;
    transform: translateX(-50%) scale(0.98);
  }
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
