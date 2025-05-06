import axios from 'axios';
import cheerio from 'cheerio';
import FormData from 'form-data';

const fetchSavevid = async (instagramUrl) => {
  const form1 = new FormData();
  form1.append('url', instagramUrl);

  const res1 = await axios.post('https://savevid.net/api/userverify', form1, {
    headers: form1.getHeaders()
  });

  const token = res1.data?.token;
  if (!token) throw new Error('Token tidak ditemukan dari Savevid');

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
      'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
    }
  });

  return parseHtml(res2.data?.data);
};

const parseHtml = (html) => {
  const $ = cheerio.load(html);
  const result = [];

  $('ul.download-box li').each((_, el) => {
    const thumb = $(el).find('.download-items__thumb img').attr('src');
    const downloadLink = $(el).find('.download-items__btn a').attr('href');
    const options = [];

    $(el).find('.photo-option select option').each((_, opt) => {
      options.push({
        resolution: $(opt).text(),
        url: $(opt).attr('value'),
      });
    });

    result.push({ thumb, downloadLink, options });
  });

  return result;
};

export default {
  name: 'savevid',
  description: 'Downloader Instagram via savevid.net',
  usage: '/savevid <url>',
  category: 'downloader',
  async execute(m, { args }) {
    if (!args[0]) return m.reply('Masukkan URL Instagram!');

    try {
      const results = await fetchSavevid(args[0]);
      if (!results.length) return m.reply('Tidak ditemukan media dari URL tersebut.');

      let teks = results.map((res, i) => {
        let list = res.options.map((o, j) => `  ${j + 1}. ${o.resolution}: ${o.url}`).join('\n');
        return `*Media ${i + 1}*\nThumbnail: ${res.thumb}\nDownload: ${res.downloadLink}\nPilihan:\n${list}`;
      }).join('\n\n');

      m.reply(teks);
    } catch (err) {
      m.reply(`Gagal mengambil data:\n${err.message}`);
    }
  }
};
