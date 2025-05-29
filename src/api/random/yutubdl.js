const axios = require('axios');
const { atob, btoa } = require('buffer'); // Impor atob/btoa dari buffer untuk kompatibilitas

// --- Kelas YouTubeDownloader (Sudah disesuaikan ke CommonJS & axios) ---
const YouTubeDownloader = class {
  constructor(config = {}) { // Beri nilai default jika config tidak ada
    this.base_url = "mnuu.nu";
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'en-US,en;q=0.9,id-ID;q=0.8,id;q=0.7,as;q=0.6',
      'Cache-Control': 'max-age=0',
      'Dnt': '1',
      'Sec-Ch-Ua': `"Not-A.Brand";v="99", "Chromium";v="124"`,
      'Sec-Ch-Ua-Mobile': '?1',
      'Sec-Ch-Ua-Platform': "Android",
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
      'Origin': 'https://y2mate.nu',
      'Referer': 'https://y2mate.nu/'
    };
    this.logging = config.logging || false;
    this.gC = null;
    this.dynamic_g0 = null;
    this.dynamic_gO = null;
  }

  async download(url, format = "mp3") {
    try {
      const videoId = this._validateUrl(url);
      if (!this._validateFormats(format)) throw new Error(`Format tidak valid. Hanya "mp3" dan "mp4" yang didukung.`);
      
      const { title, download, progress } = await this._startConvert(videoId, format);
      await this._getProgress(progress);
      
      return { title, downloadUrl: download };
    } catch (e) {
      console.error("Download Error:", e.message);
      // Melempar error lagi agar bisa ditangkap oleh handler API
      throw new Error(e.message || `Terjadi galat saat download.`);
    }
  }

  async _getConvertURL() {
    try {
      const a = await this._getSignature();
      if (!a) throw new Error("Gagal mendapatkan signature.");
      
      const response = await axios.get(`https://d.${this.base_url}/api/v1/init?a=${a}&_=${Math.random()}`, { headers: this.headers });
      const json = response.data;
      
      if (json.error === 1) throw new Error(json.message || "Gagal mendapatkan Convert URL dari API.");
      return json.convertURL;
    } catch (e) {
      console.error("GetConvertURL Error:", e.message);
      throw new Error(e.message || `Gagal mendapatkan Convert URL.`);
    }
  }

  async _startConvert(videoId, format) {
     try {
        const url = await this._getConvertURL();
        let response = await axios.get(`${url}&v=${videoId}&f=${format}&_=${Math.random()}`, { headers: this.headers });
        let json = response.data;

        if (json.error === 1) throw new Error(json.message || "Gagal Mengkonversi video.");
        if (json.redirect === 1) {
            if (this.logging) console.log("Redirecting...");
            response = await axios.get(json.redirectURL, { headers: this.headers });
            json = response.data;
        }

        if (!json.downloadURL || !json.progressURL) throw new Error("Respons API konversi tidak valid.");
        return { title: json.title, download: json.downloadURL, progress: json.progressURL };
    } catch (e) {
        console.error("StartConvert Error:", e.message);
        throw new Error(e.message || `Gagal memulai konversi.`);
    }
  }

  async _getProgress(url) {
    try {
      let attempts = 0;
      while (attempts < 20) { // Tambahkan batas percobaan
        const response = await axios.get(`${url}&_${Math.random()}`, { headers: this.headers });
        const json = response.data;
        
        if (json.error === 1) throw new Error(json.message || "Gagal mendapatkan progress.");
        if (json.progress === 3) return true; // Selesai
        
        await this._sleep(1000); // Tunggu 1 detik
        attempts++;
      }
      throw new Error("Proses konversi terlalu lama (timeout).");
    } catch (e) {
      console.error("GetProgress Error:", e.message);
      throw new Error(e.message || `Gagal mendapatkan progress.`);
    }
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  _validateUrl(url) {
    if (!url || typeof url !== 'string') {
      throw new Error('URL harus berupa string.');
    }
    try {
      new URL(url); // Cek apakah URL valid secara umum
      const match = /(?:youtu\.be\/|youtube\.com(?:.*[?&]v=|.*\/))([^?&]+)/.exec(url);
      if (match && match[1]) {
        return match[1]; // Kembalikan Video ID
      } else {
        throw new Error(`Bukan URL YouTube yang valid.`);
      }
    } catch (e) {
      throw new Error(`URL tidak valid: ${e.message}`);
    }
  }

  _validateFormats(format) {
    return ["mp3", "mp4"].includes(format);
  }

  async _extractSignature() {
    try {
        if (this.logging) console.log(`Mendapatkan HTML dari https://y2mate.nu...`);
        const response = await axios.get("https://y2mate.nu", { headers: this.headers });
        const htmlContent = response.data;
        if (this.logging) console.log("HTML berhasil didapatkan.");

        const regex = /eval\(atob\('([^']+)'\)\)/;
        const match = htmlContent.match(regex);

        if (match && match[1]) {
            const base64EncodedJs = match[1];
            const decodedJs = atob(base64EncodedJs);

            const objectVarRegex = /var\s+([a-zA-Z0-9_]+)\s*=\s*(\{.*?\});/;
            const arrayVarRegex = /var\s+([a-zA-Z0-9_]+)\s*=\s*(\[.*?\]);/;

            const objectMatch = decodedJs.match(objectVarRegex);
            const arrayMatch = decodedJs.match(arrayVarRegex);

            if (objectMatch && arrayMatch) {
                let objectString = objectMatch[2];
                let arrayString = arrayMatch[2];

                // Coba parse dengan lebih hati-hati
                const jsonCompatible_objectString = objectString.replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":').replace(/'/g, '"');
                const jsonCompatible_arrayString = arrayString.replace(/'/g, '"');

                const parsedObject = JSON.parse(jsonCompatible_objectString);
                const parsedArray = JSON.parse(jsonCompatible_arrayString);

                if (this.logging) console.log("Berhasil mendapatkan dinamik variabel.");
                return { g0: parsedObject, gO: parsedArray };
            } else {
                 throw new Error("Tidak dapat mengekstrak variabel g0/gO dari JS.");
            }
        } else {
            throw new Error("Tidak dapat menemukan pola eval(atob(...)) di HTML.");
        }
    } catch (error) {
        console.error("Gagal mendapatkan atau memproses HTML:", error.message);
        throw new Error("Gagal mengekstrak signature dari HTML: " + error.message);
    }
  }
  
  // Fungsi _getSignature sangat kompleks dan sensitif terhadap perubahan
  // di y2mate.nu. Kita salin apa adanya dengan asumsi atob/btoa tersedia.
  // PENTING: Fungsi ini sangat mungkin GAGAL jika sumber berubah.
  async _getSignature() {
      if (!this.dynamic_g0 || !this.dynamic_gO) {
        const extractedData = await this._extractSignature();
        if (extractedData) {
            this.dynamic_g0 = extractedData.g0;
            this.dynamic_gO = extractedData.gO;
        } else {
            throw new Error("Gagal menginisialisasi g0/gO untuk signature.");
        }
      }

      this.gC = this.dynamic_g0;
      const gO = this.dynamic_gO;

      this.gC.c = this.gC[gO[1]];
      this.gC.f = this.gC[gO[2]];
      this.gC.t = this.gC[gO[3]];

      let evalCheckString = atob(this.gC.t[0]);
      let evalCheckResult = Number(evalCheckString);

      if (evalCheckResult != this.gC.t[1]) {
          throw new Error("Pemeriksaan otorisasi signature gagal.");
      }

      var key = this.gC.f[6].split("").reverse().join("") + this.gC.f[7];
      var decoded_gC0 = atob(this.gC[0]);
      var indices_str_array = decoded_gC0.split(this.gC.f[5]);
      var charSource = (0 < this.gC.f[4] ? this.gC[1].split("").reverse().join("") : this.gC[1]);

      for (var c_idx = 0; c_idx < indices_str_array.length; c_idx++) {
          let index_val = parseInt(indices_str_array[c_idx]);
          let index_to_use = index_val - this.gC.f[3];
          key += charSource[index_to_use];
      }

      var firstPartLength = this.gC.f[6].length + this.gC.f[7].length;
      if (1 == this.gC.f[1]) {
          key = key.substring(0, firstPartLength) + key.substring(firstPartLength).toLowerCase();
      } else if (2 == this.gC.f[1]) {
          key = key.substring(0, firstPartLength) + key.substring(firstPartLength).toUpperCase();
      }

      var finalString;
      if (0 < this.gC.f[0].length) {
          let prefix = atob(this.gC.f[0]).replace(String.fromCharCode(this.gC.f[8]), "");
          finalString = prefix + "_" + this.gC[2];
      } else if (0 < this.gC.f[2]) {
          finalString = key.substring(0, this.gC.f[2] + firstPartLength) + "_" + this.gC[2];
      } else {
          finalString = key + "_" + this.gC[2];
      }
      
      return btoa(finalString);
  }
};


// --- Rute Express ---
module.exports = function (app) {

    const handleDownload = async (req, res, format) => {
        const { url } = req.query;
        const creatorName = "ZenzzXD";

        if (!url) {
            return res.status(400).json({
                status: false,
                creator: creatorName,
                message: "Parameter 'url' wajib diisi."
            });
        }

        try {
            const yt = new YouTubeDownloader({ logging: false }); // Matikan logging di API
            const result = await yt.download(url, format);

            res.json({
                status: true,
                creator: creatorName,
                result: result
            });

        } catch (error) {
            console.error(`YT Downloader Error (${format}):`, error.message);
            res.status(500).json({
                status: false,
                creator: creatorName,
                message: error.message || `Gagal mengunduh ${format}.`
            });
        }
    };

    app.get('/downloader/ytmp3', (req, res) => {
        handleDownload(req, res, 'mp3');
    });

    app.get('/downloader/ytmp4', (req, res) => {
        handleDownload(req, res, 'mp4');
    });

    // Tambahkan rute lain di sini...
};
