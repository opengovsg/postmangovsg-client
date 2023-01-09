import type { AxiosResponse } from 'axios'
import type { Transport } from 'nodemailer'

import Mail, { Address } from 'nodemailer/lib/mailer'
import MailMessage from 'nodemailer/lib/mailer/mail-message'
import MimeNode from 'nodemailer/lib/mime-node'

import {
  BASE_PATH,
  EmailApi,
  EmailMessageTransactional,
  TransactionalEmailSendPostRequest,
} from '.'

// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace PostmanNodemailerTransport {
  type MailOptions = Mail.Options

  interface SentMessageInfo {
    /** an envelope object {from:‘address’, to:[‘address’]} */
    envelope: MimeNode.Envelope
    /** the Message-ID header value */
    messageId: string
    message: Buffer
    accepted: Array<string | Mail.Address>
    rejected: Array<string | Mail.Address>
    pending: Array<string | Mail.Address>
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
    addressees: string | Mail.Address | (string | Mail.Address)[] | undefined,
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
        envelope: mail.data.envelope as MimeNode.Envelope,
        response: response?.data?.id ?? 'unknown',
        accepted: [],
        pending: [],
        rejected: [],
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
