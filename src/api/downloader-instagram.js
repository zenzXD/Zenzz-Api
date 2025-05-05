const axios = require("axios");
const crypto = require("crypto");

async function timex() {
    try {
        const { data } = await axios.get("https://igram.world/msec");
        return Math.floor(data.msec * 1000);
    } catch (error) {
        console.error("Error fetching time:", error);
        return Date.now(); // fallback
    }
}

async function generateSignature(url, time, secretKey) {
    const hashString = `${url}${time}${secretKey}`;
    const hash = crypto.createHash("sha256").update(hashString).digest("hex");
    return hash;
}

async function igram(url) {
    const secretKey = "40a71e771b673e3a35200acdd331bbd616fc4ba76c6d77d821a25985e46fb488";
    const time = await timex();
    const signature = await generateSignature(url, time, secretKey);

    const requestData = {
        url,
        ts: time,
        _ts: time,
        _tsc: 0,
        _s: signature
    };

    const headers = {
        "Accept": "application/json, text/plain, */*",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Referer": "https://igram.world/",
        "Origin": "https://igram.world",
        "authority": "igram.world"
    };

    try {
        const res = await axios.post("https://api.igram.world/api/convert", requestData, { headers });
        return res.data;
    } catch (err) {
        console.error("Error scraping:", err.response?.data || err.message);
        return {
            error: true,
            message: err.response?.data || err.message
        };
    }
}
