// PM2 Configuration for SIN-JAPAN-MANAGER-Ver2
// Usage: pm2 start ecosystem.config.js

module.exports = {
  apps: [{
    name: 'sinjapan-manager',
    script: 'dist/index.js',
    
    // Basic configuration
    instances: 1, // 'max' for cluster mode
    autorestart: true,
    watch: false, // Set to true for development
    max_memory_restart: '1G',
    
    // Environment variables
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    
    // Production environment
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    
    // Development environment (if needed)
    env_development: {
      NODE_ENV: 'development',
      PORT: 5000,
      watch: true
    },
    
    // Logging
    log_file: './logs/app.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Advanced PM2 features
    merge_logs: true,
    time: true,
    
    // Restart strategy
    min_uptime: '10s',
    max_restarts: 10,
    
    // Cluster mode options (uncomment if using cluster mode)
    // exec_mode: 'cluster',
    // instances: 'max', // or number of CPUs
    
    // Source map support
    source_map_support: true,
    
    // Node.js options
    node_args: '--max-old-space-size=1024',
    
    // Ignore specific files/folders for watching
    ignore_watch: [
      'node_modules',
      'logs',
      'dist/public'
    ],
    
    // Cron restart (optional - restart daily at 3 AM)
    // cron_restart: '0 3 * * *',
    
    // Health check (optional)
    // health_check_url: 'http://localhost:3000/api/health'
  }],
  
  // Deployment configuration (optional)
  deploy: {
    production: {
      user: 'root', // or your server user
      host: 'your-server-ip', // replace with your Hostinger server IP
      ref: 'origin/main',
      repo: 'https://github.com/SINJAPANLLC/sinjapan-manager-ver2.git',
      path: '/var/www/sinjapan-manager-ver2',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production'
    }
  }
};
