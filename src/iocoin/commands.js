module.exports = {
    addMultiSigAddress: 'addmultisigaddress',
    addNode: 'addnode', // bitcoind v0.8.0+
    backupWallet: 'backupwallet',
    createMultiSig: 'createmultisig',
    crawgen: 'crawgen', // bitcoind v0.7.0+
    createRawTransaction: 'createrawtransaction', // bitcoind v0.7.0+
    decodeRawTransaction: 'decoderawtransaction', // bitcoind v0.7.0+
    decodeScript: 'decodescript',
    dumpPrivKey: 'dumpprivkey',
    dumpWallet: 'dumpwallet', // bitcoind v0.9.0+
    encryptWallet: 'encryptwallet',
    estimateFee: 'estimatefee', // bitcoind v0.10.0x
    estimatePriority: 'estimatepriority', // bitcoind v0.10.0+
    getAccount: 'getaccount',
    getAccountAddress: 'getaccountaddress',
    getAddedNodeInfo: 'getaddednodeinfo', // bitcoind v0.8.0+
    getAddressesByAccount: 'getaddressesbyaccount',
    getBalance: 'getbalance',
    getBestBlockHash: 'getbestblockhash', // bitcoind v0.9.0+
    getBlock: 'getblock',
    getBlockchainInfo: 'getblockchaininfo',   // bitcoind v0.9.2+
    getBlockCount: 'getblockcount',
    getBlockHash: 'getblockhash',
    getBlockTemplate: 'getblocktemplate', // bitcoind v0.7.0+
    getChainTips: 'getchaintips', // bitcoind v0.10.0+
    getConnectionCount: 'getconnectioncount',
    getDifficulty: 'getdifficulty',
    getEncryptionStatus: 'getencryptionstatus', // iocoind
    getGenerate: 'getgenerate',
    getHashesPerSecond: 'gethashespersec',
    getHashesPerSec: 'gethashespersec',
    getInfo: 'getinfo',
    getMiningInfo: 'getmininginfo',
    getNetTotals: 'getnettotals',
    getNetworkInfo: 'getnetworkinfo', // bitcoind v0.9.2+
    getNetworkMHashPs: 'getnetworkmhashps', // iocoind
    getNewAddress: 'getnewaddress',
    reserveBalance: 'reservebalance',
    newPublicKey: 'publicKey',
    sendToDion: 'sendtodion',
    nameNew: 'registerAlias',
    nameNewQuick: 'registerAliasGenerate',
    activateName: 'decryptAlias',
    //updateEncryptedName: 'updateEncryptedAliasFile',
    updateEncryptedName: 'uC',
    updateName: 'updateAliasFile',
    internFrame: 'internFrame__',
    externFrame: 'externFrame__',
    //aliasOut: 'aliasOut',
    aliasOut: 'validate',
    transferName: 'transferAlias',
    transferEncryptedName: 'transferEncryptedAlias',
    //transferEncryptedName: 'transferEncryptedExtPredicate',
    sendPubKey: 'sendPublicKey',
    listNames__: 'aliasList__', //dions
    listNames: 'aliasList', //dions
    rsaMessageList: 'decryptedMessageList', //dions
    myRSAKeys: 'myRSAKeys', //dions
    rsaFriends: 'publicKeys', //dions
    messageSend: 'sendMessage',
    getNumBlocksOfPeers: 'getnumblocksofpeers', // iocoind
    getPeerInfo: 'getpeerinfo', // bitcoind v0.7.0+
    getPOWBlocks: 'getpowblocks', // iocoind
    getPOWBlocksLeft: 'getpowblocksleft', // iocoind
    getPOWTimeLeft: 'getpowtimeleft', // iocoind
    getRawChangeAddress: 'getrawchangeaddress', // bitcoin v0.9+
    getRawMemPool: 'getrawmempool', // bitcoind v0.7.0+
    getRawTransaction: 'getrawtransaction', // bitcoind v0.7.0+
    getReceivedByAccount: 'getreceivedbyaccount',
    receivedByURL: 'xtu_url',
    getReceivedByAddress: 'getreceivedbyaddress',
    getStakingInfo: 'getstakinginfo', // iocoind
    getTransaction: 'gettransaction',
    getTxOut: 'gettxout', // bitcoind v0.7.0+
    getTxOutSetInfo: 'gettxoutsetinfo', // bitcoind v0.7.0+
    getUnconfirmedBalance: 'getunconfirmedbalance', // bitcoind v0.9.0+
    getWalletInfo: 'getwalletinfo', // bitcoind v0.9.2+
    getWork: 'getwork',
    help: 'help',
    importAddress: 'importaddress', // bitcoind v0.10.0+
    importPrivKey: 'importprivkey',
    keypoolRefill: 'keypoolrefill',
    keyPoolRefill: 'keypoolrefill',
    listAccounts: 'listaccounts',
    listAddressGroupings: 'listaddressgroupings', // bitcoind v0.7.0+
    listLockUnspent: 'listlockunspent', // bitcoind v0.8.0+
    listReceivedByAccount: 'listreceivedbyaccount',
    listReceivedByAddress: 'listreceivedbyaddress',
    listSinceBlock: 'listsinceblock',
    listTransactions: 'listtransactions',
    listUnspent: 'listunspent', // bitcoind v0.7.0+
    lockUnspent: 'lockunspent', // bitcoind v0.8.0+
    move: 'move',
    ping: 'ping', // bitcoind v0.9.0+
    sendFrom: 'sendfrom',
    sendMany: 'sendmany',
    sendRawTransaction: 'sendrawtransaction', // bitcoind v0.7.0+
    sendToAddress: 'sendtoaddress',
    shadesend: 'shadesend',
    addressToDion: 'addresstodion',
    setaccount: 'sa',
    setGenerate: 'setgenerate',
    setTxFee: 'settxfee',
    signMessage: 'signmessage',
    signRawTransaction: 'signrawtransaction', // bitcoind v0.7.0+
    stop: 'stop',
    submitBlock: 'submitblock', // bitcoind v0.7.0+
    validateAddress: 'validateaddress',
    subY: 'sublimateYdwi',
    shade: 'shade',
    sr71: 'sr71',
    ydwiWhldw_base_diff: 'ydwiWhldw_base_diff',
    validateLocator: 'validateLocator',
    transientStatus__: 'transientStatus__',
    transientStatus__C: 'transientStatus__C',
    primaryCXValidate: 'primaryCXValidate',
    verifyChain: 'verifychain', // bitcoind v0.9.0+
    verifyMessage: 'verifymessage',
    walletLock: 'walletlock',
    walletLockStatus: 'walletlockstatus',
    walletPassphrase: 'walletpassphrase',
    walletPassphraseChange: 'walletpassphrasechange'
};
