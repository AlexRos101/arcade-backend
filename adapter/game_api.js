const config = require('../common/config');

async function sendPost (requestUrl, params) {
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    }

    var response = 
        await fetch(config.gameBackendUrl + requestUrl, requestOptions);
    return response.json();
}

export async function verifySwapRequest(address, amount) {
    const response = await sendPost(
        'verify/swap-game-point',
        {
            address: address,
            amount: amount
        }
    );

    return response;
}