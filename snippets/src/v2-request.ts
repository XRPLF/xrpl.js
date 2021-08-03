import { Connection } from "../../src/common";

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
}

const api = new RippleAPI()

const info = api.request({command: "server_info"})
console.log(info)
///         ^^^ const info: Promise<ServerInfoResponse>

const acct = api.request({command: "account_info", account: "r.."})
console.log(acct)
///         ^^^ const info: Promise<AccountInfoResponse>

interface CustomRequest { 
    id?: string | number
    token: "USD" | "EUR" | "BTC"
    limit: number
}

interface CustomResponse {
    token: "USD" | "EUR" | "BTC"
    exchange_rates: number[]
}

const custom = api.request<CustomRequest, CustomResponse>({
    token: "USD",
    limit: 10
})

console.log(custom)
///         ^^^ const info: Promise<CustomResponse>