import api from "./api";

// BCP-47 locales used by browser speech recognition.
export const RECOGNITION_LOCALES = {
  en: "en-IN",
  hi: "hi-IN",
  mr: "mr-IN",
  bn: "bn-IN",
  ta: "ta-IN",
  te: "te-IN",
  gu: "gu-IN",
  pa: "pa-IN",
};

export const getRecognition = () =>
  window.SpeechRecognition || window.webkitSpeechRecognition || null;

const base64ToBytes = (base64) => {
  const bytes = atob(base64);
  const buffer = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i += 1) {
    buffer[i] = bytes.charCodeAt(i);
  }
  return buffer;
};

// Speakers / Bluetooth devices need a moment to wake up, which clips the
// first word. Prepending a short silence to the WAV data fixes that.
const LEAD_SILENCE_MS = 350;

const padWavStart = (bytes, ms = LEAD_SILENCE_MS) => {
  try {
    const view = new DataView(bytes.buffer);
    const tag = (o) =>
      String.fromCharCode(
        view.getUint8(o),
        view.getUint8(o + 1),
        view.getUint8(o + 2),
        view.getUint8(o + 3)
      );
    if (tag(0) !== "RIFF" || tag(8) !== "WAVE") return bytes;

    let offset = 12;
    let channels = 1;
    let sampleRate = 24000;
    let bits = 16;
    let dataStart = -1;
    let dataSize = 0;

    while (offset + 8 <= bytes.length) {
      const id = tag(offset);
      const size = view.getUint32(offset + 4, true);
      if (id === "fmt ") {
        channels = view.getUint16(offset + 10, true);
        sampleRate = view.getUint32(offset + 12, true);
        bits = view.getUint16(offset + 22, true);
      } else if (id === "data") {
        dataStart = offset + 8;
        dataSize = Math.min(size, bytes.length - dataStart);
        break;
      }
      offset += 8 + size + (size % 2);
    }
    if (dataStart < 0 || bits !== 16) return bytes;

    const frame = channels * 2;
    const padBytes = Math.round((sampleRate * ms) / 1000) * frame;
    const out = new Uint8Array(bytes.length + padBytes);
    out.set(bytes.subarray(0, dataStart), 0); // header
    // silence (zeros) is already in place
    out.set(bytes.subarray(dataStart), dataStart + padBytes);

    const outView = new DataView(out.buffer);
    outView.setUint32(4, out.length - 8, true); // RIFF size
    outView.setUint32(dataStart - 4, dataSize + padBytes, true); // data size
    return out;
  } catch {
    return bytes;
  }
};

// Splits into a short first chunk (so speech starts sooner) followed by
// larger chunks. All chunks are requested in parallel.
export const splitForSpeech = (text) => {
  const clean = String(text || "").trim();
  if (!clean) return [];

  const sentences = clean.match(/[^.!?।\n]+[.!?।]*\s*/g) || [clean];
  const chunks = [];
  let current = "";
  let limit = 130; // first chunk: keep it short

  for (const sentence of sentences) {
    if (current && current.length + sentence.length > limit) {
      chunks.push(current.trim());
      current = "";
      limit = 450;
    }
    current += sentence;
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
};

const audioCache = new Map(); // "lang|text" -> Promise<Blob url data>

const fetchChunk = (text, language) => {
  const key = `${language}|${text}`;
  if (!audioCache.has(key)) {
    const promise = api
      .post("/api/ai/speech", { text, language })
      .then(({ data }) => {
        if (!data?.success || !data.audio) {
          throw new Error(data?.message || "No audio received");
        }
        return padWavStart(base64ToBytes(data.audio));
      })
      .catch((error) => {
        audioCache.delete(key);
        throw error;
      });
    audioCache.set(key, promise);
    if (audioCache.size > 40) {
      audioCache.delete(audioCache.keys().next().value);
    }
  }
  return audioCache.get(key);
};

// Speaks text using the Sarvam TTS endpoint.
// Resolves once the FIRST audio is ready to play (playback then starts),
// so callers can show a "preparing" state until that moment.
// Returns { stop(), finished: Promise }.
export const playSpeech = async (text, language) => {
  const chunks = splitForSpeech(text);
  if (!chunks.length) throw new Error("There is nothing to speak");

  let stopped = false;
  let currentAudio = null;

  // Kick off all requests now (parallel); play them in order.
  const pending = chunks.map((chunk) => {
    const p = fetchChunk(chunk, language);
    p.catch(() => null); // avoid unhandled rejection; handled when awaited
    return p;
  });

  const first = await pending[0]; // throws if the first chunk fails

  const playOne = (bytes) =>
    new Promise((resolve, reject) => {
      const url = URL.createObjectURL(new Blob([bytes], { type: "audio/wav" }));
      const audio = new Audio();
      currentAudio = audio;
      audio.preload = "auto";
      audio.src = url;

      const finish = (fn, value) => {
        URL.revokeObjectURL(url);
        fn(value);
      };
      audio.onended = () => finish(resolve);
      audio.onerror = () =>
        finish(reject, new Error("Audio could not be played"));
      audio.oncanplaythrough = () => {
        audio.oncanplaythrough = null;
        if (stopped) return finish(resolve);
        audio.play().catch((e) => finish(reject, e));
      };
      audio.load();
    });

  const finished = (async () => {
    await playOne(first);
    for (let i = 1; i < pending.length && !stopped; i += 1) {
      await playOne(await pending[i]);
    }
  })();

  return {
    finished,
    stop: () => {
      stopped = true;
      currentAudio?.pause();
    },
  };
};
