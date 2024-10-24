import { Queue, Job } from 'bull';
import { TTSJob } from './api';

export interface TTSQueue extends Queue<TTSJob> {}

export interface TTSQueueJob extends Job<TTSJob> {}
