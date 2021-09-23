var async = require('async');
var config = require('./common/config');
var database_manager = require('./manager/database_manager');
var Web3 = require('web3');
const erc721_decoder = require('abi-decoder');
const erc721_abi = require('./contracts/ERC721.json');
const nftfi_decoder = require('abi-decoder');
const nftfi_abi = require('./contracts/NFTfi.json');
var CONST = require('./common/constants');
const axios = require('axios');

erc721_decoder.addABI(erc721_abi);
nftfi_decoder.addABI(nftfi_abi);

async function sync_blocks() {
    await sync_nft_blocks();
    await sync_nftfi_blocks();

    setTimeout(function() {
        sync_blocks();
    }, config.service_delay);
}

async function sync_nft_blocks() {
    console.log("Sycnronizing NFT blocks");

    var contract_lists = await database_manager.get_contract_list();

    for (var i = 0; i < contract_lists.length; i++) {
        var contract = contract_lists[i];

        var history_url = config.history_url;
        history_url = history_url.replace('CONTRACT_ADDRESS', contract.address);
        history_url = history_url.replace('START_BLOCK', (contract.sync_block_number + 1) + '');

        var history_data = null;
        try {
            history_data = await axios.get(history_url);
        } catch (err) {
            console.log(err);
            continue;
        }

        var transactions = history_data.data.result;

        var token_cnt = 0;

        for (var j = 0; j < transactions.length; j++) {
            var transaction = transactions[j];

            if (transaction.isError == '1') continue;

            const decodedData = erc721_decoder.decodeMethod(transaction.input);

            if (decodedData == null) continue;

            var result = true;

            switch(decodedData.name) {
                case CONST.ERC721_FUNCTION_NAME.MINT:
                    if (! await database_manager.process_nft_mint_tx(
                        contract.id, 
                        decodedData.params[1].value, 
                        decodedData.params[0].value, 
                        contract.project_id, 
                        transaction.blockNumber)
                    ) {
                        result = false;
                    }
                    break;
                case CONST.ERC721_FUNCTION_NAME.TRANSFER_FROM:
                    if (! await database_manager.process_nft_transfer_tx(
                        contract.id, 
                        decodedData.params[2].value, 
                        decodedData.params[0].value, 
                        decodedData.params[1].value,
                        transaction.blockNumber)
                    ) {
                        result = false;
                    }
                    break;
                case CONST.ERC721_FUNCTION_NAME.SAFE_TRANSFER_FROM:
                    if (! await database_manager.process_nft_transfer_tx(
                        contract.id, 
                        decodedData.params[2].value, 
                        decodedData.params[0].value, 
                        decodedData.params[1].value,
                        transaction.blockNumber)
                    ) {
                        result = false;
                    }
                    break;
                case CONST.ERC721_FUNCTION_NAME.BURN:
                    await database_manager.burn_token(contract.id, decodedData.params[0].value);
                    await database_manager.decrease_user_token_cnt(tx_data.from);
                    token_cnt--;
                    if (! await database_manager.process_nft_burn_tx(
                        contract.id,
                        decodedData.params[0].value,
                        tx_data.from,
                        contract.project_id,
                        transaction.blockNumber
                    )) {
                        result = false;
                    }
                    break;
            }

            if (result == false) break;
        }
    }

    console.log("Sycnronizing NFT blocks completed.");
}

async function sync_nftfi_blocks() {
    console.log("Sycnronizing NFTFI blocks.");

    var nftfi_sync_block_number = await database_manager.get_nftfi_sync_block();

    var history_url = config.history_url;
    history_url = history_url.replace('CONTRACT_ADDRESS', config.contract_nftfi);
    history_url = history_url.replace('START_BLOCK', (nftfi_sync_block_number + 1) + '');

    var history_data = null;
    try {
        history_data = await axios.get(history_url);
    } catch (err) {
        console.log(err);
        return;
    }

    var transactions = history_data.data.result;

    for (var j = 0; j < transactions.length; j++) {
        var transaction = transactions[j];

        if (transaction.isError == '1') continue;

        const decodedData = nftfi_decoder.decodeMethod(transaction.input);

        if (decodedData == null) continue;

        switch(decodedData.name) {
            case CONST.NFTFI_FUNCTION_NAME.BEGIN_LOAN:
                var loan_id = decodedData.params[0].value;
                var contract_id = decodedData.params[8].value;
                var token_id = decodedData.params[3].value;
                var address = decodedData.params[10].value;
                var asset_id = decodedData.params[9].value;
                var owner = transaction.from;

                if (!await database_manager.process_begin_loan_tx(contract_id, token_id, loan_id, owner, address, asset_id, transaction.blockNumber)) return;
                break;
            case CONST.NFTFI_FUNCTION_NAME.PAY_BACK:
                var loan_id = decodedData.params[0].value;
                if (!await database_manager.process_pay_back_tx(loan_id, transaction.blockNumber)) return;
                break;
            case CONST.NFTFI_FUNCTION_NAME.OVER_DUE:
                var loan_id = decodedData.params[0].value;
                if (!await database_manager.process_over_due_tx(loan_id, transaction.blockNumber)) return;
                break;
            case CONST.NFTFI_FUNCTION_NAME.WHITELIST_CONTRACT:
                var contract_id = decodedData.params[0].value;
                var white_listed = decodedData.params[1].value;
                if (!await database_manager.process_white_list_tx(contract_id, white_listed == true? 1: 0, transaction.blockNumber)) return;
                break;
        }
    }

    console.log("Sycnronizing NFTFI blocks completed.");
}

module.exports = sync_blocks;