import { Howl } from "howler";

let hoverSound: Howl | null = null;
let ambienceSound: Howl | null = null;
let ambienceEnabled = false;
let lastHoverAt = 0;

function clampSample(value: number) {
  return Math.max(-1, Math.min(1, value));
}

function createToneUrl(
  durationSeconds: number,
  sample: (time: number) => number,
  sampleRate = 22050,
) {
  const frameCount = Math.floor(durationSeconds * sampleRate);
  const pcm = new Int16Array(frameCount);

  for (let index = 0; index < frameCount; index += 1) {
    const time = index / sampleRate;
    pcm[index] = clampSample(sample(time)) * 32767;
  }

  const byteLength = 44 + pcm.length * 2;
  const buffer = new ArrayBuffer(byteLength);
  const view = new DataView(buffer);

  const writeString = (offset: number, value: string) => {
    for (let index = 0; index < value.length; index += 1) {
      view.setUint8(offset + index, value.charCodeAt(index));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + pcm.length * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, pcm.length * 2, true);

  pcm.forEach((value, index) => {
    view.setInt16(44 + index * 2, value, true);
  });

  return URL.createObjectURL(new Blob([buffer], { type: "audio/wav" }));
}

function getHoverSound() {
  if (hoverSound) {
    return hoverSound;
  }

  hoverSound = new Howl({
    src: [
      createToneUrl(0.09, (time) => {
        const envelope = Math.exp(-time * 28);
        return (
          Math.sin(2 * Math.PI * 880 * time) * envelope * 0.18 +
          Math.sin(2 * Math.PI * 1320 * time) * envelope * 0.08
        );
      }),
    ],
    format: ["wav"],
    volume: 0.5,
  });

  return hoverSound;
}

function getAmbienceSound() {
  if (ambienceSound) {
    return ambienceSound;
  }

  ambienceSound = new Howl({
    src: ["/sounds/peergynt/peergynt.m4a"],
    autoplay: false,
    format: ["m4a"],
    html5: true,
    loop: true,
    volume: 0.28,
  });

  return ambienceSound;
}

export function enableAmbientAudio() {
  if (typeof window === "undefined" || ambienceEnabled) {
    return;
  }

  ambienceEnabled = true;

  const start = () => {
    const ambience = getAmbienceSound();

    if (!ambience.playing()) {
      ambience.play();
    }

    window.removeEventListener("pointerdown", start);
    window.removeEventListener("keydown", start);
  };

  window.addEventListener("pointerdown", start, { once: true });
  window.addEventListener("keydown", start, { once: true });
}

export function playHoverSound() {
  if (typeof window === "undefined") {
    return;
  }

  const now = performance.now();

  if (now - lastHoverAt < 70) {
    return;
  }

  lastHoverAt = now;
  getHoverSound().play();
}
