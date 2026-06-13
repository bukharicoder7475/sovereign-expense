const path = require('path');
const os = require('os');
const lt = require(path.join(os.homedir(), 'AppData/Roaming/npm/node_modules/localtunnel'));
(async () => {
  const tunnel = await lt({ port: 5000 });
  console.log('========================================');
  console.log('OPEN THIS URL ON YOUR PHONE:');
  console.log(tunnel.url);
  console.log('========================================');
  tunnel.on('close', () => { console.log('tunnel closed'); });
})();
