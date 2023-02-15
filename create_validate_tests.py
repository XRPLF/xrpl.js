"""
Helper script to write `validate` methods for transactions.
"""
import sys
import json


NORMAL_TYPES = ["number", "string"]
NUMBERS = ["0", "1"]

BINARY_CODEC_FIXTURES = "./packages/ripple-binary-codec/test/fixtures/codec-fixtures.json"

def get_tx(tx_name):
    with open(BINARY_CODEC_FIXTURES) as f:
        fixtures = json.load(f)
        transactions = fixtures["transactions"]
        print(len(transactions))
        valid_txs = [tx["json"] for tx in transactions if tx["json"]["TransactionType"] == tx_name]
        valid_tx = valid_txs[0]
        del valid_tx["TxnSignature"]
        del valid_tx["SigningPubKey"]
        return json.dumps(valid_tx, indent=2)


def main():
    model_name = sys.argv[1]
    filename = f"./packages/xrpl/src/models/transactions/{model_name}.ts"
    model, tx_name = get_model(filename)
    return process_model(model, tx_name)


# Extract just the model from the file
def get_model(filename):
    model = ""
    started = False
    ended = False
    with open(filename) as f:
        for line in f:
            if ended:
                continue
            if not started and not line.startswith("export"):
                continue
            if not started and "Flags" in line:
                continue
            if not started:
                started = True
            model += line
            if line == '}\n':
                ended = True

    lines = model.split("\n")
    name_line = lines[0].split(" ")
    tx_name = name_line[2]
    return model, tx_name


def get_invalid_value(param_types):
    if len(param_types) == 1:
        param_type = param_types[0]
        if param_type == "number":
            return "'number'"
        elif param_type == "string":
            return 123
        elif param_type == "IssuedCurrency":
            return {"test": "test"}
        elif param_type == "Amount":
            return {"currency": "ETH"}
        elif param_type == "XChainBridge":
            return {"XChainDoor": "test"}
        else:
            raise Exception(f"{param_type} not supported yet")

    simplified_param_types = {param_types[i] for i in range(len(param_types)) if i % 2 == 0}
    if simplified_param_types == {'0', '1'}:
        return 2
    elif simplified_param_types == {"number", "string"}:
        return {"currency": "ETH"}
    else:
        raise Exception(f"{simplified_param_types} not supported yet")

# Process the model and build the tests

def process_model(model, tx_name):
    output = ""

    for line in model.split("\n"):
        # skip the things we don't want to test
        if line == "":
            continue
        if line.startswith("export"):
            continue
        if line == "}":
            continue
        line = line.strip()

        if line.startswith("TransactionType"):
            continue
        if line.startswith("Flags"):
            # TODO: support flag checking
            continue

        split = line.split(" ")
        param = split[0].strip("?:")
        param_types = split[1:]
        optional = split[0].endswith("?:")

        if not optional:
            output += f"""  it(`throws w/ missing {param}`, function () {{
    delete tx.{param}

    assert.throws(
      () => validate{tx_name}(tx),
      ValidationError,
      '{tx_name}: missing field {param}',
    )
    assert.throws(
      () => validate(tx),
      ValidationError,
      '{tx_name}: missing field {param}',
    )
  }})

"""

        fake_value = get_invalid_value(param_types)
        output += f"""  it(`throws w/ invalid {param}`, function () {{
    tx.{param} = {fake_value}

    assert.throws(
      () => validate{tx_name}(tx),
      ValidationError,
      '{tx_name}: invalid field {param}',
    )
    assert.throws(
      () => validate(tx),
      ValidationError,
      '{tx_name}: invalid field {param}',
    )
  }})

"""

    output = output[:-2]
    output += "})\n"

    output = f"""import {{ assert }} from 'chai'

import {{ validate, ValidationError }} from '../../src'
import {{ validate{tx_name} }} from '../../src/models/transactions/{tx_name}'

/**
 * {tx_name} Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('{tx_name}', function () {{
  let tx

  beforeEach(function () {{
    tx = {get_tx(tx_name)} as any
  }})

  it('verifies valid {tx_name}', function () {{
    assert.doesNotThrow(() => validate{tx_name}(tx))
    assert.doesNotThrow(() => validate(tx))
  }})

""" + output

    return output


if __name__ == "__main__":
    print(main())
