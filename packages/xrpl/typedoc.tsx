import React from 'react'
import { Application, JSX } from 'typedoc'

const GTMScript = `
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-M7HKJJ3');
`

export function load(app: Application) {
  app.renderer.hooks.on('head.begin', () => (
    <>
      <script src="https://cmp.osano.com/AzyjT6TIZMlgyLyy8/ad2447d5-f101-40df-b92e-d6452b5ecac0/osano.js"></script>
      <script>
        <JSX.Raw html={GTMScript} />
      </script>
    </>
  ))

  app.renderer.hooks.on('body.begin', () => (
    <noscript>
      <iframe
        src="https://www.googletagmanager.com/ns.html?id=GTM-M7HKJJ3"
        height={0}
        width={0}
        style="display:none;visibility:hidden"
      ></iframe>
    </noscript>
  ))
}
