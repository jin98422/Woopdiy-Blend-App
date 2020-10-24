import App from 'next/app';
import Head from 'next/head';
import { AppProvider } from '@shopify/polaris';
import { Provider } from '@shopify/app-bridge-react';
import '@shopify/polaris/styles.css';
import translations from '@shopify/polaris/locales/en.json';
import Cookies from 'js-cookie';


class Blend extends App {
  render() {
    console.log(shopOrigin)
    const { Component, pageProps } = this.props;
    const config = { apiKey: API_KEY, shopOrigin: shopOrigin, forceRedirect: true };
    return (
      <React.Fragment>
        <Head>
          <title>Oil Blend App</title>
          <meta charSet="utf-8" />
        </Head>
        <Provider config={config}>
          <AppProvider i18n={translations}>
            <Component {...pageProps} />
          </AppProvider>
        </Provider>
      </React.Fragment>
    );
  }
}

export default Blend;