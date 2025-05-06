const axios = require('axios');
const cheerio = require('cheerio');
const FormData = require('form-data');

async function savevidIG(url) {
  try {
    // Step 1: Get cftoken
    const verifyForm = new FormData();
    verifyForm.append('url', url);

    const verify = await axios.post('https://savevid.net/api/userverify', verifyForm, {
      headers: verifyForm.getHeaders()
    });

    const token = verify.data?.token;
    if (!token) throw new Error('Token tidak ditemukan');

    // Step 2: Search media with token
    const searchForm = new FormData();
    searchForm.append('q', url);
    searchForm.append('t', 'media');
    searchForm.append('lang', 'id');
    searchForm.append('v', 'v2');
    searchForm.append('cftoken', token);

    const res = await axios.post('https://v3.savevid.net/api/ajaxSearch', searchForm, {
      headers: {
        ...searchForm.getHeaders(),
        'origin': 'https://savevid.net',
        'referer': 'https://savevid.net/',
        'user-agent': 'Mozilla/5.0 (Linux; Android 10)',
        'accept-language': 'id-ID,id;q=0.9',
      }
    });

    return extractData(res.data.data);
  } catch (err) {
    throw new Error('Gagal mengambil data: ' + err.message);
  }
}

function extractData(html) {
  const $ = cheerio.load(html);
  const result = [];

  $('ul.download-box li').each((_, el) => {
    const thumb = $(el).find('.download-items__thumb img').attr('src');
    const downloadLink = $(el).find('.download-items__btn a').attr('href');
    const options = [];

    $(el).find('.photo-option select option').each((_, opt) => {
      options.push({
        resolution: $(opt).text(),
        url: $(opt).attr('value')
      });
    });

    result.push({
      thumbnail: thumb,
      download: downloadLink,
      options
    });
  });

  return result;
}

module.exports = function(app) {
  app.get('/search/instagram', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ status: false, error: 'Parameter ?q=URL diperlukan' });

    try {
      const result = await savevidIG(q);
      res.json({ status: true, result });
    } catch (err) {
      res.status(500).json({ status: false, error: err.message });
    }
  });
};
