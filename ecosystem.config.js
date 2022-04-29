module.exports = {
    apps: [
        {
            name: '<Projektname>',
            script: 'dist/index.js',
            watch: true,
            ignore_watch: ['node_modules', 'logs'],
            instances: '2',
            exec_mode: 'cluster',
            exp_backoff_restart_delay: 100,
            env: {
                COMPILED: true,
                NODE_ENV: 'development'
            },
            env_production: {
                COMPILED: true,
                NODE_ENV: 'production'
            },
            pmx: false
        }
    ]
};
