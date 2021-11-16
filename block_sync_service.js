const erc721Decoder = require('abi-decoder');
const exchangeDecoder = require('abi-decoder');
const axios = require('axios');
const Web3 = require('web3');
const config = require('./common/config');
const databaseManager = require('./manager/database_manager');
const erc721ABI = require('./contracts/ERC721.json');
const exchangeABI = require('./contracts/EXCHANGE.json');
const CONST = require('./common/constants');

erc721Decoder.addABI(erc721ABI);
exchangeDecoder.addABI(exchangeABI);

async function syncNFTBlocks() {
    console.log('Sycnronizing NFT blocks');

    const blockNumber = await databaseManager.getSyncBlockNumber(
        CONST.CONTRACT_TYPE.NFT
    );

    let { historyURL } = config;
    historyURL = historyURL.replace('CONTRACT_ADDRESS', config.contractNFT);
    historyURL = historyURL.replace('START_BLOCK', `${blockNumber + 1}`);

    let historyData = null;
    try {
        historyData = await axios.get(historyURL);
    } catch (err) {
        console.log(err);
        return;
    }

    const transactions = historyData.data.result;

    try {
        for (let j = 0; j < transactions.length; j++) {
            const transaction = transactions[j];

            if (transaction.isError === '1') {
                if (transaction.isError === '1') {
                    if (
                        !(await databaseManager.updateOtherSyncBlockNumber(
                            CONST.CONTRACT_TYPE.NFT,
                            transaction.blockNumber
                        ))
                    ) {
                        throw new Error(
                            `Synchronizing failed. TxHash: ${transaction.hash}`
                        );
                    }
                    continue;
                }
            }

            const decodedData = erc721Decoder.decodeMethod(transaction.input);

            if (decodedData == null) {
                continue;
            }

            let result = true;
            let tokenInfo = null;
            let token = null;

            switch (decodedData.name) {
                case CONST.ERC721_FUNCTION_NAME.MINT:
                    tokenInfo = JSON.parse(decodedData.params[2].value);
                    token = {
                        game_id: tokenInfo.game_id,
                        category_id: tokenInfo.category_id,
                        contract_address: config.contractNFT,
                        token_id: decodedData.params[0].value,
                        name: tokenInfo.name,
                        description: tokenInfo.description,
                        attach_url: decodedData.params[1].value,
                        owner: Web3.utils.toChecksumAddress(transaction.from),
                        arcadedoge_price: tokenInfo.arcadedoge_price,
                        is_anonymous: tokenInfo.is_anonymous,
                    };

                    if (
                        !(await databaseManager.mintToken(
                            token,
                            transaction.hash,
                            transaction.blockNumber,
                            transaction.timeStamp
                        ))
                    ) {
                        result = false;
                    }
                    break;
                case CONST.ERC721_FUNCTION_NAME.BURN:
                    if (
                        !(await databaseManager.burnToken(
                            config.contractNFT,
                            decodedData.params[0].value,
                            transaction.hash,
                            transaction.blockNumber,
                            transaction.timeStamp
                        ))
                    ) {
                        result = false;
                    }
                    break;
                case CONST.ERC721_FUNCTION_NAME.TRANSFER_FROM:
                case CONST.ERC721_FUNCTION_NAME.SAFE_TRANSFER_FROM:
                    if (
                        !(await databaseManager.transferToken(
                            config.contractNFT,
                            decodedData.params[2].value,
                            Web3.utils.toChecksumAddress(
                                decodedData.params[0].value
                            ),
                            Web3.utils.toChecksumAddress(
                                decodedData.params[1].value
                            ),
                            transaction.hash,
                            transaction.blockNumber,
                            transaction.timeStamp
                        ))
                    ) {
                        result = false;
                    }
                    break;
                default:
                    if (
                        !(await databaseManager.updateOtherSyncBlockNumber(
                            CONST.CONTRACT_TYPE.NFT,
                            transaction.blockNumber
                        ))
                    ) {
                        result = false;
                    }
                    break;
            }

            if (result === false) {
                throw new Error(
                    `Synchronizing failed. TxHash: ${transaction.hash}`
                );
            }
        }
    } catch (err) {
        console.log(err);
    }

    console.log('Synchronizing NFT blocks completed.');
}

async function syncExchangeBlocks() {
    console.log('Sycnronizing Exchange blocks.');

    const blockNumber = await databaseManager.getSyncBlockNumber(
        CONST.CONTRACT_TYPE.EXCHANGE
    );

    let { historyURL } = config;
    historyURL = historyURL.replace(
        'CONTRACT_ADDRESS',
        config.contractExchange
    );
    historyURL = historyURL.replace('START_BLOCK', `${blockNumber + 1}`);

    let historyData = null;
    try {
        historyData = await axios.get(historyURL);
    } catch (err) {
        console.log(err);
        return;
    }

    const transactions = historyData.data.result;

    try {
        for (let j = 0; j < transactions.length; j++) {
            const transaction = transactions[j];

            if (transaction.isError === '1') {
                if (
                    !(await databaseManager.updateOtherSyncBlockNumber(
                        CONST.CONTRACT_TYPE.EXCHANGE,
                        transaction.blockNumber
                    ))
                ) {
                    throw new Error(
                        `Synchronizing failed. TxHash: ${transaction.hash}`
                    );
                }
                continue;
            }

            const decodedData = exchangeDecoder.decodeMethod(transaction.input);

            if (decodedData == null) continue;

            let result = true;

            switch (decodedData.name) {
                case CONST.EXCHANGE_FUNCTION_NAME.SELL_REQUEST:
                    if (
                        !(await databaseManager.sellToken(
                            decodedData.params[0].value,
                            decodedData.params[1].value,
                            Web3.utils.fromWei(
                                `${decodedData.params[2].value}`,
                                'ether'
                            ),
                            transaction.blockNumber
                        ))
                    ) {
                        result = false;
                    }
                    break;
                case CONST.EXCHANGE_FUNCTION_NAME.CANCEL_SELL_REQUEST:
                    if (
                        !(await databaseManager.cancelSellToken(
                            decodedData.params[0].value,
                            decodedData.params[1].value,
                            transaction.blockNumber
                        ))
                    ) {
                        result = false;
                    }
                    break;
                case CONST.EXCHANGE_FUNCTION_NAME.EXCHANGE:
                    if (
                        !(await databaseManager.exchangeToken(
                            decodedData.params[0].value,
                            decodedData.params[1].value,
                            Web3.utils.toChecksumAddress(
                                decodedData.params[2].value
                            ),
                            config.contractArcadeDoge,
                            Web3.utils.fromWei(
                                `${decodedData.params[3].value}`,
                                'ether'
                            ),
                            Web3.utils.toChecksumAddress(
                                decodedData.params[4].value
                            ),
                            transaction.hash,
                            transaction.blockNumber,
                            transaction.timeStamp
                        ))
                    ) {
                        result = false;
                    }
                    break;
                case CONST.EXCHANGE_FUNCTION_NAME.EXCHANGE_BUSD:
                    if (
                        !(await databaseManager.exchangeToken(
                            decodedData.params[0].value,
                            decodedData.params[1].value,
                            Web3.utils.toChecksumAddress(
                                decodedData.params[2].value
                            ),
                            config.contractBUSD,
                            Web3.utils.fromWei(
                                `${decodedData.params[3].value}`,
                                'ether'
                            ),
                            Web3.utils.toChecksumAddress(
                                decodedData.params[4].value
                            ),
                            transaction.hash,
                            transaction.blockNumber,
                            transaction.timeStamp
                        ))
                    ) {
                        result = false;
                    }
                    break;
                default:
                    if (
                        !(await databaseManager.updateOtherSyncBlockNumber(
                            CONST.CONTRACT_TYPE.EXCHANGE,
                            transaction.blockNumber
                        ))
                    ) {
                        result = false;
                    }
                    break;
            }

            if (result === false) {
                throw new Error(
                    `Synchronizing failed. TxHash: ${transaction.hash}`
                );
            }
        }
    } catch (err) {
        console.log(err);
    }

    console.log('Sycnronizing Exchange blocks completed.');
}

async function syncSwapBlocks() {
    console.log('Sycnronizing Swap blocks');

    const blockNumber = await databaseManager.getSyncBlockNumber(
        CONST.CONTRACT_TYPE.SWAP
    );

    let { eventURL } = config;
    eventURL = eventURL.replace('CONTRACT_ADDRESS', config.contractSwap);
    eventURL = eventURL.replace('START_BLOCK', `${blockNumber + 1}`);

    let eventData = null;
    try {
        eventData = await axios.get(eventURL);
    } catch (err) {
        console.log(err);
        return;
    }

    if (eventData.data.status !== '1') return;

    const events = eventData.data.result;

    try {
        for (let j = 0; j < events.length; j++) {
            const event = events[j];

            const web3 = new Web3(config.bscProviderUrl);

            const tx = await web3.eth.getTransaction(event.transactionHash);
            const address = Web3.utils.toChecksumAddress(tx.from);

            let result = true;

            let id = 0;
            let tokenAmount = 0;
            let gamePointAmount = 0;
            switch (event.topics[0]) {
                case CONST.SWAP_EVENT_TYPE.BUY_GAME_POINT:
                    id = parseInt(event.topics[1], 16);
                    tokenAmount = Web3.utils.fromWei(
                        /* eslint-disable-next-line */
                        `${BigInt(event.topics[2]).toString(10)}`,
                        'ether'
                    );
                    gamePointAmount = parseInt(event.topics[3], 16);

                    result = await databaseManager.buyGamePoint(
                        id,
                        Web3.utils.toChecksumAddress(address),
                        tokenAmount,
                        gamePointAmount,
                        event.transactionHash,
                        /* eslint-disable-next-line */
                        BigInt(event.timeStamp),
                        /* eslint-disable-next-line */
                        BigInt(event.blockNumber)
                    );
                    break;
                case CONST.SWAP_EVENT_TYPE.SELL_GAME_POINT:
                    id = parseInt(event.topics[1], 16);
                    tokenAmount = Web3.utils.fromWei(
                        /* eslint-disable-next-line */
                        `${BigInt(event.topics[2]).toString(10)}`,
                        'ether'
                    );
                    gamePointAmount = parseInt(event.topics[3], 16);

                    result = await databaseManager.sellGamePoint(
                        id,
                        Web3.utils.toChecksumAddress(address),
                        tokenAmount,
                        gamePointAmount,
                        event.transactionHash,
                        /* eslint-disable-next-line */
                        BigInt(event.timeStamp),
                        /* eslint-disable-next-line */
                        BigInt(event.blockNumber)
                    );
                    break;
                default:
                    if (
                        !(await databaseManager.updateOtherSyncBlockNumber(
                            CONST.CONTRACT_TYPE.SWAP,
                            /* eslint-disable-next-line */
                            BigInt(event.blockNumber)
                        ))
                    ) {
                        result = false;
                    }
                    break;
            }

            if (result === false) {
                throw new Error(
                    `Synchronizing failed. TxHash: ${event.transactionHash}`
                );
            }
        }
    } catch (err) {
        console.log(err);
    }

    console.log('Synchronizing Swap blocks completed.');
}

async function syncBlocks() {
    await syncNFTBlocks();
    await syncExchangeBlocks();
    await syncSwapBlocks();

    setTimeout(() => {
        syncBlocks();
    }, config.serviceDelay);
}

module.exports = syncBlocks;
