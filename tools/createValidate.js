const fs = require("fs");

const NORMAL_TYPES = ["number", "string"];
const NUMBERS = ["0", "1"];

// TODO: rewrite this to use regex

function main() {
  if (process.argv.length < 3) {
    console.log(
      "Usage: " + process.argv[0] + " " + process.argv[1] + " TxName"
    );
    process.exit(1);
  }
  const modelName = process.argv[2];
  const filename = `./packages/xrpl/src/models/transactions/${modelName}.ts`;
  const [model, txName] = getModel(filename);
  return processModel(model, txName);
}

function getModel(filename) {
  let model = "";
  let started = false;
  let ended = false;
  const data = fs.readFileSync(filename, "utf8");
  const lines = data.split("\n");
  for (let line of lines) {
    if (ended) {
      continue;
    }
    if (!started && !line.startsWith("export")) {
      continue;
    }
    if (!started && line.includes("Flags")) {
      continue;
    }
    if (!started) {
      started = true;
    }
    model += line + "\n";
    if (line === "}") {
      ended = true;
    }
  }
  const name_line = model.split("\n")[0].split(" ");
  const txName = name_line[2];
  return [model, txName];
}

function getIfLineParamPart(param, paramType) {
  if (NORMAL_TYPES.includes(paramType)) {
    return `typeof tx.${param} !== "${paramType}"`;
  } else if (NUMBERS.includes(paramType)) {
    return `tx.${param} !== ${paramType}`;
  } else {
    return `!is${paramType}(tx.${param})`;
  }
}

function processModel(model, txName) {
  let output = "";
  for (let line of model.split("\n")) {
    if (line == "") {
      continue;
    }
    if (line.startsWith("export")) {
      continue;
    }
    if (line == "}") {
      continue;
    }
    line = line.trim();
    if (line.startsWith("TransactionType")) {
      continue;
    }
    if (line.startsWith("Flags")) {
      continue;
    }
    if (line.startsWith("/**")) {
      continue;
    }
    if (line.startsWith("*")) {
      continue;
    }
    const split = line.split(" ");
    let param = split[0].replace("?:", "").replace(":", "").trim();
    let paramTypes = split.slice(1);
    let optional = split[0].endsWith("?:");
    if (optional) {
      output += `  if (tx.${param} !== undefined && `;
    } else {
      output += `  if (tx.${param} == null) {\n`;
      output += `    throw new ValidationError('${txName}: missing field ${param}')\n`;
      output += `  }\n\n`;
      output += `  if (`;
    }
    if (paramTypes.length == 1) {
      let paramType = paramTypes[0];
      output += getIfLineParamPart(param, paramType);
    } else {
      let i = 0;
      let if_outputs = [];
      while (i < paramTypes.length) {
        let paramType = paramTypes[i];
        if_outputs.push(getIfLineParamPart(param, paramType));
        i += 2;
      }
      output += "(" + if_outputs.join(" && ") + ")";
    }
    output += ") {\n";
    output += `    throw new ValidationError('${txName}: invalid field ${param}')\n`;
    output += `  }\n\n`;
  }
  output = output.substring(0, output.length - 1);
  output += "}\n";

  output =
    `/**
 * Verify the form and type of a ${txName} at runtime.
 *
 * @param tx - A ${txName} Transaction.
 * @throws When the ${txName} is malformed.
 */
export function validate${txName}(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

` + output;

  return output;
}

console.log(main());
