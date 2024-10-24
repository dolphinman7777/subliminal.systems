import ffmpeg from 'fluent-ffmpeg';
import { parentPort } from 'worker_threads';

parentPort.on('message', ({ ttsBuffer, backingTrackBuffer, ttsVolume, backingTrackVolume, trackDuration }) => {
  // Convert volume to 0-1 range if necessary
  const ttsVol = ttsVolume > 1 ? ttsVolume / 100 : ttsVolume;
  const backingVol = backingTrackVolume > 1 ? backingTrackVolume / 100 : backingTrackVolume;

  const CHUNK_SIZE = 4096;
  const SAMPLE_RATE = 44100;
  const totalSamples = Math.min(trackDuration * SAMPLE_RATE, Math.max(ttsBuffer.byteLength, backingTrackBuffer.byteLength) / 2);

  // Ensure the buffers have even lengths
  const ttsData = new Int16Array(ttsBuffer.slice(0, ttsBuffer.byteLength - (ttsBuffer.byteLength % 2)));
  const backingTrackData = new Int16Array(backingTrackBuffer.slice(0, backingTrackBuffer.byteLength - (backingTrackBuffer.byteLength % 2)));

  const combinedBuffer = new ArrayBuffer(totalSamples * 2);
  const combinedData = new Int16Array(combinedBuffer);

  for (let offset = 0; offset < totalSamples; offset += CHUNK_SIZE) {
    const chunkSize = Math.min(CHUNK_SIZE, totalSamples - offset);
    const ttsChunk = offset < ttsData.length ? ttsData.subarray(offset, offset + chunkSize) : new Int16Array(chunkSize);
    const backingChunk = offset < backingTrackData.length ? backingTrackData.subarray(offset, offset + chunkSize) : new Int16Array(chunkSize);
    const mixedChunk = mixBuffers(ttsChunk, backingChunk, ttsVol, backingVol);
    combinedData.set(mixedChunk, offset);
  }

  parentPort.postMessage(combinedBuffer, [combinedBuffer]);
});

function mixBuffers(buffer1, buffer2, volume1, volume2) {
  const mixed = new Int16Array(buffer1.length);
  for (let i = 0; i < mixed.length; i++) {
    const sample1 = i < buffer1.length ? buffer1[i] * volume1 : 0;
    const sample2 = i < buffer2.length ? buffer2[i] * volume2 : 0;
    const mixedSample = Math.max(Math.min(
      Math.floor(sample1 + sample2),
      32767
    ), -32768);
    mixed[i] = mixedSample;
  }
  return mixed;
}
