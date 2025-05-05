import axios from "axios";
import * as cheerio from "cheerio";

export default {
  name: "instagram",
  tags: ["downloader", "instagram"],
  params: ["q"],
  run: async (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ status: false, message: "Missing parameter: q" });

    try {
      const result = await igdl(q);
      res.json({
        status: true,
        creator: "ZenzzXD",
        result,
      });
    } catch (err) {
      res.status(500).json({ status: false, message: err.message || "Download failed" });
    }
  },
};

const igdl = async (u) => {
  let { data } = await axios.get(
    `https://snapdownloader.com/tools/instagram-downloader/download?url=${u}`
  );
  let $ = cheerio.load(data);

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
      const url = $(el).attr("href");
      result.links.push(url);
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
};
