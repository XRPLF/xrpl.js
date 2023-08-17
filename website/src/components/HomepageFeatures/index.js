import React from "react";
import clsx from "clsx";
import styles from "./styles.module.css";

const FeatureList = [
  {
    title: "keys & testing",
    Svg: require("@site/static/img/undraw_docusaurus_mountain.svg").default,
    description: (
      <>
        Managing keys & creating test credentials (<code>Wallet</code>&&
        <code>Client.fundWallet()</code>)
      </>
    ),
  },
  {
    title: "Transaction Submission",
    Svg: require("@site/static/img/undraw_docusaurus_tree.svg").default,
    description: (
      <>
        Submitting transactions to the XRPL (<code> Client.submit(...)</code> &{" "}
        <url>transaction types</url>)
      </>
    ),
  },
  {
    title: "Subscription to Ledger Changes",
    Svg: require("@site/static/img/undraw_docusaurus_react.svg").default,
    description: (
      <>
        Parsing ledger data into more convenient formats (
        <code>xrpToDrops </code> and <code>rippleTimeToISOTime</code>)
      </>
    ),
  },
];

function Feature({ Svg, title, description }) {
  return (
    <div className={clsx("col col--4")}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
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
