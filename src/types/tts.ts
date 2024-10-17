export interface TTSJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  text: string;
  userId: string;
  audioUrl?: string;
}
