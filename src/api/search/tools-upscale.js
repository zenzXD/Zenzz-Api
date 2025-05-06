// plugins/bigjpg.mjs
import axios from 'axios';

const bigjpg = {
  api: {
    base: 'https://bigjpg.com',
    endpoint: {
      task: '/task',
      free: '/free'
    }
  },

  available: {
    styles: {
      'art': 'Artwork',
      'photo': 'Foto'
    },
    noise: {
      '-1': 'Ninguno',
      '0': 'Bajo',
      '1': 'Medio',
      '2': 'Alto',
      '3': 'El más alto'
    }
  },

  headers: {
    'origin': 'https://bigjpg.com',
    'referer': 'https://bigjpg.com/',
    'user-agent': 'Postify/1.0.0',
    'x-requested-with': 'XMLHttpRequest'
  },

  isValid(style, noise) {
    if (!style && !noise) {
      return { valid: true, style: 'art', noise: '-1' };
    }

    if (style && !this.available.styles[style]) {
      return {
        valid: false,
        error: `Stylenya kagak valid bree.. Pilih salah satunya yak: ${Object.keys(this.available.styles).join(', ')}`
      };
    }

    if (noise && !this.available.noise[noise]) {
      return {
        valid: false,
        error: `Noise levelnya kagak valid bree.. Pilih salah satunya yak: ${Object.keys(this.available.noise).join(', ')}`
      };
    }

    return {
      valid: true,
      style: style || 'art',
      noise: noise || '-1'
    };
  },

  async getImageInfo(img) {
    if (!img) {
      return {
        valid: false,
        error: "Lu kasih link image nya yak 🗿"
      };
    }

    try {
      const response = await axios.get(img, { responseType: 'arraybuffer' });

      const fileSize = parseInt(response.headers['content-length'] || response.data.length);
      const width = Math.floor(Math.random() * (2000 - 800 + 1)) + 800;
      const height = Math.floor(Math.random() * (2000 - 800 + 1)) + 800;

      let fileName = img.split('/').pop().split('#')[0].split('?')[0] || 'image.jpg';
      if (fileName.endsWith('.webp')) {
        fileName = fileName.replace('.webp', '.jpg');
      }

      if (fileSize > 5 * 1024 * 1024) {
        return {
          valid: false,
          error: "Size imagenya kegedean bree.. Max 5MB yak"
        };
      }

      return {
        valid: true,
        info: { fileName, fileSize, width, height }
      };

    } catch {
      return {
        valid: false,
        error: "Link imagenya error bree.. Coba link yang lain yak"
      };
    }
  },

  async upscale(img, options = {}) {
    const validation = await this.getImageInfo(img);
    if (!validation.valid) {
      return {
        success: false,
        code: 400,
        result: { error: validation.error }
      };
    }

    const inputx = this.isValid(options.style, options.noise);
    if (!inputx.valid) {
      return {
        success: false,
        code: 400,
        result: { error: inputx.error }
      };
    }

    const config = {
      x2: '2',
      style: inputx.style,
      noise: inputx.noise,
      file_name: validation.info.fileName,
      files_size: validation.info.fileSize,
      file_height: validation.info.height,
      file_width: validation.info.width,
      input: img
    };

    try {
      const params = new URLSearchParams();
      params.append('conf', JSON.stringify(config));

      const taskx = await axios.post(
        this.api.base + this.api.endpoint.task,
        params,
        { headers: this.headers }
      );

      if (taskx.data.status !== 'ok') {
        return {
          success: false,
          code: 400,
          result: { error: "Gagal generate task" }
        };
      }

      const taskId = taskx.data.info;
      let attempts = 0;

      while (attempts < 20) {
        const res = await axios.get(
          this.api.base + this.api.endpoint.free + `?fids=${JSON.stringify([taskId])}`,
          { headers: this.headers }
        );

        const result = res.data[taskId];
        if (result[0] === 'success') {
          return {
            success: true,
            code: 200,
            result: {
              info: validation.info,
              url: result[1],
              size: result[2],
              config: {
                style: config.style,
                styleName: this.available.styles[config.style],
                noise: config.noise,
                noiseName: this.available.noise[config.noise]
              }
            }
          };
        } else if (result[0] === 'error') {
          return {
            success: false,
            code: 400,
            result: { error: "Upscale gagal bree." }
          };
        }

        await new Promise(resolve => setTimeout(resolve, 15000));
        attempts++;
      }

      return {
        success: false,
        code: 400,
        result: { error: "Timeout bree.." }
      };

    } catch (err) {
      return {
        success: false,
        code: 400,
        result: { error: err.message || "Upscale error" }
      };
    }
  }
};

export default bigjpg;// plugins/bigjpg.mjs
import axios from 'axios';

const bigjpg = {
  api: {
    base: 'https://bigjpg.com',
    endpoint: {
      task: '/task',
      free: '/free'
    }
  },

  available: {
    styles: {
      'art': 'Artwork',
      'photo': 'Foto'
    },
    noise: {
      '-1': 'Ninguno',
      '0': 'Bajo',
      '1': 'Medio',
      '2': 'Alto',
      '3': 'El más alto'
    }
  },

  headers: {
    'origin': 'https://bigjpg.com',
    'referer': 'https://bigjpg.com/',
    'user-agent': 'Postify/1.0.0',
    'x-requested-with': 'XMLHttpRequest'
  },

  isValid(style, noise) {
    if (!style && !noise) {
      return { valid: true, style: 'art', noise: '-1' };
    }

    if (style && !this.available.styles[style]) {
      return {
        valid: false,
        error: `Stylenya kagak valid bree.. Pilih salah satunya yak: ${Object.keys(this.available.styles).join(', ')}`
      };
    }

    if (noise && !this.available.noise[noise]) {
      return {
        valid: false,
        error: `Noise levelnya kagak valid bree.. Pilih salah satunya yak: ${Object.keys(this.available.noise).join(', ')}`
      };
    }

    return {
      valid: true,
      style: style || 'art',
      noise: noise || '-1'
    };
  },

  async getImageInfo(img) {
    if (!img) {
      return {
        valid: false,
        error: "Lu kasih link image nya yak 🗿"
      };
    }

    try {
      const response = await axios.get(img, { responseType: 'arraybuffer' });

      const fileSize = parseInt(response.headers['content-length'] || response.data.length);
      const width = Math.floor(Math.random() * (2000 - 800 + 1)) + 800;
      const height = Math.floor(Math.random() * (2000 - 800 + 1)) + 800;

      let fileName = img.split('/').pop().split('#')[0].split('?')[0] || 'image.jpg';
      if (fileName.endsWith('.webp')) {
        fileName = fileName.replace('.webp', '.jpg');
      }

      if (fileSize > 5 * 1024 * 1024) {
        return {
          valid: false,
          error: "Size imagenya kegedean bree.. Max 5MB yak"
        };
      }

      return {
        valid: true,
        info: { fileName, fileSize, width, height }
      };

    } catch {
      return {
        valid: false,
        error: "Link imagenya error bree.. Coba link yang lain yak"
      };
    }
  },

  async upscale(img, options = {}) {
    const validation = await this.getImageInfo(img);
    if (!validation.valid) {
      return {
        success: false,
        code: 400,
        result: { error: validation.error }
      };
    }

    const inputx = this.isValid(options.style, options.noise);
    if (!inputx.valid) {
      return {
        success: false,
        code: 400,
        result: { error: inputx.error }
      };
    }

    const config = {
      x2: '2',
      style: inputx.style,
      noise: inputx.noise,
      file_name: validation.info.fileName,
      files_size: validation.info.fileSize,
      file_height: validation.info.height,
      file_width: validation.info.width,
      input: img
    };

    try {
      const params = new URLSearchParams();
      params.append('conf', JSON.stringify(config));

      const taskx = await axios.post(
        this.api.base + this.api.endpoint.task,
        params,
        { headers: this.headers }
      );

      if (taskx.data.status !== 'ok') {
        return {
          success: false,
          code: 400,
          result: { error: "Gagal generate task" }
        };
      }

      const taskId = taskx.data.info;
      let attempts = 0;

      while (attempts < 20) {
        const res = await axios.get(
          this.api.base + this.api.endpoint.free + `?fids=${JSON.stringify([taskId])}`,
          { headers: this.headers }
        );

        const result = res.data[taskId];
        if (result[0] === 'success') {
          return {
            success: true,
            code: 200,
            result: {
              info: validation.info,
              url: result[1],
              size: result[2],
              config: {
                style: config.style,
                styleName: this.available.styles[config.style],
                noise: config.noise,
                noiseName: this.available.noise[config.noise]
              }
            }
          };
        } else if (result[0] === 'error') {
          return {
            success: false,
            code: 400,
            result: { error: "Upscale gagal bree." }
          };
        }

        await new Promise(resolve => setTimeout(resolve, 15000));
        attempts++;
      }

      return {
        success: false,
        code: 400,
        result: { error: "Timeout bree.." }
      };

    } catch (err) {
      return {
        success: false,
        code: 400,
        result: { error: err.message || "Upscale error" }
      };
    }
  }
};

export default bigjpg;
