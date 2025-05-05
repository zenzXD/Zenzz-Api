import axios from "axios";
import * as cheerio from "cheerio";

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

igdl("https://www.instagram.com/reel/DJQp5dxR0YI/?igsh=ZGxmcmxmMGhnZHl4").then(console.log)
