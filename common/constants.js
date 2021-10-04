let ERC721_FUNCTION_NAME = {
    MINT: 'mint',
    BURN: 'burn',
    SAFE_TRANSFER_FROM: 'safeTransferFrom',
    TRANSFER_FROM: 'transferFrom',
};

let EXCHANGE_FUNCTION_NAME = {
    SELL_REQUEST: 'SellRequest',
    CANCEL_SELL_REQUEST: 'CancelSellRequest',
    EXCHANGE: 'exchange',
    EXCHANGE_BUSD: 'exchangeBUSD',
};

let ANONYMOUS_TYPE = {
    NONE: 0,
    ANONYMOUS: 1,
};

let VISIBILITY_STATUS = {
    HIDDEN: 0,
    SHOW: 1,
};

let BURN_STATUS = {
    NONE: 0,
    BURNT: 1,
};

let TX_TYPE = {
    NONE: 0,
    MINT: 1,
    EXCHANGE: 2,
    BUNRT: 3,
    TRANSFER: 4,
};

let CONTRACT_TYPE = {
    NFT: 1,
    EXCHANGE: 2,
};

let SORT_TYPE = {
    RECENT: 1,
    PRICE_HIGH_LOW: 2,
    PRICE_LOW_HIGH: 3,
    POPULAR: 4,
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
};
