const axios = require("axios");
const cheerio = require("cheerio");

async function igdl(url) {
  const { data } = await axios.get(
    `https://snapdownloader.com/tools/instagram-downloader/download?url=${url}`
  );
  const $ = cheerio.load(data);
  const result = {
    type: null,
    links: [],
  };

  const videoItems = $(".download-item").filter((i, el) => {
    return $(el).find(".type").text().trim().toLowerCase() === "video";
  });

  if (videoItems.length > 0) {
    result.type = "video";
    videoItems.find(".btn-download").each((i, el) => {
      const link = $(el).attr("href");
      if (link) result.links.push(link);
    });
  } else {
    const photoLink = $(".profile-info .btn-download").attr("href");
    if (photoLink) {
      result.type = "photo";
      result.links.push(photoLink);
    } else {
      throw new Error("Jenis konten tidak didukung");
    }
  }

  return result;
}

module.exports = function(app) {
  app.get('/search/instagram', async (req, res) => {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ status: false, error: 'URL is required' });
    }

    try {
      const result = await igdl(q);
      res.status(200).json({ status: true, result });
    } catch (error) {
      res.status(500).json({ status: false, error: error.message });
    }
  });
};
