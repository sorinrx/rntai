module.exports = {
  apps: [{
    name: 'renet',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    cwd: './',
    exec_mode: 'cluster',
    instances: 2,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: 'logs/err.log',
    out_file: 'logs/out.log',
    log_file: 'logs/combined.log',
    time: true
  }],
};