var ERC721_FUNCTION_NAME = {
    TRANSFER_FROM: "transferFrom",
    MINT: 'mint',
    SAFE_TRANSFER_FROM: 'safeTransferFrom',
    BURN: 'burn'
}

var OFFER_STATUS = {
    PENDING: 0,
    ACCEPTED: 1,
    CANCELLED: 2,
    PAYED_BACK:3,
    OVER_DUE: 4
};

var NFTFI_FUNCTION_NAME = {
    BEGIN_LOAN: "beginLoan",
    PAY_BACK: 'payBackLoan',
    OVER_DUE: 'liquidateOverdueLoan',
    WHITELIST_CONTRACT: 'whitelistNFTContract'
}


module.exports = {
    ERC721_FUNCTION_NAME,
    OFFER_STATUS,
    NFTFI_FUNCTION_NAME
}