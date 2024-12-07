// Crossfade Audio Playlist Module - Main Script
// Adjusted for Foundry VTT Version 12

Hooks.once("init", () => {
  console.log("Crossfade Module | Initializing...");

  // Register the setting for crossfade duration
  game.settings.register("crossfade-module", "crossfadeDuration", {
    name: "Crossfade Duration (ms)",
    hint: "Set the duration of the crossfade effect in milliseconds.",
    scope: "world",
    config: true,
    type: Number,
    default: 2000,
  });

  // Hook into AudioHelper.prototype.play
  try {
    libWrapper.register(
      "crossfade-module",
      "AudioHelper.prototype.play",
      function (wrapped, ...args) {
        console.log("Crossfade Module | Overriding AudioHelper.prototype.play");

        const [src, options = {}] = args;

        // If no sound source is provided, fallback to default behavior
        if (!src) return wrapped(...args);

        // Retrieve crossfade duration from settings
        const crossfadeDuration = game.settings.get("crossfade-module", "crossfadeDuration");
        console.log(`Crossfade Module | Crossfade Duration: ${crossfadeDuration}ms`);

        // Handle fade-out of currently playing sound
        if (this.playing) {
          const currentAudio = this.playing;
          const fadeOutInterval = 50;
          const fadeOutSteps = crossfadeDuration / fadeOutInterval;
          const fadeOutVolume = currentAudio.volume / fadeOutSteps;

          let fadeOutStep = 0;
          const fadeOut = setInterval(() => {
            if (fadeOutStep >= fadeOutSteps) {
              clearInterval(fadeOut);
              currentAudio.pause();
              currentAudio.remove();
            } else {
              currentAudio.volume -= fadeOutVolume;
              fadeOutStep++;
            }
          }, fadeOutInterval);
        }

        // Play the new audio with fade-in effect
        const newAudio = wrapped(...args);
        const fadeInInterval = 50;
        const fadeInSteps = crossfadeDuration / fadeInInterval;
        const fadeInVolume = (options.volume || 1.0) / fadeInSteps;

        newAudio.volume = 0;
        let fadeInStep = 0;
        const fadeIn = setInterval(() => {
          if (fadeInStep >= fadeInSteps) {
            clearInterval(fadeIn);
            newAudio.volume = options.volume || 1.0;
          } else {
            newAudio.volume += fadeInVolume;
            fadeInStep++;
          }
        }, fadeInInterval);

        return newAudio;
      },
      "WRAPPER"
    );
    console.log("Crossfade Module | AudioHelper.prototype.play hooked successfully");
  } catch (err) {
    console.error("Crossfade Module | Failed to hook AudioHelper.prototype.play", err);
  }
});
