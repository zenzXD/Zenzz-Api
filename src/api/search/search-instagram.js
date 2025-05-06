const axios = require('axios');
const cheerio = require('cheerio');
const FormData = require('form-data');

async function savevidDownloader(instagramUrl) {
  try {
    const form1 = new FormData();
    form1.append('url', instagramUrl);

    const tokenRes = await axios.post('https://savevid.net/api/userverify', form1, {
      headers: form1.getHeaders()
    });

    const token = tokenRes.data?.token;
    if (!token) throw new Error('Token tidak ditemukan');

    const form2 = new FormData();
    form2.append('q', instagramUrl);
    form2.append('t', 'media');
    form2.append('lang', 'id');
    form2.append('v', 'v2');
    form2.append('cftoken', token);

    const res2 = await axios.post('https://v3.savevid.net/api/ajaxSearch', form2, {
      headers: {
        ...form2.getHeaders(),
        'origin': 'https://savevid.net',
        'referer': 'https://savevid.net/',
        'user-agent': 'Mozilla/5.0 (Linux; Android 10)',
        'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8',
      }
    });

    return extractData(res2.data?.data);
  } catch (error) {
    throw new Error('Gagal mengambil data Savevid: ' + error.message);
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

    result.push({ thumb, downloadLink, options });
  });

  return result;
}

module.exports = function (app) {
  app.get('/search/savevid', async (req, res) => {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({
        status: false,
        error: 'URL Instagram dibutuhkan'
      });
    }

    try {
      const result = await savevidDownloader(q);
      if (!result.length) {
        return res.status(404).json({ status: false, error: 'Media tidak ditemukan' });
      }

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
