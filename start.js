const { exec } = require('child_process');
const path = require('path');

const backend = exec('node server.js', { cwd: path.join(__dirname, 'backend') });
backend.stdout.pipe(process.stdout);
backend.stderr.pipe(process.stderr);

setTimeout(() => {
  const frontend = exec('npx serve -s build -l 3000', { cwd: path.join(__dirname, 'frontend') });
  frontend.stdout.pipe(process.stdout);
  frontend.stderr.pipe(process.stderr);
  console.log('\n=== Both servers started ===');
  console.log('Backend:  http://localhost:5000');
  console.log('Frontend: http://localhost:3000');
  console.log('Network:  http://192.168.1.16:3000');
}, 3000);
