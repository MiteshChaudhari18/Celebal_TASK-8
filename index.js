const express = require('express');
const multer = require('multer');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = 3000;

// Imagga API credentials
const IMAGGA_API_KEY = 'acc_6ce717827b519cf';
const IMAGGA_API_SECRET = '7787dfe2bb1311b279a8042a9d0f4695';

app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

app.post('/upload', upload.single('file'), async (req, res, next) => {
  if (!req.file) {
    return next(new Error('No file uploaded'));
  }

  const fileUrl = `/uploads/${req.file.filename}`;

  try {
    const response = await axios.get(
      'https://api.imagga.com/v2/tags',
      {
        params: { image_url: `http://localhost:${PORT}${fileUrl}` },
        auth: {
          username: IMAGGA_API_KEY,
          password: IMAGGA_API_SECRET
        }
      }
    );

    const tags = response.data.result.tags.slice(0, 5).map(tag => tag.tag.en);

    res.json({
      message: 'Upload successful!',
      fileUrl,
      tags
    });
  } catch (err) {
    console.error('Imagga error:', err.message);
    res.json({
      message: 'Upload successful, but failed to analyze image.',
      fileUrl,
      tags: []
    });
  }
});

app.use((err, req, res, next) => {
  res.status(400).json({ error: err.message });
});

app.use((req, res) => {
  res.status(404).send('Route not found');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
