// search/search-instagram.js
const axios = require('axios');
const qs = require('qs');
const cheerio = require('cheerio');

async function igdl(urls) {
  const [baseUrl, paramsString] = urls.split('?');
  const params = new URLSearchParams(paramsString);
  const url = baseUrl;
  const igsh = params.get('igsh');

  const data = qs.stringify({
    'url': url,
    'igsh': igsh,
    'lang': 'en'
  });

  const config = {
    method: 'POST',
    url: 'https://api.instasave.website/media',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Mobile Safari/537.36',
      'Content-Type': 'application/x-www-form-urlencoded',
      'origin': 'https://instasave.website',
      'referer': 'https://instasave.website/',
      'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
    },
    data: data
  };

  try {
    const api = await axios.request(config);
    const $ = cheerio.load(api.data);
    const thumbnailUrl = $('img').attr('src')?.replace(/\\"/g, '');
    const downloadUrl = $('a').attr('href')?.replace(/\\"/g, '');

    if (!downloadUrl) throw new Error('Download URL not found');

    return {
      thumbnail: thumbnailUrl,
      downloadUrl: downloadUrl
    };
  } catch (error) {
    throw new Error('Gagal mengambil data Instagram: ' + error.message);
  }
}

module.exports = function(app) {
  app.get('/search/instagram', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ status: false, error: 'URL Instagram dibutuhkan' });

    try {
      const result = await igdl(q);
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
