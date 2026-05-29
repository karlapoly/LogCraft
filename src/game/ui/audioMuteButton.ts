import Phaser from "phaser";

export const AUDIO_MUTE_BUTTON_KEY = "ui-btn-sound";
export const AUDIO_MUTE_BUTTON_PATH = "assets/images/Botoes/Som.png";
export const AUDIO_MUTED_BUTTON_KEY = "ui-btn-muted";
export const AUDIO_MUTED_BUTTON_PATH = "assets/images/Botoes/Mudo.png";

const AUDIO_MUTED_REGISTRY_KEY = "audio-muted";
const AUDIO_MUTED_STORAGE_KEY = "logcraft-audio-muted";
const BUTTON_SIZE = 83;
const BUTTON_MARGIN = 22;

type AudioMuteButtonOptions = {
  depth?: number;
  bottomOffset?: number;
  onToggle?: (muted: boolean) => void;
};

export function createAudioMuteButton(
  scene: Phaser.Scene,
  options: AudioMuteButtonOptions = {}
): Phaser.GameObjects.Image {
  const muted = getStoredAudioMuted(scene);
  applySceneMute(scene, muted);
  options.onToggle?.(muted);

  const button = scene.add
    .image(0, 0, muted ? AUDIO_MUTED_BUTTON_KEY : AUDIO_MUTE_BUTTON_KEY)
    .setDisplaySize(BUTTON_SIZE, BUTTON_SIZE)
    .setDepth(options.depth ?? 3000)
    .setScrollFactor(0)
    .setInteractive({ useHandCursor: true });

  const updateVisualState = (isMuted: boolean) => {
    button.setTexture(isMuted ? AUDIO_MUTED_BUTTON_KEY : AUDIO_MUTE_BUTTON_KEY);
    button.setDisplaySize(BUTTON_SIZE, BUTTON_SIZE);
    button.setAlpha(1);
    button.clearTint();
  };

  const layout = () => {
    button.setPosition(
      scene.scale.width - BUTTON_MARGIN - BUTTON_SIZE / 2,
      scene.scale.height - BUTTON_MARGIN - BUTTON_SIZE / 2 - (options.bottomOffset ?? 0)
    );
  };

  updateVisualState(muted);
  layout();

  const baseScaleX = button.scaleX;
  const baseScaleY = button.scaleY;

  button.on("pointerover", () => button.setScale(baseScaleX * 1.06, baseScaleY * 1.06));
  button.on("pointerout", () => button.setScale(baseScaleX, baseScaleY));
  button.on("pointerdown", () => {
    const nextMuted = !getStoredAudioMuted(scene);
    setStoredAudioMuted(scene, nextMuted);
    applySceneMute(scene, nextMuted);
    updateVisualState(nextMuted);
    options.onToggle?.(nextMuted);
  });

  scene.scale.on(Phaser.Scale.Events.RESIZE, layout);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    scene.scale.off(Phaser.Scale.Events.RESIZE, layout);
  });

  return button;
}

export function getStoredAudioMuted(scene: Phaser.Scene): boolean {
  const registryValue = scene.registry.get(AUDIO_MUTED_REGISTRY_KEY);
  if (typeof registryValue === "boolean") {
    return registryValue;
  }

  const storedValue = readStoredMuteValue();
  scene.registry.set(AUDIO_MUTED_REGISTRY_KEY, storedValue);
  return storedValue;
}

function setStoredAudioMuted(scene: Phaser.Scene, muted: boolean): void {
  scene.registry.set(AUDIO_MUTED_REGISTRY_KEY, muted);
  try {
    window.localStorage.setItem(AUDIO_MUTED_STORAGE_KEY, muted ? "true" : "false");
  } catch {
    // Local storage can be unavailable in restricted browser contexts.
  }
}

function readStoredMuteValue(): boolean {
  try {
    return window.localStorage.getItem(AUDIO_MUTED_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function applySceneMute(scene: Phaser.Scene, muted: boolean): void {
  const soundManager = scene.sound as Phaser.Sound.BaseSoundManager & {
    mute?: boolean;
    setMute?: (value: boolean) => void;
  };

  if (typeof soundManager.setMute === "function") {
    soundManager.setMute(muted);
    return;
  }

  soundManager.mute = muted;
}
