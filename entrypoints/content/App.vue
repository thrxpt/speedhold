<script lang="ts" setup>
import "@fontsource-variable/outfit/wght.css";
import { FastForward } from "@lucide/vue";
</script>

<template>
  <div class="wrapper">
    <div class="box">
      <div class="speed">2.0<span>x</span></div>
      <FastForward :size="16" fill="#ffffff" strokeWidth="0" />
    </div>
  </div>
</template>

<style scoped>
.wrapper {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  top: 3rem;
  pointer-events: none;
}

.box {
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px 18px;
  border-radius: 9999px;
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
