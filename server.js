require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const { S3Client, PutObjectCommand, ListObjectsCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const session = require('express-session');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();

// Configure AWS SDK
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const bucketName = process.env.S3_BUCKET_NAME;

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage()
});

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

app.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).send('No file uploaded.');
  }
  const params = {
    Bucket: bucketName,
    Key: file.originalname,
    Body: file.buffer,
    ContentType: file.mimetype
  };
  try {
    await s3.send(new PutObjectCommand(params));
    res.redirect('/files');
  } catch (err) {
    res.status(500).send('Error uploading file.');
  }
});

app.get('/files', authMiddleware, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'files.html'));
});

app.get('/files-list', authMiddleware, async (req, res) => {
  const params = {
    Bucket: bucketName
  };
  try {
    const data = await s3.send(new ListObjectsCommand(params));
    const files = data.Contents.map(item => item.Key);
    res.json({ files });
  } catch (err) {
    res.status(500).send('Unable to list files.');
  }
});

app.get('/download/:filename', authMiddleware, async (req, res) => {
  const params = {
    Bucket: bucketName,
    Key: decodeURIComponent(req.params.filename)
  };
  try {
    const data = await s3.send(new GetObjectCommand(params));
    res.attachment(params.Key);
    data.Body.pipe(res);
  } catch (err) {
    res.status(500).send('File not found.');
  }
});

app.listen(8080, () => {
  console.log('HTTP server running on port 8080');
});