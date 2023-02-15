# Hydrogen template: Hello World + Partytown + GTM

Hydrogen is Shopify’s stack for headless commerce. Hydrogen is designed to
dovetail with [Remix](https://remix.run/), Shopify’s full stack web framework.
This template contains a **minimal setup** of components, queries and tooling to
get started with Hydrogen.

[Partytown](https://partytown.builder.io/) - Run Third-Party Scripts From A Web
Worker

[GTM](https://tagmanager.google.com/) - Google Analytics lets you measure your
advertising ROI as well as track your Flash, video, and social networking sites
and applications

[Check out Hydrogen docs](https://shopify.dev/custom-storefronts/hydrogen)
[Get familiar with Remix](https://remix.run/docs/en/v1)

## What's included

- Partytown
- GTM
- Remix
- Hydrogen
- Oxygen
- Shopify CLI
- ESLint
- Prettier
- GraphQL generator
- TypeScript and JavaScript flavors
- Minimal setup of components and routes

## Getting started

Remember to update `.env` with your shop's domain and Storefront API token!

## Building for production

```bash
npm run build
```

## Local development

```bash
npm run dev
```

## Partytown reverse proxy route

When the `<script>` element is appended to the `<head>` using this traditional
approach, the script’s HTTP response does not require Cross-Origin Resource
Sharing (CORS) headers.

However, because Partytown requests the scripts within a web worker using
fetch(), then the script’s response requires the correct CORS headers.

Many third-party scripts already provide the correct CORS headers, but not all
do. For services that do not add the correct headers, then a reverse proxy to
another domain must be used in order to provide the CORS headers.

This example includes an internal reverse proxy route (cloudflare-friendly)
[`app/routes/reverse-proxy`](https://github.com/juanpprieto/hydrogen-partytown-gtm/blob/main/app/routes/reverse-proxy.tsx)
to help provide correct CORS headers for those library that require them.

To enable proxying configure `<Partytown />` as such:

```tsx
// app/root.tsx
<Partytown
  debug={true}
  forward={['dataLayer.push', 'gtag']}
  resolveUrl={maybeProxyRequest}
/>
```

where `maybeProxyRequest` is a helper utility:

```tsx
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
```
