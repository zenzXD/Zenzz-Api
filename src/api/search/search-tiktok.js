// search/search-tiktok.js
const axios = require('axios');
const cheerio = require('cheerio');

const extractTikTokData = async (url) => {
  try {
    const response = await axios.post('https://ttsave.app/download', {
      query: url,
      language_id: '2'
    }, {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      }
    });

    const $ = cheerio.load(response.data);

    return {
      title: $('h2').text().trim(),
      username: $('a[title]').text().trim(),
      description: $('p.text-gray-600').text().trim(),
      downloadLinks: {
        noWatermark: $('a[type="no-watermark"]').attr('href'),
        withWatermark: $('a[type="watermark"]').attr('href'),
        audio: $('a[type="audio"]').attr('href'),
        profilePicture: $('a[type="profile"]').attr('href'),
        videoCover: $('a[type="cover"]').attr('href')
      }
    };
  } catch (error) {
    throw new Error('Gagal mengambil data dari TikTok');
  }
};

module.exports = function(app) {
  app.get('/search/tiktok', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ status: false, error: 'URL TikTok dibutuhkan' });

    try {
      const result = await extractTikTokData(q);
      res.status(200).json({
        status: true,
        result
      });
    } catch (err) {
      res.status(500).json({
        status: false,
        error: err.message
      });
    }
  });
};
