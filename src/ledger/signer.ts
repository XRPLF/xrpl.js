import { Amount } from "../models/common";
import {Transaction} from "../models/transactions";
//import combine from "../transaction/combine";
import Wallet from "../Wallet";

export interface Signed {
    signedTransaction: string, 
    id: string
}

export class Signer {
    
    // TODO: Implement sign
    static sign(wallet: Wallet, tx: Transaction): Signed {
        return wallet.signTransaction(tx, { signAs: '' })
    }

    // TODO: Implement multi-sign
    // TODO: Handle both byte input and array of transaction input
    static multisign(transactions: Transaction[] | string[]): Signed {
 
        //Check for errors 
        // - No trust line between them (Both sides)
        // - Account isn't set up for multi-signing
        // 
        //combine
        return null
    }

    // TODO: Implement authorize channel
    static authorizeChannel(wallet: Wallet, channelId: number, amount: Amount): Signed {
        return null
    }

    // TODO: Implement verify
    static verify(tx: Transaction): void {

    }
}