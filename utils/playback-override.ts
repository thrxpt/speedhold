const MIN_HOLD_MS = 100;

interface PlaybackOverrideDeps {
  resolveVideo: () => HTMLVideoElement | null;
  getSpeed: () => number;
  onVideo: (video: HTMLVideoElement | null) => void;
  requestFrame?: (cb: FrameRequestCallback) => number;
  cancelFrame?: (id: number) => void;
}

interface ActiveGesture {
  phase: "active";
  initialVideo: HTMLVideoElement;
  wasPaused: boolean;
  boostedVideo: HTMLVideoElement | null;
  frameId: number;
}

type Gesture = { phase: "pending"; readyAt: number; frameId: number } | ActiveGesture;

export function createPlaybackOverride(deps: PlaybackOverrideDeps) {
  const requestFrame = deps.requestFrame ?? requestAnimationFrame;
  const cancelFrame = deps.cancelFrame ?? cancelAnimationFrame;

  let gesture: Gesture | undefined;

  const applyRate = (active: ActiveGesture, video: HTMLVideoElement | null) => {
    const previous = active.boostedVideo;
    if (previous && previous !== video && previous.playbackRate !== 1) {
      previous.playbackRate = 1;
    }

    if (video) {
      const speed = deps.getSpeed();
      if (video.playbackRate !== speed) video.playbackRate = speed;
    }
    active.boostedVideo = video;
    deps.onVideo(video);
  };

  const enforce = (now: number) => {
    if (!gesture) return;

    if (gesture.phase === "active" || now >= gesture.readyAt) {
      const video = deps.resolveVideo();
      if (gesture.phase === "pending" && video) {
        gesture = {
          phase: "active",
          initialVideo: video,
          wasPaused: video.paused,
          boostedVideo: null,
          frameId: gesture.frameId,
        };
        if (gesture.wasPaused) void video.play().catch(() => {});
      }

      if (gesture.phase === "active") applyRate(gesture, video);
    }

    gesture.frameId = requestFrame(enforce);
  };

  const start = () => {
    if (gesture || !deps.resolveVideo()) return false;

    gesture = {
      phase: "pending",
      readyAt: performance.now() + MIN_HOLD_MS,
      frameId: requestFrame(enforce),
    };
    return true;
  };

  const stop = () => {
    if (!gesture) return;

    const stopped = gesture;
    gesture = undefined;
    cancelFrame(stopped.frameId);
    if (stopped.phase === "pending") return;

    applyRate(stopped, null);
    if (stopped.wasPaused) stopped.initialVideo.pause();
  };

  return { start, stop };
}
