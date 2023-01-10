# postmangovsg-client

An OpenAPI client and nodemailer transport for postman.gov.sg

## Usage

### Nodemailer

A custom transport that wraps around the [API Client](#api-client) for nodemailer is provided,
so that users can send transactional emails using nodemailer's familiar programmatic API

```ts
import nodemailer from 'nodemailer'
import { PostmanNodemailerTransport } from '@opengovsg/postmangovsg-client'

const transport = new PostmanNodemailerTransport(process.env.POSTMANGOVSG_API_KEY)
const mailer = nodemailer.createTransport(transport)

const mail = { 
  to: 'team@open.gov.sg', 
  subject: 'Hello World', 
  html: 'Product <b>Launched!</b>',
  // text: 'Product Launched!',
}

mailer.sendMail(mail, (err, info) => {
  if (err) {
    console.error(err, info)
  } else {
    console.log(info)
  }
})
```

### API Client

An OpenAPI client was generated using [openapi-generator](https://openapi-generator.tech/)
and the [Postman OpenAPI spec](https://api.postman.gov.sg/docs/#/). The resulting clients and models
are accessible via imports from `@opengovsg/postmangovsg-client`
