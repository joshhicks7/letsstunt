// Learn more https://docs.expo.dev/router/reference/static-rendering/#root-html

import { ScrollViewStyleReset } from 'expo-router/html';
import { MAX_WEB_APP_WIDTH } from '@/constants/layout';

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function only run in Node.js environments and
// do not have access to the DOM or browser APIs.
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        <style
          id="letsstunt-app-shell-width"
          dangerouslySetInnerHTML={{
            __html: `
              #root {
                justify-content: center !important;
                width: 100%;
                min-height: 100%;
              }
              #root > div {
                max-width: ${MAX_WEB_APP_WIDTH}px;
                width: 100%;
                flex: 1 1 auto;
                min-height: 100%;
              }
            `,
          }}
        />

        {/* 
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native. 
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />

        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/pwa_192x192.png" />
        <meta name="theme-color" content="#5B4B8A" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#5B4B8A" media="(prefers-color-scheme: dark)" />
        {/* Match app background before JS hydrates to avoid light flash in dark mode */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var dark=window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.style.colorScheme=dark?'dark':'light';document.documentElement.style.backgroundColor=dark?'#0d0d0d':'#f7f7f7';}catch(e){}})();`,
          }}
        />
        <meta name="description" content="Find flyers, bases, and stunt partners nearby." />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="LetsStunt" />
      </head>
      <body>{children}</body>
    </html>
  );
}
