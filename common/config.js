const config = {
    port_number: 4000,

    contract_exchange: '0x2b02690Cdc6442A2A6c04C52659B9e996C85eAe3',
    contract_nft: '0x2BE5E405dD3a74e293eBa1cbbc9a8577fd2257B6',

    material_path: '/var/www/html/arcadedoge/materials/',
    thumbnail_path: '/var/www/html/arcadedoge/thumbnails/',
    temp_path: '/var/www/html/arcadedoge/temp/',

    service_delay: 5000,

    history_url:
        'https://api-testnet.bscscan.com/api?module=account&action=txlist&address=CONTRACT_ADDRESS&startblock=START_BLOCK&endblock=99999999&sort=asc&apikey=36XTKGWV92Q7B9FEKMRJRXQH5UBG3C2ANE',

    contract_arcadedoge: '0xEA071968Faf66BE3cc424102fE9DE2F63BBCD12D',
    contract_busd: '0x8301f2213c0eed49a7e28ae4c3e91722919b8b47',
};

module.exports = config;
