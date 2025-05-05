const axios = require("axios");
const https = require("node:https");
const fake = require("fake-useragent");
const crypto = require("node:crypto");

const MSEC = "https://igram.world/msec";
const USER_INFO = "https://api-wh.igram.world/api/v1/instagram/userInfo";
const POST = "https://api-wh.igram.world/api/v1/instagram/posts";
const URL_STORY = "https://api-wh.igram.world/api/v1/instagram/stories"
const URL_HIGHLIGHT = "https://api-wh.igram.world/api/v1/instagram/highlights"
const URL_CONVERT = "https://api.igram.world/api/convert"

const SECRECT_KEY = "3526501d956b1c95459de077386711c0529330544d2d57ad6781cc33fa03c7a3";
const FIXED_TIMESTAMP = 1740129810449;

const agent = https.Agent({
  keepAlive: true,
  rejectUnauthorized: false
})

let headersList = {
  "authority": "igram.world",
  "accept": "*/*",
  "accept-encoding": "gzip, deflate, br, zstd",
  "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7,ru;q=0.6",
  "cache-control": "no-cache",
  "pragma": "no-cache",
  "priority": "u=1, i",
  "referer": "https://igram.world/",
  "sec-ch-ua": '"Not(A:Brand";v="99", "Google Chrome";v="133", "Chromium";v="133"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-origin",
  "user-agent": fake()
  // "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36"
}

function _delay(msec) {
  return new Promise(resolve => setTimeout(resolve, msec));
}

async function _req({ url, method = "GET", data = null, params = null, head = null, response = "json" }) {
  try {
    var headers = {};
    var param;
    var datas;

    if (head && head == "original" || head == "ori") {
      const uri = new URL(url);
      headers = {
        authority: uri.hostname,
        origin: "https://" + uri.hostname,
        'Cache-Control': 'no-cache',
        "user-agent": fake()
      }
    } else if (head && typeof head == "object") {
      headers = head;
    }
    if (params && typeof params == "object") {
      param = params;
    } else {
      param = "";
    }
    if (data) {
      datas = data
    } else {
      datas = "";
    }

    const options = {
      url: url,
      method: method,
      headers,
      timeout: 30_000,
      responseType: response,
      httpsAgent: agent,
      validateStatus: (status) => {
        return status <= 500;
      },
      ...(!datas ? {} : { data: datas }),
      ...(!params ? {} : { params: param })
    }
    const res = await axios.request(options);

    return res;
  } catch (error) {
    console.log(error)
  }
}

function _sort(p116) {
  return Object.keys(p116).sort().reduce(function (p117, p118) {
    p117[p118] = p116[p118];
    return p117;
  }, {});
}

async function _getSignature(payload) {
  const rs = await _req({
    url: MSEC,
    head: headersList
  })
  const { msec } = rs.data

  let v93 = 0;
  v93 = Math.floor(msec * 1000);

  let v97 = v93 ? Date.now() - v93 : 0;
  if (Math.abs(v97) < 60000) {
    v97 = 0;
  }

  const v98 = Date.now() - v97;

  const dig = `${typeof payload == "string" ? payload : JSON.stringify(_sort(payload))}${v98}${SECRECT_KEY}`;
  let v90 = new TextEncoder().encode(dig);
  const v91 = await crypto.subtle.digest("SHA-256", v90);
  const v92 = Array.from(new Uint8Array(v91));
  const s = v92.map(function (p115) {
    return p115.toString(16).padStart(2, "0");
  }).join("")

  return {
    ts: v98,
    _ts: FIXED_TIMESTAMP,
    _tsc: v97,
    _s: s
  }
}

function _getUsername(link) {
  let username = /https\:\/\/|http\:\/\//i.test(link) ? new URL(link) : link;
  if (username instanceof URL) {
    username = username.pathname.replace(/\//gi, "");
  }

  return username;
}

async function GetInfo(url) {
  const username = _getUsername(url);
  const payload = {
    username
  }

  const sign = await _getSignature(payload);
  const res = await _req({
    url: USER_INFO,
    method: "POST",
    data: {
      username,
      ...sign
    },
    head: headersList
  });
  return res.data;
}

async function GetPosts(url) {
  const username = _getUsername(url);
  const payload = {
    maxId: "",
    username
  }

  const sign = await _getSignature(payload);
  const res = await _req({
    url: POST,
    method: "POST",
    data: {
      ...payload,
      ...sign
    },
    head: headersList
  });
  return res.data;
}

async function GetStories(url) {
  const username = _getUsername(url);
  const payload = {
    username
  }

  const sign = await _getSignature(payload);
  const res = await _req({
    url: URL_STORY,
    method: "POST",
    data: {
      ...payload,
      ...sign
    },
    head: headersList
  });
  return res.data;
}

async function GetHighlights(url) {
  const info = await GetInfo(url);
  const payload = {
    userId: info?.result?.[0]?.user?.id
  }

  const sign = await _getSignature(payload);
  const res = await _req({
    url: URL_HIGHLIGHT,
    method: "POST",
    data: {
      ...payload,
      ...sign
    },
    head: headersList
  });
  return res.data;
}

async function Download(url) {
  const payload = url

  const sign = await _getSignature(payload);
  const pay = {
    url,
    ...sign
  }
  const res = await _req({
    url: URL_CONVERT,
    method: "POST",
    data: pay,
    head: headersList
  });
  return res.data;
}

/**
 * Contoh penggunaan
 */
(async () => {
  const LINK = "dea.afrizal";

  const result = await GetInfo(LINK)
  console.log(result)

  const result2 = await GetPosts(LINK)
  console.log(result2)

  const result3 = await GetStories(LINK)
  console.log(result3)

  const result4 = await GetHighlights(LINK)
  console.log(result4)
  
  const VIDEO = "https://www.instagram.com/reel/DFt_ud3ygZX/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==";
  const result5 = await Download(VIDEO)
  console.log(result5)
})()

module.exports = {
  GetInfo,
  GetPosts,
  GetStories,
  GetHighlights,
  Download
}
