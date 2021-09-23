var config = {
    port_number: 4000,
    auth_token_id: 'cKeD8oqwGgYxNai7ELju',
    
    provider_url: 'https://data-seed-prebsc-1-s1.binance.org:8545',

    contract_nftfi: '0xC1E86dFd658bA68898dA654942403f211c734C0E',
    
    avatar_path: "D:\\xampp\\htdocs\\nftfi\\avatars\\",
    project_path: "D:\\xampp\\htdocs\\nftfi\\projects\\",

    service_delay: 5000,

    history_url: 'https://api-testnet.bscscan.com/api?module=account&action=txlist&address=CONTRACT_ADDRESS&startblock=START_BLOCK&endblock=99999999&sort=asc&apikey=36XTKGWV92Q7B9FEKMRJRXQH5UBG3C2ANE',

    contract_wbnb: '0x83A689C22059C5fAc116C5E10dc90F4531BCa86E',
    contract_dai: '0xb8b5cf886B9f26f489d10a1C49596f5E9B4E452d'
}

module.exports = config;