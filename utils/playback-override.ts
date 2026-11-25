const MIN_HOLD_MS = 100;
const BOOST_MIN_BUFFER_SECONDS = 1;
const BOOST_RESUME_BUFFER_SECONDS = 2;

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
  playback: { video: HTMLVideoElement; rate: number } | null;
  frameId: number;
}

type Gesture = { phase: "pending"; readyAt: number; frameId: number } | ActiveGesture;

function hasBufferedPlayback(video: HTMLVideoElement, requiredSeconds: number) {
  if (video.seeking || video.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) return false;

  const { buffered, currentTime, duration } = video;
  for (let index = 0; index < buffered.length; index++) {
    if (buffered.start(index) > currentTime) break;

    const end = buffered.end(index);
    if (end <= currentTime) continue;

    return (Number.isFinite(duration) && end >= duration) || end - currentTime >= requiredSeconds;
  }
  return false;
}

export function createPlaybackOverride(deps: PlaybackOverrideDeps) {
  const requestFrame = deps.requestFrame ?? requestAnimationFrame;
  const cancelFrame = deps.cancelFrame ?? cancelAnimationFrame;

  let gesture: Gesture | undefined;

  const applyRate = (active: ActiveGesture, video: HTMLVideoElement | null) => {
    const previous = active.playback;
    if (previous && previous.video !== video && previous.video.playbackRate !== 1) {
      previous.video.playbackRate = 1;
    }

    if (!video) {
      active.playback = null;
      deps.onVideo(null);
      return;
    }

    const speed = deps.getSpeed();
    const continuingBoost = previous?.video === video && previous.rate === speed;
    const bufferSeconds = continuingBoost ? BOOST_MIN_BUFFER_SECONDS : BOOST_RESUME_BUFFER_SECONDS;
    const canApplySpeed = speed <= 1 || hasBufferedPlayback(video, speed * bufferSeconds);
    const rate = canApplySpeed ? speed : 1;
    if (video.playbackRate !== rate) video.playbackRate = rate;

    if (previous?.video === video) previous.rate = rate;
    else active.playback = { video, rate };

    deps.onVideo(canApplySpeed ? video : null);
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
          playback: null,
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
