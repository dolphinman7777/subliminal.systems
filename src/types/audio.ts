export interface AudioContextType {
  audioContext: AudioContext | null;
  gainNode: GainNode | null;
  sourceNode: AudioBufferSourceNode | null;
  audioBuffer: AudioBuffer | null;
}

