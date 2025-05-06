// search/search-instagram.js
const axios = require('axios');
const cheerio = require('cheerio');
const FormData = require('form-data');

async function savevidIG(instagramUrl) {
  try {
    const formData1 = new FormData();
    formData1.append('url', instagramUrl);

    const userVerify = await axios.post('https://savevid.net/api/userverify', formData1, {
      headers: formData1.getHeaders()
    });

    const token = userVerify.data.token;

    const formData2 = new FormData();
    formData2.append('q', instagramUrl);
    formData2.append('t', 'media');
    formData2.append('lang', 'id');
    formData2.append('v', 'v2');
    formData2.append('cftoken', token);

    const res = await axios.post('https://v3.savevid.net/api/ajaxSearch', formData2, {
      headers: {
        ...formData2.getHeaders(),
        'origin': 'https://savevid.net',
        'referer': 'https://savevid.net/',
        'user-agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36'
      }
    });

    const html = res.data.data;
    const $ = cheerio.load(html);
    const results = [];

    $('ul.download-box li').each((_, el) => {
      const thumb = $(el).find('.download-items__thumb img').attr('src');
      const downloadLink = $(el).find('.download-items__btn a').attr('href');
      const options = [];

      $(el).find('.photo-option select option').each((_, opt) => {
        options.push({
          resolution: $(opt).text().trim(),
          url: $(opt).attr('value')
        });
      });

      results.push({ thumb, downloadLink, options });
    });

    return results;
  } catch (e) {
    throw new Error('Gagal mengambil data dari Savevid: ' + e.message);
  }
}

module.exports = function(app) {
  app.get('/search/instagram', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ status: false, error: 'Masukkan parameter ?q=' });

    try {
      const result = await savevidIG(q);
      res.json({
        status: true,
        creator: 'ZenzzXD',
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
