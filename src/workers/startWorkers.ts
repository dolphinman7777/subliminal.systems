import { cpus } from 'os';
import cluster from 'cluster';
import { Worker } from 'worker_threads';
import path from 'path';

const numCPUs = cpus().length;

if (cluster.isPrimary) {
  console.log(`Primary ${process.pid} is running`);

  // Fork workers.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
    // Replace the dead worker
    cluster.fork();
  });
} else {
  // Workers can share any TCP connection
  // In this case, it is a Redis connection.
  const workerPath = path.resolve(__dirname, 'affirmationWorker.js');
  new Worker(workerPath);
  console.log(`Worker ${process.pid} started`);
}