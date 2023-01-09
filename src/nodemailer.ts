import type { AxiosResponse } from 'axios'
import type { Transport } from 'nodemailer'

import type { Address, Options } from 'nodemailer/lib/mailer'
import type MailMessage from 'nodemailer/lib/mailer/mail-message'
import type { Envelope } from 'nodemailer/lib/mime-node'

import {
  BASE_PATH,
  EmailApi,
  EmailMessageTransactional,
  TransactionalEmailSendPostRequest,
} from '.'

// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace PostmanNodemailerTransport {
  type MailOptions = Options

  interface SentMessageInfo {
    /** an envelope object {from:‘address’, to:[‘address’]} */
    envelope: Envelope
    /** the Message-ID header value */
    messageId: string
    message: Buffer
    response: string
  }
}

export class PostmanNodemailerTransport implements Transport {
  readonly name = 'Postman'
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  readonly version = require('../package.json').version

  constructor(
    private apiKey: string,
    private api: EmailApi = new EmailApi(undefined, BASE_PATH),
  ) {}

  private getAddress(addressee: string | Address | undefined) {
    return !addressee || typeof addressee === 'string'
      ? addressee
      : addressee.address
  }

  private pickFirstAddressee(
    addressees: string | Address | (string | Address)[] | undefined,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return ([] as (Address | string | undefined)[]).concat(addressees).shift()
  }

  send(
    mail: MailMessage<PostmanNodemailerTransport.SentMessageInfo>,
    callback: (
      err: Error | null,
      info: PostmanNodemailerTransport.SentMessageInfo,
    ) => void,
  ): void {
    /* eslint-disable @typescript-eslint/no-non-null-assertion */
    const request: TransactionalEmailSendPostRequest = {
      subject: mail.data.subject!,
      recipient: this.getAddress(this.pickFirstAddressee(mail.data.to))!,
      from: this.getAddress(mail.data.from!),
      reply_to: this.getAddress(this.pickFirstAddressee(mail.data.replyTo)),
      body: (mail.data.html ?? mail.data.text) + '',
    }
    /* eslint-enable @typescript-eslint/no-non-null-assertion */

    const callbackWithResponse = (
      error: Error | null,
      response: AxiosResponse<EmailMessageTransactional, unknown>,
    ) => {
      callback(error, {
        messageId: response?.data?.id ?? 'unknown',
        message: Buffer.from(response?.data?.params?.body ?? '<no body>'),
        envelope: mail.data.envelope as Envelope,
        response: response?.data?.status ?? 'UNKNOWN',
      })
    }

    this.api
      .transactionalEmailSendPost(request, {
        headers: { authorization: `Bearer ${this.apiKey}` },
      })
      .then((response) => callbackWithResponse(null, response))
      .catch((error) => {
        const { response } = error
        callbackWithResponse(error, response)
      })
  }
}
