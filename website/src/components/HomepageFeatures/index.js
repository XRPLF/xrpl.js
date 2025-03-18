import React from "react";
import clsx from "clsx";
import styles from "./styles.module.css";

const FeatureList = [
  {
    title: "Keys & Testing",
    img: "/img/keys_and_testing.svg",
    className: "keys_and_testing",
    description: (
      <>
        Managing keys & creating test credentials (<code>Wallet</code>&&
        <code>Client.fundWallet()</code>)
      </>
    ),
  },
  {
    title: "Transaction Submission",
    img: "/img/transaction_submission.svg",
    className: "transaction_submission",
    description: (
      <>
        Submitting transactions to the XRPL <br />(
        <code> Client.submit(...)</code> & <url>transaction types</url>)
      </>
    ),
  },
  {
    title: "Subscription to Ledger Changes",
    img: "/img/subscription_to_ledger.svg",
    className: "subscription_to_ledger",
    description: (
      <>
        Parsing ledger data into more convenient formats (
        <code>xrpToDrops </code> and <code>rippleTimeToISOTime</code>)
      </>
    ),
  },
];

function Feature({ title, img, className, description }) {
  return (
    <div className={clsx("col col--4")}>
      <div className="text--center">
        <img src={img} className={className} />
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
