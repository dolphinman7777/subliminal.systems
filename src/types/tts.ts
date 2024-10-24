export interface TTSJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  audioUrl?: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TTSJobResponse {
  jobId: string;
  status: TTSJob['status'];
  audioUrl?: string;
}

export interface TTSJobRequest {
  text: string;
  voice?: string;
  speed?: number;
  volume?: number;
}
