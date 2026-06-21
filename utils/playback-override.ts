export interface PlaybackOverrideDeps {
  /** Resolve the current <video> on demand. Re-resolved per enforce tick so the
   *  override survives SPA node swaps. */
  resolveVideo: () => HTMLVideoElement | null;
  /** Live read of the target playback rate. */
  getSpeed: () => number;
  requestFrame?: (cb: FrameRequestCallback) => number;
  cancelFrame?: (id: number) => void;
}

export interface PlaybackOverride {
  start: () => void;
  stop: () => void;
  dispose: () => void;
  readonly active: boolean;
  /** Notify on active-state changes. Returns an unsubscribe. */
  subscribe: (cb: (active: boolean) => void) => () => void;
}

interface PauseSnapshot {
  el: HTMLVideoElement;
  wasPaused: boolean;
}

export function createPlaybackOverride(deps: PlaybackOverrideDeps): PlaybackOverride {
  const requestFrame = deps.requestFrame ?? requestAnimationFrame;
  const cancelFrame = deps.cancelFrame ?? cancelAnimationFrame;

  let active = false;
  let frameId: number | undefined;
  let snapshot: PauseSnapshot | undefined;
  const subscribers = new Set<(active: boolean) => void>();

  const setActive = (next: boolean) => {
    if (active === next) return;
    active = next;
    for (const cb of subscribers) cb(active);
  };

  // Enforce Loop: re-resolve the current video every frame and re-assert rate.
  const enforce = () => {
    if (!active) return;
    const video = deps.resolveVideo();
    if (video) video.playbackRate = deps.getSpeed();
    frameId = requestFrame(enforce);
  };

  const start = () => {
    if (active) return;
    setActive(true);

    const video = deps.resolveVideo();
    if (video) {
      snapshot = { el: video, wasPaused: video.paused };
      if (video.paused) video.play();
    } else {
      snapshot = undefined;
    }

    frameId = requestFrame(enforce);
  };

  const stop = () => {
    if (!active) return;
    setActive(false);

    if (frameId !== undefined) {
      cancelFrame(frameId);
      frameId = undefined;
    }

    // rate-restore: whatever is current goes back to 1×.
    const current = deps.resolveVideo();
    if (current) current.playbackRate = 1;

    // pause-restore: re-pause the element we played, not whatever is current.
    if (snapshot?.wasPaused) snapshot.el.pause();
    snapshot = undefined;
  };

  const dispose = () => {
    stop();
    subscribers.clear();
  };

  return {
    start,
    stop,
    dispose,
    get active() {
      return active;
    },
    subscribe(cb) {
      subscribers.add(cb);
      return () => subscribers.delete(cb);
    },
  };
}
