const ERC721_FUNCTION_NAME = {
    MINT: 'mint',
    BURN: 'burn',
    SAFE_TRANSFER_FROM: 'safeTransferFrom',
    TRANSFER_FROM: 'transferFrom',
};

const EXCHANGE_FUNCTION_NAME = {
    SELL_REQUEST: 'SellRequest',
    CANCEL_SELL_REQUEST: 'CancelSellRequest',
    EXCHANGE: 'exchange',
    EXCHANGE_BUSD: 'exchangeBUSD',
};

const ANONYMOUS_TYPE = {
    NONE: 0,
    ANONYMOUS: 1,
};

const VISIBILITY_STATUS = {
    HIDDEN: 0,
    SHOW: 1,
};

const BURN_STATUS = {
    NONE: 0,
    BURNT: 1,
};

const TX_TYPE = {
    NONE: 0,
    MINT: 1,
    EXCHANGE: 2,
    BUNRT: 3,
    TRANSFER: 4,
};

const CONTRACT_TYPE = {
    NFT: 1,
    EXCHANGE: 2,
    SWAP: 3,
};

const SORT_TYPE = {
    RECENT: 1,
    PRICE_HIGH_LOW: 2,
    PRICE_LOW_HIGH: 3,
    POPULAR: 4,
};

const MYSQL_ERR_NO = {
    CONNECTION_ERROR: -4078,
};

const RET_CODE = {
    SUCCESS: 0,
    FAILED: 1,
    NOT_REGISTERED_WALLET_ADDRESS: 100,
    INSUFFICIANT_BALANCE: 101,
    INVALID_PARAMETERS: 102,
    NOT_INITIALIZED: 103,
};

const SWAP_EVENT_TYPE = {
    BUY_GAME_POINT:
        '0x4725e36791a1c871eb97da1e96d3071e41c7a9dd27c51d489bef604d114d11a2',
    SELL_GAME_POINT:
        '0x8b9e103600fd30f68595f82fb3c9af8a84ed316d3910137f229ebb8ad210c9a7',
};

const SWAP_TYPE = {
    DEPOSIT: 5,
    WITHDRAW: 6,
};

const GAME_RET_CODE = {
    SUCCESS: 0,
    FAILED: 1,
    INVALID_PARAMETERS: 102,
};

module.exports = {
    ERC721_FUNCTION_NAME,
    EXCHANGE_FUNCTION_NAME,
    ANONYMOUS_TYPE,
    VISIBILITY_STATUS,
    BURN_STATUS,
    TX_TYPE,
    CONTRACT_TYPE,
    SORT_TYPE,
    MYSQL_ERR_NO,
    RET_CODE,
    SWAP_EVENT_TYPE,
    SWAP_TYPE,
    GAME_RET_CODE,
};
