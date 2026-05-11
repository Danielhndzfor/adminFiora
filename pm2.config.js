module.exports = {
  apps: [
    {
      name: "fiora-app",
      script: "./server.js",
      instances: 2,
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      },
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_file: "./logs/combined.log",
      time_format: "YYYY-MM-DD HH:mm:ss Z",
      autorestart: true,
      max_memory_restart: "1G",
      shutdown_delay: 5000,
      wait_ready: true,
      listen_timeout: 10000
    }
  ],
  deploy: {
    production: {
      user: "usuario",
      host: "fiora.mascontrol.app",
      ref: "origin/main",
      repo: "https://github.com/Danielhndzfor/adminFiora.git",
      path: "/home/usuario/fiora-app",
      "post-deploy": "npm install && npm run build && pm2 restart fiora-app"
    }
  }
};
