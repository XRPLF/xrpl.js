import { RippleAPI } from './api';

export * from './api'

export * from './transaction/types'

export * from './common/types/objects/ledger'

export * from './offline/utils';


const API = new RippleAPI({server: "wss://s2.ripple.com"})

const doStuff = async () => {
    try {
        await API.connect()

        const balances = await API.getBalances(`rGBP6jP1a7pJF7AtnEUa5Q4T2dwZxcQaWG`, {ledgerVersion: 62965182 })
        console.log(balances)
    }
    catch (e) {
        console.log(e)
    }
    finally {
        await API.disconnect()
    }
    
}

doStuff()
// Broadcast api is experimental
export {RippleAPIBroadcast} from './broadcast'
