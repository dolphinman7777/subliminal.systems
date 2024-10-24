module.exports = {
  apps: [{
    name: "tts-worker",
    script: "dist/workers/ttsWorker.js",
    instances: "max",
    exec_mode: "cluster",
    autorestart: true,
    watch: false,
    max_memory_restart: "1G",
    env: {
      NODE_ENV: "production",
    },
  }]
};