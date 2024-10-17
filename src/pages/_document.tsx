import Document, { Html, Head, Main, NextScript } from 'next/document'

class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          <script
            id="chatbotkit-widget"
            src="https://static.chatbotkit.com/integrations/widget/v2.js"
            data-widget="cm229l9ly4rui13c5gpvurplt"
            async
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument
