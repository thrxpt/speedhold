interface PlaybackOverrideDeps {
  resolveVideo: () => HTMLVideoElement | null;
  getSpeed: () => number;
  onVideo: (video: HTMLVideoElement | null) => void;
  requestFrame?: (cb: FrameRequestCallback) => number;
  cancelFrame?: (id: number) => void;
}

interface ActiveGesture {
  initialVideo: HTMLVideoElement;
  wasPaused: boolean;
  boostedVideo: HTMLVideoElement | null;
  frameId: number;
}

export function createPlaybackOverride(deps: PlaybackOverrideDeps) {
  const requestFrame = deps.requestFrame ?? requestAnimationFrame;
  const cancelFrame = deps.cancelFrame ?? cancelAnimationFrame;

  let gesture: ActiveGesture | undefined;

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

  const enforce = () => {
    if (!gesture) return;
    applyRate(gesture, deps.resolveVideo());
    gesture.frameId = requestFrame(enforce);
  };

  const start = () => {
    if (gesture) return false;

    const video = deps.resolveVideo();
    if (!video) return false;

    gesture = {
      initialVideo: video,
      wasPaused: video.paused,
      boostedVideo: null,
      frameId: requestFrame(enforce),
    };
    if (gesture.wasPaused) void video.play().catch(() => {});
    return true;
  };

  const stop = () => {
    if (!gesture) return;

    const stopped = gesture;
    gesture = undefined;
    cancelFrame(stopped.frameId);
    applyRate(stopped, null);
    if (stopped.wasPaused) stopped.initialVideo.pause();
  };

  return { start, stop };
}
