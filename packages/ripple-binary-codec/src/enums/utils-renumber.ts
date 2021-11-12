/**
 * Quick script to re-number values
 */

const input = {
  temBAD_SEND_XRP_PATHS: -283,
  temBAD_SEQUENCE: -282,
  temBAD_SIGNATURE: -281,
  temBAD_SRC_ACCOUNT: -280,
  temBAD_TRANSFER_RATE: -279,
  temDST_IS_SRC: -278,
  temDST_NEEDED: -277,
  temINVALID: -276,
  temINVALID_FLAG: -275,
  temREDUNDANT: -274,
  temRIPPLE_EMPTY: -273,
  temDISABLED: -272,
  temBAD_SIGNER: -271,
  temBAD_QUORUM: -270,
  temBAD_WEIGHT: -269,
  temBAD_TICK_SIZE: -268,
  temINVALID_ACCOUNT_ID: -267,
  temCANNOT_PREAUTH_SELF: -266,

  temUNCERTAIN: -265,
  temUNKNOWN: -264,

  tefFAILURE: -199,
  tefALREADY: -198,
  tefBAD_ADD_AUTH: -197,
  tefBAD_AUTH: -196,
  tefBAD_LEDGER: -195,
  tefCREATED: -194,
  tefEXCEPTION: -193,
  tefINTERNAL: -192,
  tefNO_AUTH_REQUIRED: -191,
  tefPAST_SEQ: -190,
  tefWRONG_PRIOR: -189,
  tefMASTER_DISABLED: -188,
  tefMAX_LEDGER: -187,
  tefBAD_SIGNATURE: -186,
  tefBAD_QUORUM: -185,
  tefNOT_MULTI_SIGNING: -184,
  tefBAD_AUTH_MASTER: -183,
  tefINVARIANT_FAILED: -182,
  tefTOO_BIG: -181,

  terRETRY: -99,
  terFUNDS_SPENT: -98,
  terINSUF_FEE_B: -97,
  terNO_ACCOUNT: -96,
  terNO_AUTH: -95,
  terNO_LINE: -94,
  terOWNERS: -93,
  terPRE_SEQ: -92,
  terLAST: -91,
  terNO_RIPPLE: -90,
  terQUEUED: -89,

  tesSUCCESS: 0,

  tecCLAIM: 100,
  tecPATH_PARTIAL: 101,
  tecUNFUNDED_ADD: 102,
  tecUNFUNDED_OFFER: 103,
  tecUNFUNDED_PAYMENT: 104,
  tecFAILED_PROCESSING: 105,
  tecDIR_FULL: 121,
  tecINSUF_RESERVE_LINE: 122,
  tecINSUF_RESERVE_OFFER: 123,
  tecNO_DST: 124,
  tecNO_DST_INSUF_XRP: 125,
  tecNO_LINE_INSUF_RESERVE: 126,
  tecNO_LINE_REDUNDANT: 127,
  tecPATH_DRY: 128,
  tecUNFUNDED: 129,
  tecNO_ALTERNATIVE_KEY: 130,
  tecNO_REGULAR_KEY: 131,
  tecOWNERS: 132,
  tecNO_ISSUER: 133,
  tecNO_AUTH: 134,
  tecNO_LINE: 135,
  tecINSUFF_FEE: 136,
  tecFROZEN: 137,
  tecNO_TARGET: 138,
  tecNO_PERMISSION: 139,
  tecNO_ENTRY: 140,
  tecINSUFFICIENT_RESERVE: 141,
  tecNEED_MASTER_KEY: 142,
  tecDST_TAG_NEEDED: 143,
  tecINTERNAL: 144,
  tecOVERSIZE: 145,
  tecCRYPTOCONDITION_ERROR: 146,
  tecINVARIANT_FAILED: 147,
  tecEXPIRED: 148,
  tecDUPLICATE: 149,
  tecKILLED: 150,
  tecHAS_OBLIGATIONS: 151,
  tecTOO_SOON: 152,
}

let startingFromTemBADSENDXRPPATHS = -284

let startingFromTefFAILURE = -199

let startingFromTerRETRY = -99

const tesSUCCESS = 0

let startingFromTecCLAIM = 100

const startingFromTecDIRFULL = 121

let previousKey = 'tem'
Object.keys(input).forEach((key) => {
  if (key.substring(0, 3) !== previousKey.substring(0, 3)) {
    console.log()
    previousKey = key
  }
  if (key.substring(0, 3) === 'tem') {
    console.log(`    "${key}": ${startingFromTemBADSENDXRPPATHS++},`)
  } else if (key.substring(0, 3) === 'tef') {
    console.log(`    "${key}": ${startingFromTefFAILURE++},`)
  } else if (key.substring(0, 3) === 'ter') {
    console.log(`    "${key}": ${startingFromTerRETRY++},`)
  } else if (key.substring(0, 3) === 'tes') {
    console.log(`    "${key}": ${tesSUCCESS},`)
  } else if (key.substring(0, 3) === 'tec') {
    if (key === 'tecDIR_FULL') {
      startingFromTecCLAIM = startingFromTecDIRFULL
    }
    console.log(`    "${key}": ${startingFromTecCLAIM++},`)
  }
})
