// PM2 process file used on the EC2 server:
//   pm2 start ecosystem.config.cjs
// The app reads its settings from backend/.env (loaded by dotenv), so no
// secrets are stored here.
module.exports = {
  apps: [
    {
      name: 'task-tracker-api',
      script: 'src/server.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
      },
      time: true,
    },
  ],
};
