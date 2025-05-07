import axios from "axios";
import * as cheerio from "cheerio";

export const command = ['downloader-instagram'];
export const tags = ['downloader'];
export const help = ['downloader-instagram <url>'];
export const premium = false;

export async function handler(m, { conn, args }) {
  if (!args[0]) throw 'Masukkan URL Instagram!';
  try {
    const url = args[0];
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
        const href = $(el).attr("href");
        if (href) result.links.push(href);
      });
    } else {
      const photoLink = $(".profile-info .btn-download").attr("href");
      if (photoLink) {
        result.type = "photo";
        result.links.push(photoLink);
      } else {
        throw 'Jenis konten tidak didukung atau link tidak valid.';
      }
    }

    if (result.links.length === 0) throw 'Tidak ada link media yang ditemukan.';
    for (const link of result.links) {
      await conn.sendFile(m.chat, link, 'media.mp4', `Hasil ${result.type}`, m);
    }
  } catch (err) {
    throw `Gagal mengambil data: ${err}`;
  }
}
