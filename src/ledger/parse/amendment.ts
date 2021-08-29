function parseAmendment(tx: any) {
  return {
    amendment: tx.Amendment,
  };
}

export default parseAmendment;
