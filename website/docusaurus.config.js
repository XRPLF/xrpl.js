// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require("prism-react-renderer/themes/github");
const darkCodeTheme = require("prism-react-renderer/themes/dracula");
const path = require("path");

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "xrpl.js Documentation",
  tagline:
    "This is the recommended library for integrating a JavaScript/TypeScript app with the XRP Ledger, especially if you intend to use advanced functionality such as IOUs, payment paths, the decentralized exchange, account settings, payment channels, escrows, multi-signing, and more.",
  // Set the production url of your site here
  url: "https://your-docusaurus-test-site.com",
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: "/",

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: "facebook", // Usually your GitHub org/user name.
  projectName: "docusaurus", // Usually your repo name.

  onBrokenLinks: "ignore",
  onBrokenMarkdownLinks: "warn",

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },
  // plugins: [
  //   [
  //     "docusaurus-plugin-typedoc-api",
  //     {
  //       id: "default",
  //       projectRoot: path.join(__dirname, "../"),
  //       // Monorepo
  //       packages: [
  //         "packages/xrpl",
  //         "packages/ripple-keypairs",
  //         "packages/ripple-address-codec",
  //         "packages/ripple-binary-codec",
  //         // {
  //         //   path: "packages/xrpl",
  //         //   entry: {
  //         //     index: "src/index.ts",
  //         //   },
  //         // },
  //       ],
  //       debug: true,
  //       minimal: false,
  //       readmes: true,
  //       changelogs: true,
  //       changelogName: "HISTORY.md",
  //       typedocOptions: {
  //         categoryOrder: [
  //           "Constructor",
  //           "Clients",
  //           "Signing",
  //           "Transaction Models",
  //           "Transaction Flags",
  //           "Ledger Flags",
  //           "Utilities",
  //           "Requests",
  //           "Responses",
  //           "Streams",
  //           "Errors",
  //         ],
  //         categorizeByGroup: false,
  //         readme: "../../README.md",
  //       },
  //     },
  //   ],
  //   // [
  //   //   "@docusaurus/plugin-content-pages",
  //   //   {
  //   //     id: "home",
  //   //     path: "./",
  //   //     routeBasePath: "/home",
  //   //     include: ["*.md"],
  //   //   },
  //   // ],
  //   () => ({
  //     name: "resolve-react",
  //     configureWebpack() {
  //       return {
  //         resolve: {
  //           alias: {
  //             // assuming root node_modules is up from "./packages/<your-docusaurus>
  //             react: path.resolve("./node_modules/react"),
  //           },
  //         },
  //       };
  //     },
  //   }),
  //   "docusaurus-plugin-sass",
  // ],
  plugins: [
    [
      "docusaurus-plugin-typedoc",
      {
        // Plugin/TypeDoc specific configuration
        entryPoints: [
          "../packages/xrpl/src/index.ts",
          "../packages/ripple-keypairs/src/index.ts",
          "../packages/ripple-address-codec/src/index.ts",
          "../packages/ripple-binary-codec/src/index.ts",
        ],
        tsconfig: "../tsconfig.json", // Path to your tsconfig.json
        debug: true,
        watch: process.env.TYPEDOC_WATCH,
        plugin: ["typedoc-plugin-markdown"], // Or other Typedoc plugins you are using
        sidebar: {
          categoryLabel: "API",
          position: 0,
          fullNames: true,
        },
        readme: "none",
        categorizeByGroup: false,
        categoryOrder: [
          "Constructor",
          "Clients",
          "Signing",
          "Transaction Models",
          "Transaction Flags",
          "Ledger Flags",
          "Utilities",
          "Requests",
          "Responses",
          "Streams",
          "Errors",
        ],
      },
    ],
  ],
  presets: [
    [
      "classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve("./sidebars.js"),
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
        },
        theme: {
          customCss: require.resolve("./src/css/custom.scss"),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: "img/docusaurus-social-card.jpg",
      navbar: {
        title: "XRPL.JS",
        items: [
          {
            type: "docSidebar",
            sidebarId: "tutorialSidebar",
            position: "left",
            label: "Setup",
          },
          {
            href: "https://github.com/XRPLF/xrpl.js",
            label: "GitHub",
            position: "right",
          },
          {
            to: "api",
            label: "API",
            position: "left",
          },
        ],
      },
      footer: {
        style: "dark",
        links: [
          {
            title: "Docs",
            items: [
              {
                label: "xrpl.org",
                to: "https://xrpl.org ",
              },
              {
                label: "Quickstart",
                to: "/docs/intro",
              },
              {
                label: "xrpl.js",
                to: "/api/xrpl",
              },
              {
                label: "ripple-address-codec",
                to: "/api/ripple-address-codec",
              },
              {
                label: "ripple-keypairs",
                to: "/api/ripple-keypairs",
              },
            ],
          },
          {
            title: "Community",
            items: [
              {
                label: "Discord",
                href: "htpps://bit.ly/3TPCWon",
              },
              {
                label: "Twitter",
                href: "https://twitter.com/RippleXDev",
              },
            ],
          },
          {
            title: "More",
            items: [
              {
                label: "npm",
                to: "https://www.npmjs.com/package/xrpl",
              },
              {
                label: "GitHub",
                href: "https://github.com/XRPLF/xrpl.js",
              },
              {
                label: "XRPL Code Samples",
                href: "https://github.com/XRPLF/xrpl-dev-portal/tree/master/content/_code-samples",
              },
              {
                label: "Subscribe to xrpl-announce",
                href: "https://groups.google.com/g/xrpl-announce",
              },
              {
                label: "Subscribe to ripple-server",
                href: "https://groups.google.com/g/xrpl-announce",
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} XRP Ledger. Open Source`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
      colorMode: {
        defaultMode: "dark",
        disableSwitch: false,
        respectPrefersColorScheme: false,
      },
      algolia: {
        // The application ID provided by Algolia
        appId: "UWLAFN5MGH",

        // Public API key: it is safe to commit it
        apiKey: "f7b1b6b53eda9a560bf206a5148207d8",

        indexName: "js-xrpl",

        // Optional: see doc section below
        contextualSearch: true,

        // Optional: Specify domains where the navigation should occur through window.location instead on history.push. Useful when our Algolia config crawls multiple documentation sites and we want to navigate with window.location.href to them.
        externalUrlRegex: "external\\.com|domain\\.com",

        // Optional: Replace parts of the item URLs from Algolia. Useful when using the same search index for multiple deployments using a different baseUrl. You can use regexp or string in the `from` param. For example: localhost:3000 vs myCompany.com/docs
        replaceSearchResultPathname: {
          from: "/docs/", // or as RegExp: /\/docs\//
          to: "/",
        },

        // Optional: Algolia search parameters
        searchParameters: {},

        // Optional: path for search page that enabled by default (`false` to disable it)
        searchPagePath: "search",

        //... other Algolia params
      },
    }),
};

module.exports = config;
