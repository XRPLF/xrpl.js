import { Application, JSX } from 'typedoc'

/**
 * Google Tag Manager container ID used for analytics
 */
const GTM_CONTAINER_ID = 'GTM-M7HKJJ3'

const GTMScript = `
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_CONTAINER_ID}');
`

/**
 * TypeDoc plugin that integrates Google Tag Manager and Osano script
 * into the generated documentation.
 *
 * @param app - The TypeDoc application instance
 */
export function load(app: Application) {
  app.renderer.hooks.on('head.begin', () =>
    JSX.createElement(
      JSX.Fragment,
      null,
      JSX.createElement('script', {
        src: 'https://cmp.osano.com/AzyjT6TIZMlgyLyy8/ad2447d5-f101-40df-b92e-d6452b5ecac0/osano.js',
      }),
      JSX.createElement(
        'script',
        null,
        JSX.createElement(JSX.Raw, { html: GTMScript }),
      ),
    ),
  )
  app.renderer.hooks.on('body.begin', () =>
    JSX.createElement(
      'noscript',
      null,
      JSX.createElement('iframe', {
        src: `https://www.googletagmanager.com/ns.html?id=${GTM_CONTAINER_ID}`,
        height: 0,
        width: 0,
        style: 'display:none;visibility:hidden',
      }),
    ),
  )
}
