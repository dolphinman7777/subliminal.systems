import { Worker } from 'worker_threads';
import path from 'path';

class LoadBalancer {
  private workers: Worker[] = [];
  private currentWorkerIndex = 0;

  constructor(numWorkers: number) {
    for (let i = 0; i < numWorkers; i++) {
      const worker = new Worker(path.resolve(__dirname, '../workers/affirmationWorker.js'));
      this.workers.push(worker);
    }
  }

  public getNextWorker(): Worker {
    const worker = this.workers[this.currentWorkerIndex];
    this.currentWorkerIndex = (this.currentWorkerIndex + 1) % this.workers.length;
    return worker;
  }
}

export const loadBalancer = new LoadBalancer(4); // Create 4 worker instances