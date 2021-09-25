var async = require('async');
var config = require('./common/config');
var database_manager = require('./manager/database_manager');
const erc721_decoder = require('abi-decoder');
const erc721_abi = require('./contracts/ERC721.json');
const exchange_decoder = require('abi-decoder');
const exchange_abi = require('./contracts/EXCHANGE.json');
var CONST = require('./common/constants');
const axios = require('axios');
var Web3 = require('web3');

erc721_decoder.addABI(erc721_abi);
exchange_decoder.addABI(exchange_abi);

async function sync_blocks() {
    await sync_nft_blocks();
    await sync_exchange_blocks();

    setTimeout(function() {
        sync_blocks();
    }, config.service_delay);
}

async function sync_nft_blocks() {
    console.log("Sycnronizing NFT blocks");

    var block_number = await database_manager.get_sync_block_number(CONST.CONTRACT_TYPE.NFT);

    var history_url = config.history_url;
    history_url = history_url.replace('CONTRACT_ADDRESS', config.contract_nft);
    history_url = history_url.replace('START_BLOCK', (block_number + 1) + '');

    var history_data = null;
    try {
        history_data = await axios.get(history_url);
    } catch (err) {
        console.log(err);
        return;
    }

    var transactions = history_data.data.result;

    try {
        for (var j = 0; j < transactions.length; j++) {
            var transaction = transactions[j];
    
            if (transaction.isError == '1') continue;
    
            const decodedData = erc721_decoder.decodeMethod(transaction.input);
    
            if (decodedData == null) continue;
    
            var result = true;
    
            switch(decodedData.name) {
                case CONST.ERC721_FUNCTION_NAME.MINT:
                    var token_info = JSON.parse(decodedData.params[2].value);
                    var token = {
                        game_id: token_info.game_id,
                        category_id: token_info.category_id,
                        contract_address: config.contract_nft,
                        token_id: decodedData.params[0].value,
                        name: token_info.name,
                        description: token_info.description,
                        attach_url: decodedData.params[1].value,
                        owner: transaction.from,
                        arcadedoge_price: token_info.arcadedoge_price
                    }
    
                    if (!await database_manager.mint_token(token, transaction.blockNumber)) {
                        result = false;
                    }
                    break;
                case CONST.ERC721_FUNCTION_NAME.BURN:    
                    if (!await database_manager.bunr_token(config.contract_nft, decodedData.params[0].value, transaction.blockNumber)) {
                        result = false;
                    }
                    break;
                case CONST.ERC721_FUNCTION_NAME.TRANSFER_FROM:
                case CONST.ERC721_FUNCTION_NAME.SAFE_TRANSFER_FROM:   
                    if (!await database_manager.transfer_token(
                        config.contract_nft, 
                        decodedData.params[2].value, 
                        Web3.utils.toChecksumAddress(decodedData.params[0].value), 
                        Web3.utils.toChecksumAddress(decodedData.params[1].value), 
                        transaction.blockNumber)
                    ) {
                        result = false;
                    }
                    break;
                default:
                    result = true;
                    break;
            }
    
            if (result == false) throw new Error('Synchronizing failed. TxHash: ' + transaction.hash);
        }
    } catch (err) {
        console.log(err);
    }

    console.log("Synchronizing NFT blocks completed.");
}

async function sync_exchange_blocks() {
    console.log("Sycnronizing Exchange blocks.");

    var sync_block_number = await database_manager.get_sync_block_number(CONST.CONTRACT_TYPE.EXCHANGE);

    var history_url = config.history_url;
    history_url = history_url.replace('CONTRACT_ADDRESS', config.contract_exchange);
    history_url = history_url.replace('START_BLOCK', (sync_block_number + 1) + '');

    var history_data = null;
    try {
        history_data = await axios.get(history_url);
    } catch (err) {
        console.log(err);
        return;
    }

    var transactions = history_data.data.result;

    try {
        for (var j = 0; j < transactions.length; j++) {
            var transaction = transactions[j];
    
            if (transaction.isError == '1') continue;
    
            const decodedData = exchange_decoder.decodeMethod(transaction.input);
    
            if (decodedData == null) continue;
    
            var result = false;
    
            switch(decodedData.name) {
                case CONST.EXCHANGE_FUNCTION_NAME.SELL_REQUEST:
                    if (!(await database_manager.sell_token(
                        decodedData.params[0].value, 
                        decodedData.params[1].value, 
                        Web3.util.fromWei(decodedData.params[2].value + '', 'ether'), 
                        transaction.blockNumber))
                    ) {
                        result = false;
                    }
                    break;
                case CONST.EXCHANGE_FUNCTION_NAME.CANCEL_SELL_REQUEST:
                    if (!(await database_manager.cancel_sell_token(
                        decodedData.params[0].value, 
                        decodedData.params[1].value, 
                        0, 
                        transaction.blockNumber))
                    ) {
                        result = false;
                    }
                    break;
                case CONST.EXCHANGE_FUNCTION_NAME.EXCHANGE:
                    if (!(await database_manager.exchange_token(
                        decodedData.params[0].value, 
                        decodedData.params[1].value, 
                        Web3.utils.toChecksumAddress(decodedData.params[2].value), 
                        config.contract_arcadedoge, 
                        Web3.util.fromWei(decodedData.params[3].value + '', 'ether'),
                        Web3.utils.toChecksumAddress(decodedData.params[4].value)))
                    ) {
                        result = false;
                    }
                    break;
                case CONST.EXCHANGE_FUNCTION_NAME.EXCHANGE_BUSD:
                    if (!(await database_manager.exchange_token(
                        decodedData.params[0].value, 
                        decodedData.params[1].value, 
                        Web3.utils.toChecksumAddress(decodedData.params[2].value), 
                        config.contract_busd, 
                        Web3.util.fromWei(decodedData.params[3].value + '', 'ether'),
                        Web3.utils.toChecksumAddress(decodedData.params[4].value)))
                    ) {
                        result = false;
                    }
                    break;
                default:
                    result = true;
                    break;
            }
    
            if (result == false) throw new Error('Synchronizing failed. TxHash: ' + transaction.hash);
        }
    } catch (err) {
        console.log(err);
    }

    console.log("Sycnronizing Exchange blocks completed.");
}

module.exports = sync_blocks;