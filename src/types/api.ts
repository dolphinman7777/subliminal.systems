export interface TTSResponse {
  audioUrl: string;
  duration?: number;
}

export interface APIError {
  message: string;
  code?: string;
  status?: number;
}

export interface TTSRequest {
  text: string;
  voice?: string;
  speed?: number;
  volume?: number;
}

export interface TTSJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  text: string;
  userId: string;
  audioUrl?: string;
  error?: string;
}
