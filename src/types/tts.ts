export type TTSJob = {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  text: string;
  voice: string; // Add the 'voice' property here
  audioUrl?: string;
  error?: string;
};
