import { Connection } from "../../src/common";
import { ValidationError } from "../../src/common/errors";
import { XrpLedgerTransaction, OfferCreateTransaction, PaymentTransaction } from "./v2-transactions";

interface AccountInfoRequest {
    command: "account_info";
    id?: string | number;
    account: string;
    ledger_hash?: string;
    ledger_index?: string;
    queue?: boolean;
    signer_lists?: boolean;
    strict?: boolean
}

interface AccountInfoResponse {
    id?: string | number;
    status: "success" | "error"
    result: {
        account_data: {
            Account: string;
            Sequence: number
        }
    }
}

interface ServerInfoRequest {
    id?: string | number
    command: "server_info"
}

interface ServerInfoResponse {
    id?: string | number
    status: "success" | "error"
    result: {
        info: {
            validated_ledger: {
                base_fee_xrp: number
            }
            load_factor: number
        }
    }
}

class RippleAPI {
    private connection: Connection;

    public request(r: AccountInfoRequest): Promise<AccountInfoResponse>
    public request(r: ServerInfoRequest): Promise<ServerInfoResponse>
    public request<Request, Response>(r: Request): Promise<Response> 
    public request<Request, Response>(r: Request): Promise<Response> {
        return this.connection.request(r); 
    }

    //sugar
    getNextSequence = getNextSequence
    getFee = getFee
    autofill = autofill

    prepare = prepare
}

async function getNextSequence(this: RippleAPI, account: string): Promise<number> {
    const accountInfo = await this.request({
        command: 'account_info',
        account,
    })

    return accountInfo?.result?.account_data?.Sequence
}

async function getFee(this: RippleAPI): Promise<number> {
    const serverInfo = await this.request({command: 'server_info'})

    const base = serverInfo?.result?.info?.validated_ledger?.base_fee_xrp
    const load_factor = serverInfo?.result?.info?.load_factor

    return base * load_factor
}

async function autofill<T extends XrpLedgerTransaction>(
    this: RippleAPI,
    tx: T
): Promise<T> {
    const sequence = await this.getNextSequence(tx.Account)
    const fee = await this.getFee()

    tx.Sequence = sequence
    tx.Fee = String(fee)

    return tx
}

async function prepareOfferCreateTx(
    api: RippleAPI,
    tx: OfferCreateTransaction
): Promise<OfferCreateTransaction> {
    if (tx.TakerGets === undefined)
        throw new Error("missing TakerGets")

    if (tx.TakerPays === undefined)
        throw new Error("missingTakerGets")

    const filled = await api.autofill(tx);

    return filled
}

async function preparePaymentTx(
    api: RippleAPI,
    tx: PaymentTransaction
): Promise<PaymentTransaction> {
    const filled = await api.autofill(tx);

    return filled
}

const prepareFactory = {
    "OfferCreate": prepareOfferCreateTx,
    "Payment": preparePaymentTx
}

function prepare<T extends XrpLedgerTransaction>(
    this: RippleAPI,
    transaction: T
): Promise<T> {

    type Prepare = (api: RippleAPI, tx: T) => Promise<T>
    const prepareMethod: Prepare | undefined = prepareFactory[transaction.TransactionType]

    if (prepareMethod === undefined)
        throw new ValidationError("Unknown TransactionType")

    return prepareMethod(this, transaction)
}


async function signAndSubmit() {
    const api = new RippleAPI()

    const tx: OfferCreateTransaction = {
        Account: "FOO",
        TransactionType: "OfferCreate",
        TakerGets: "10",
        TakerPays: "100", 
    }

    const prepared = await api.prepare(tx)
    console.log(prepared)
}

signAndSubmit()