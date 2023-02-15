"""
Helper script to write `validate` methods for transactions.
"""
import sys


NORMAL_TYPES = ["number", "string"]
NUMBERS = ["0", "1"]


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

# Process the model and build the `validate` method

def get_if_line_param_part(param: str, param_type: str):
    if param_type in NORMAL_TYPES:
        return f"typeof tx.{param} !== \"{param_type}\""
    elif param_type in NUMBERS:
        return f"tx.{param} !== {param_type}"
    else:
        return f"!is{param_type}(tx.{param})"


def process_model(model, tx_name):
    output = ""

    for line in model.split("\n"):
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
            continue

        split = line.split(" ")
        param = split[0].strip("?:")
        param_types = split[1:]
        optional = split[0].endswith("?:")

        if optional:
            if_line = f"  if(tx.{param} !== undefined && "
        else:
            output += f"  if (tx.{param} == null) {{\n"
            output += f"    throw new ValidationError('{tx_name}: missing field {param}')\n"
            output +=  "  }\n\n"
            if_line = "  if("

        if len(param_types) == 1:
            param_type = param_types[0]
            if_line += get_if_line_param_part(param, param_type)
        else:
            i = 0
            if_outputs = []
            while i < len(param_types):
                param_type = param_types[i]
                if_outputs.append(get_if_line_param_part(param, param_type))
                i += 2
            if_line += "(" + " && ".join(if_outputs) + ")"
        if_line += ") {\n"

        output += if_line
        output += f"    throw new ValidationError('{tx_name}: invalid field {param}')\n"
        output +=  "  }\n\n"

    output = output[:-1]
    output += "}\n"

    output = f"""/**
 * Verify the form and type of a {tx_name} at runtime.
 *
 * @param tx - A {tx_name} Transaction.
 * @throws When the {tx_name} is malformed.
 */
export function validate{tx_name}(tx: Record<string, unknown>): void {{
  validateBaseTransaction(tx)

""" + output

    return output


if __name__ == "__main__":
    print(main())
