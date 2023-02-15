import {
  json,
  type LinksFunction,
  type LoaderArgs,
  type MetaFunction,
} from '@shopify/remix-oxygen';
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from '@remix-run/react';
import type {Shop} from '@shopify/hydrogen/storefront-api-types';
import styles from './styles/app.css';
import favicon from '../public/favicon.svg';
import {Partytown} from '@builder.io/partytown/react';

const GTM_ID = 'GTM-N5D3D8Q';

export const links: LinksFunction = () => {
  return [
    {rel: 'stylesheet', href: styles},
    {
      rel: 'preconnect',
      href: 'https://cdn.shopify.com',
    },
    {
      rel: 'preconnect',
      href: 'https://shop.app',
    },
    {rel: 'icon', type: 'image/svg+xml', href: favicon},
  ];
};

export const meta: MetaFunction = () => ({
  charset: 'utf-8',
  viewport: 'width=device-width,initial-scale=1',
});

export async function loader({context}: LoaderArgs) {
  const layout = await context.storefront.query<{shop: Shop}>(LAYOUT_QUERY);
  return json(
    {layout},
    {
      headers: {
        // enable partytown atomic mode
        // @see: https://partytown.builder.io/atomics
        'Cross-Origin-Embedder-Policy': 'credentialless',
        'Cross-Origin-Opener-Policy': 'same-origin',
      },
    },
  );
}

export default function App() {
  const data = useLoaderData<typeof loader>();

  const {name} = data.layout.shop;

  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>

      <body>
        {/* GTM script fallback if js is disabled */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{display: 'none', visibility: 'hidden'}}
          />
        </noscript>

        <Partytown
          debug={true}
          forward={['dataLayer.push', 'gtag']}
          resolveUrl={maybeProxyRequest}
        />

        <h1>Hello, {name}</h1>
        <Outlet />
        <ScrollRestoration />
        <Scripts />

        {/* init GTM dataLayer container */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              dataLayer = window.dataLayer || [];

              function gtag(){
                dataLayer.push(arguments)
              };

              gtag('js', new Date());
              gtag('config', "${GTM_ID}");
            `,
          }}
        />

        {/* GTM script — loaded via a Partytown Web Worker */}
        <script
          type="text/partytown"
          dangerouslySetInnerHTML={{
            __html: `
            console.log('Loaded GTM script via partytown 🎉');
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer', "${GTM_ID}");
          `,
          }}
        />
      </body>
    </html>
  );
}

const LAYOUT_QUERY = `#graphql
  query layout {
    shop {
      name
      description
    }
  }
`;

/**
 * Partytown will call this function to resolve any URLs
 * Certain libraries like googletagmanager require a reverse proxy to handle CORS
 * @param url - the URL to resolve
 * @param location - the current location
 * @param type - the type of request (script, image, etc)
 * @returns URL or proxy URL
 * @see https://partytown.builder.io/proxying-requests
 */
function maybeProxyRequest(url: URL, location: Location, type: string) {
  if (type !== 'script') {
    return url;
  }

  // If the url is already reverse proxied, don't proxy it again
  if (url.href.includes('/reverse-proxy')) {
    return url;
  }

  // Otherwise, proxy the url
  const proxyUrl = new URL(`${location.origin}/reverse-proxy`);
  proxyUrl.searchParams.append('apiUrl', url.href);
  return proxyUrl;
}
