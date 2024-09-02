// Initially, this project used local storage for the FTP server. This file was configured for that setup. Later, the project was migrated to use an AWS S3 bucket for storage.

const FTPSrv = require('ftp-srv');
const path = require('path');

const ftpServer = new FTPSrv({
  url: 'ftp://0.0.0.0:2121',
  pasv_url: '0.0.0.0',
  pasv_min: 1024,
  pasv_max: 1048,
  anonymous: false
});

ftpServer.on('login', ({ connection, username, password }, resolve, reject) => {
  if (username === 'user' && password === '12345') {
    resolve({ root: path.join(__dirname, 'ftp-root') });
  } else {
    reject(new Error('Invalid credentials'));
  }
});

ftpServer.listen()
  .then(() => {
    console.log('FTP server is running on port 2121');
  })
  .catch(err => {
    console.error('Error starting FTP server:', err.message);
  });