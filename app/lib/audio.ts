import { Howl } from "howler";
import dvorakTrackUrl from "../assets/Sounds/Dvorak - Symphony No. 9 (From the New World) Mvmt 4/Dvorak - Symphony No. 9 (From the New World) Mvmt 4 (128kbit_AAC).m4a";
import peerGyntTrackUrl from "../assets/Sounds/peergynt/peergynt.m4a";
import tchaikovskyTrackUrl from "../assets/Sounds/Tchaikovsky; The Tempest, Op. 18, TH 44/Tchaikovsky; The Tempest, Op. 18, TH 44 (128kbit_AAC).m4a";
import holstTrackUrl from "../assets/Sounds/The Planets, Op. 32; I. Mars, the Bringer of War (128kbit_AAC).m4a";

let hoverSound: Howl | null = null;
let ambienceEnabled = false;
let lastHoverAt = 0;
let currentAmbienceIndex = 0;

type PlaylistHowl = Howl & {
  on: (event: "end", callback: () => void) => void;
  stop: () => void;
};

const ambienceTrackUrls = [
  peerGyntTrackUrl,
  holstTrackUrl,
  dvorakTrackUrl,
  tchaikovskyTrackUrl,
] as const;

let ambiencePlaylist: PlaylistHowl[] | null = null;

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

function playAmbientTrack(index: number) {
  const playlist = getAmbiencePlaylist();
  const nextIndex = ((index % playlist.length) + playlist.length) % playlist.length;
  const track = playlist[nextIndex];

  if (!track) {
    return;
  }

  currentAmbienceIndex = nextIndex;

  if (track.playing()) {
    return;
  }

  playlist.forEach((playlistTrack, playlistIndex) => {
    if (playlistIndex !== nextIndex && playlistTrack.playing()) {
      playlistTrack.stop();
    }
  });

  track.play();
}

function getAmbiencePlaylist() {
  if (ambiencePlaylist) {
    return ambiencePlaylist;
  }

  ambiencePlaylist = ambienceTrackUrls.map((src, index) => {
    const track = new Howl({
      src: [src],
      autoplay: false,
      format: ["m4a"],
      html5: true,
      loop: false,
      volume: 0.28,
    }) as PlaylistHowl;

    track.on("end", () => {
      playAmbientTrack(index + 1);
    });

    return track;
  });

  return ambiencePlaylist;
}

export function enableAmbientAudio() {
  if (typeof window === "undefined" || ambienceEnabled) {
    return;
  }

  ambienceEnabled = true;

  const start = () => {
    const playlist = getAmbiencePlaylist();
    const activeTrack = playlist.find((track) => track.playing());

    if (!activeTrack) {
      playAmbientTrack(currentAmbienceIndex);
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
