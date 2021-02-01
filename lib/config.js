const config = {
  production:  {
    httpPort: 5000,
    httpsPort: 5001,
    name: 'production',
    hashingSecret: 'hannah',
    maxCheck: 5,
  }, 
  development:  {
    httpPort: 3000,
    httpsPort: 3001,
    name: 'development',
    hashingSecret: 'hannah',
    maxCheck: 5,
  } 
};

const setEnv = !process.env.NODE_ENV ? config.development : config[process.env.NODE_ENV];

module.exports = setEnv;

