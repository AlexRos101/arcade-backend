var config = {
    port_number: 4000,

    contract_exchange: '0x871B8cD034E7017A1fBc84f11B71D63D30F4566A',
    contract_nft: '0xC4C1a600aCD436e363790e572E28306512C59ed7',
    
    material_path: "C:\\xampp\\htdocs\\arcadedoge\\materials\\",
    thumbnail_path: "C:\\xampp\\htdocs\\arcadedoge\\thumbnails\\",
    temp_path: "C:\\xampp\\htdocs\\arcadedoge\\temp\\",

    service_delay: 5000,

    history_url: 'https://api-testnet.bscscan.com/api?module=account&action=txlist&address=CONTRACT_ADDRESS&startblock=START_BLOCK&endblock=99999999&sort=asc&apikey=36XTKGWV92Q7B9FEKMRJRXQH5UBG3C2ANE',

    contract_arcadedoge: '0xEA071968Faf66BE3cc424102fE9DE2F63BBCD12D',
    contract_busd: '0x8301f2213c0eed49a7e28ae4c3e91722919b8b47'
}

module.exports = config;