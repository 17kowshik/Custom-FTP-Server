require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'ftp-root/');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage });

app.use(cors({
  origin: 'http://localhost:8080'
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: false
}));

const users = {
  'Maverick': process.env.USER_MAVERICK
};

function authMiddleware(req, res, next) {
  if (req.session.username) {
    return next();
  }
  res.redirect('/login');
}

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (users[username] === password) {
    req.session.username = username;
    res.redirect('/');
  } else {
    res.status(401).send('Invalid credentials');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

app.get('/', authMiddleware, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/upload', authMiddleware, upload.single('file'), (req, res) => {
  res.redirect('/files');
});

app.get('/files', authMiddleware, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'files.html'));
});

app.get('/files-list', authMiddleware, (req, res) => {
  const directoryPath = path.join(__dirname, 'ftp-root');
  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      return res.status(500).send('Unable to scan files!');
    }
    res.json({ files });
  });
});

app.get('/download/:filename', authMiddleware, (req, res) => {
  const filePath = path.join(__dirname, 'ftp-root', decodeURIComponent(req.params.filename));
  res.download(filePath, err => {
    if (err) {
      res.status(500).send('File not found');
    }
  });
});

app.listen(8080, () => {
  console.log('HTTP server running on port 8080');
});