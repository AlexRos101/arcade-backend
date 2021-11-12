const { reject } = require('async');
const FormData = require('form-data');
const config = require('../common/config');

function sendPost (requestUrl, params) {
    const axios = require('axios');

    return new Promise((resolve, reject) => {
        axios({
            method: 'post',
            url: config.gameBackendUrl + requestUrl,
            data: params,
            headers: { 'Content-Type': 'application/json' }
        })
        .then((response) => {
            resolve(response.data);
        })
        .catch((error) => {
            reject(error);
        });
    });
}

function verifySwapRequest(address, amount) {
    // let formData = new FormData();
    // formData.append('address', address);
    // formData.append('amount', amount);
    
    return new Promise((resolve, reject) => {
        sendPost(
            '/verify/swap-game-point',
            {
                address: address,
                amount: amount
            }
        )
        .then((res) => {
            resolve(res);
        })
        .catch((err) => {
            reject(err);
        })
    });
}

module.exports = {
    verifySwapRequest
}