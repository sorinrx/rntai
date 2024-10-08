require('dotenv').config(); // Load environment variables from .env file
const axios = require('axios');
const crypto = require('crypto');
const httpBuildQuery = require('http-build-query');

console.log('ZADARMA_API_USER_KEY:', process.env.ZADARMA_API_USER_KEY);
console.log('ZADARMA_API_SECRET_KEY:', process.env.ZADARMA_API_SECRET_KEY);

async function getRecordingLink(pbx_call_id) {
  try {
    if (!pbx_call_id) {
      throw new Error('pbx_call_id is required');
    }

    const api_user_key = process.env.ZADARMA_API_USER_KEY;
    const api_secret_key = process.env.ZADARMA_API_SECRET_KEY;

    if (!api_user_key || !api_secret_key) {
      throw new Error('API user key or secret key is not set in environment variables.');
    }

    const path = '/v1/pbx/record/request/';
    const params = { pbx_call_id: pbx_call_id };

    // Generate authentication header
    const authHeader = generateAuthHeader(api_user_key, api_secret_key, path, params);

    const url = `https://api.zadarma.com${path}?${httpBuildQuery(params)}`;

    const response = await axios.get(url, {
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      }
    });

    if (response.data.status === 'success') {
      if (response.data.link) {
        return response.data.link;
      } else if (response.data.links) {
        const mp3Link = response.data.links.find(link => link.endsWith('.mp3'));
        if (mp3Link) {
          return mp3Link;
        } else {
          return response.data.links[0];
        }
      } else {
        throw new Error('No link returned for recording');
      }
    } else {
      throw new Error(response.data.message || 'No link returned for recording');
    }
  } catch (error) {
    console.error('Error getting recording link:', error.message);
    if (error.response && error.response.status === 404) {
      console.error('Error: Recording not found. Please check the pbx_call_id.');
    }
  }
}

function generateAuthHeader(api_user_key, api_secret_key, path, params) {
  const qs = httpBuildQuery(params);
  const md5 = crypto.createHash('md5').update(qs).digest('hex');
  const data = path + qs + md5;
  const sha1 = crypto.createHmac('sha1', api_secret_key).update(data).digest('hex');
  const sign = Buffer.from(sha1).toString('base64');
  return `${api_user_key}:${sign}`;
}

module.exports = getRecordingLink;
