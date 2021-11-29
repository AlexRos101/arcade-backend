const config = {
    portNumber: 4000,

    contractExchange: '0x99a5ee00c06F2dc75765f45a941B8595E4d5e054',
    contractNFT: '0x70C1847626808DCFC914738e35Bf97AC3568916c',

    materialPath: '/var/www/html/arcadedoge/materials/',
    thumbnailPath: '/var/www/html/arcadedoge/thumbnails/',

    serviceDelay: 5000,

    historyURL:
        'https://api-testnet.bscscan.com/api?module=account&action=txlist&address=CONTRACT_ADDRESS&' +
        'startblock=START_BLOCK&endblock=99999999&sort=asc&apikey=36XTKGWV92Q7B9FEKMRJRXQH5UBG3C2ANE',

    contractArcadeDoge: '0xEA071968Faf66BE3cc424102fE9DE2F63BBCD12D',
    contractBUSD: '0x8301f2213c0eed49a7e28ae4c3e91722919b8b47',
    contractSwap: '0x6b1059D884BfCF47B92F76Bd84E1aCEa6ed6680B',

    backendKey: 'ArcadeDogeBackend',
    gameBackendUrl: 'http://localhost:4001',

    eventURL:
        'https://api-testnet.bscscan.com/api?module=logs&action=getLogs&fromBlock=START_BLOCK&toBlock=latest&' +
        'address=CONTRACT_ADDRESS',

    bscProviderUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
};

module.exports = config;
