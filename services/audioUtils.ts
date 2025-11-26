export function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1
): Promise<AudioBuffer> {
  // Convert Uint8Array to Int16Array (PCM data)
  const dataInt16 = new Int16Array(data.buffer);
  
  // Create an AudioBuffer
  const buffer = ctx.createBuffer(numChannels, dataInt16.length, sampleRate);
  
  // Fill the buffer with the PCM data, normalized to [-1, 1]
  const channelData = buffer.getChannelData(0); // Assuming mono for TTS
  for (let i = 0; i < dataInt16.length; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  
  return buffer;
}