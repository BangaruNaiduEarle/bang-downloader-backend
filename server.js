require('dotenv').config();
const express = require('express');
// const fetch = require('node-fetch'); 
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { instagramGetUrl } = require('instagram-url-direct');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/download', async (req, res) => {
    const { url } = req.body;
    try {
        // 1. Extract direct media URLs
        const { url_list, media_details } = await instagramGetUrl(url);
        // Find first video URL
        const videoDetail = media_details.find(m => m.type === 'video');
        if (!videoDetail) {
            return res.status(400).json({ error: 'No video found at this URL.' });
        }
        const downloadLink = videoDetail.url;

        // 2. Stream download to temp file
        const tempDir = path.join(__dirname, 'temp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
        const tempFile = path.join(tempDir, `${Date.now()}.mp4`);
        // const response = await fetch(downloadLink);

        const response = await axios.get(downloadLink, { responseType: 'stream' });
        // console.log("Response -->", response)
        const fileStream = fs.createWriteStream(tempFile);
        // response.body.pipe(fileStream);
        response.data.pipe(fileStream);
        fileStream.on('finish', () => {
            // 3. Send file to client, then cleanup
            res.download(tempFile, 'instagram_video.mp4', err => {
                fs.unlinkSync(tempFile);
                if (err) console.error('Download error:', err);
            });
        });
    } catch (err) {
        // console.error(err);
        res.status(500).json({ error: 'Failed to download video.' });
    }
});

app.post('/preview', async (req, res) => {
  const { url } = req.body;

  try {
    const { url_list, media_details } = await instagramGetUrl(url);
    const videoDetail = media_details.find(m => m.type === 'video');

    if (!videoDetail) {
      return res.status(400).json({ error: 'No video found at this URL.' });
    }

    // Get filename from the URL (you can enhance this if needed)
    const videoUrl = videoDetail.url;
    const fileName = `instagram_video_${Date.now()}.mp4`; // or extract from videoUrl with path.parse()

    return res.json({
      videoUrl,
      videoName: fileName
    });
  } catch (err) {
    // console.error(err);
    res.status(500).json({ error: 'Failed to fetch preview.' });
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
