const soundPatterns = {
  success: [523, 659, 784],
  error: [330, 260],
  expired: [440, 350, 280],
  click: [700],
  abandon: [392, 330, 262],
};

let audioContext = null;

export function playSound(type) {
  const enabled = localStorage.getItem('nolab-sound') !== 'false';

  if (!enabled) return;

  const frequencies = soundPatterns[type];

  if (!frequencies) return;

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;

  if (!AudioContextClass) return;

  audioContext ??= new AudioContextClass();

  if (audioContext.state === 'suspended') {
    audioContext.resume().catch(console.error);
  }

  const now = audioContext.currentTime;

  frequencies.forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    const duration =
      type === 'click' ? 0.045 : type === 'abandon' ? 0.22 : 0.15;
    const start = now + index * duration;

    oscillator.type =
      type === 'error' ? 'triangle' : type === 'abandon' ? 'sine' : 'sine';
    oscillator.frequency.value = frequency;

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.40, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start(start);
    oscillator.stop(start + duration);
  });
}
