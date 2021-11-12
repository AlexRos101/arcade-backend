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
    SUCCESS: 1,
    FAILED: 0,
    NOT_REGISTERED_WALLET_ADDRESS: 100,
    INSUFFICIANT_BALANCE: 101,
    INVALID_PARAMETERS: 102,
    NOT_INITIALIZED: 103,
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
};
