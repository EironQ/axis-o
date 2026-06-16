module.exports = {
  apps: [{
    name: 'axis-o-api',
    script: 'tsx',
    args: './server/src/index.ts',
    cwd: '/var/www/axis-o',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production'
    },
    autorestart: true,
    restart_delay: 3000,
    max_restarts: 5
  }]
}
