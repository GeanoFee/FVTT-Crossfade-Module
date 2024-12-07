// Crossfade Module for Foundry VTT
// Compatible with Foundry VTT Version 12

// Initialize the module
Hooks.once("init", () => {
  console.log("Crossfade Module | Initializing...");

  // Default settings
  game.settings.register("crossfade-module", "fadeDuration", {
    name: "Crossfade Duration",
    hint: "Set the duration of crossfade in milliseconds.",
    scope: "world",
    config: true,
    type: Number,
    default: 5000, // 5 seconds
    range: {
      min: 1000,
      max: 10000,
      step: 500,
    },
  });

  // Overwrite playlist sound handling
 libWrapper.register(
  "crossfade-module",
  "PlaylistSound.prototype.play",
  async function (wrapped, ...args) {
    try {
      console.log("Crossfade Module | Starting play method..."); // Debugging: Meldung, dass die Funktion startet
      const sound = this.sound;
      console.log("Crossfade Module | Sound Object:", sound); // Debugging: Gibt das Sound-Objekt aus
      if (!sound) return wrapped(...args);

      const audio = sound.audio;
      const fadeDuration = game.settings.get("crossfade-module", "fadeDuration") / 1000;
      console.log("Crossfade Module | Audio Object:", audio, "Fade Duration:", fadeDuration); // Debugging: Gibt die Audio-Infos aus

      if (!audio) return wrapped(...args);

      // Fade in the track
      audio.volume = 0;
      audio.play();
      fadeVolume(audio, 0, this.volume, fadeDuration);

      // Handle loop crossfade
      audio.addEventListener("ended", () => {
        fadeVolume(audio, this.volume, 0, fadeDuration, () => {
          audio.currentTime = 0;
          audio.play();
          fadeVolume(audio, 0, this.volume, fadeDuration);
        });
      });

      return Promise.resolve();
    } catch (err) {
      console.error("Crossfade Module | Error in play method:", err); // Debugging: Zeigt den Fehler in der Konsole an
      return wrapped(...args);
    }
  },
  "MIXED"
);

// Fade volume utility
function fadeVolume(audio, start, end, duration, onComplete) {
  const step = (end - start) / (duration * 10);
  let current = start;

  const interval = setInterval(() => {
    current += step;
    if ((step > 0 && current >= end) || (step < 0 && current <= end)) {
      clearInterval(interval);
      audio.volume = end;
      if (onComplete) onComplete();
    } else {
      audio.volume = current;
    }
  }, 100);
}
