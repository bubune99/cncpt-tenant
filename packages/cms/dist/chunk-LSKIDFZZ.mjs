import {
  prisma
} from "./chunk-BY6YNCHO.mjs";
import {
  __spreadProps,
  __spreadValues
} from "./chunk-C2QMXRW7.mjs";

// src/lib/email/providers/smtp.ts
var nodemailer = null;
async function getNodemailer() {
  if (!nodemailer) {
    try {
      nodemailer = await import("nodemailer");
    } catch (e) {
      throw new Error("nodemailer is not installed. Run: npm install nodemailer");
    }
  }
  return nodemailer;
}
function formatAddress(addr) {
  return addr.name ? `"${addr.name}" <${addr.email}>` : addr.email;
}
function formatAddresses(addrs) {
  const arr = Array.isArray(addrs) ? addrs : [addrs];
  return arr.map(formatAddress).join(", ");
}
var SmtpProvider = class {
  constructor(config) {
    this.name = "smtp";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.transporter = null;
    this.config = config;
  }
  async getTransporter() {
    var _a, _b, _c;
    if (this.transporter) return this.transporter;
    const nm = await getNodemailer();
    this.transporter = nm.createTransport({
      host: this.config.host,
      port: this.config.port,
      secure: (_a = this.config.secure) != null ? _a : this.config.port === 465,
      auth: this.config.user ? {
        user: this.config.user,
        pass: this.config.pass
      } : void 0,
      pool: (_b = this.config.pool) != null ? _b : true,
      maxConnections: (_c = this.config.maxConnections) != null ? _c : 5
    });
    return this.transporter;
  }
  async send(message) {
    var _a;
    try {
      const transporter = await this.getTransporter();
      const mailOptions = {
        from: message.from ? formatAddress(message.from) : void 0,
        to: formatAddresses(message.to),
        subject: message.subject,
        text: message.text,
        html: message.html,
        replyTo: message.replyTo ? formatAddress(message.replyTo) : void 0,
        cc: message.cc ? formatAddresses(message.cc) : void 0,
        bcc: message.bcc ? formatAddresses(message.bcc) : void 0,
        headers: message.headers,
        attachments: (_a = message.attachments) == null ? void 0 : _a.map((att) => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType,
          encoding: att.encoding,
          cid: att.cid
        }))
      };
      const result = await transporter.sendMail(mailOptions);
      return {
        success: true,
        messageId: result.messageId,
        provider: "smtp",
        timestamp: /* @__PURE__ */ new Date(),
        raw: result
      };
    } catch (error) {
      const err = error;
      return {
        success: false,
        provider: "smtp",
        error: err.message,
        timestamp: /* @__PURE__ */ new Date(),
        raw: error
      };
    }
  }
  async sendBulk(message) {
    const results = [];
    let totalSent = 0;
    let totalFailed = 0;
    for (const recipient of message.recipients) {
      const result = await this.send(__spreadProps(__spreadValues({}, message), {
        to: recipient.to,
        metadata: __spreadValues(__spreadValues({}, message.metadata), recipient.metadata)
      }));
      results.push({
        email: recipient.to.email,
        success: result.success,
        messageId: result.messageId,
        error: result.error
      });
      if (result.success) {
        totalSent++;
      } else {
        totalFailed++;
      }
    }
    return {
      success: totalFailed === 0,
      provider: "smtp",
      totalSent,
      totalFailed,
      results,
      timestamp: /* @__PURE__ */ new Date()
    };
  }
  async verify() {
    try {
      const transporter = await this.getTransporter();
      await transporter.verify();
      return true;
    } catch (e) {
      return false;
    }
  }
  async close() {
    if (this.transporter) {
      this.transporter.close();
      this.transporter = null;
    }
  }
};

// src/lib/email/providers/sendgrid.ts
function toSendGridAddress(addr) {
  return { email: addr.email, name: addr.name };
}
function toSendGridAddresses(addrs) {
  const arr = Array.isArray(addrs) ? addrs : [addrs];
  return arr.map(toSendGridAddress);
}
var SendGridProvider = class {
  constructor(config) {
    this.name = "sendgrid";
    this.config = config;
  }
  async send(message) {
    var _a, _b;
    if (!message.from) {
      return {
        success: false,
        provider: "sendgrid",
        error: "From address is required",
        timestamp: /* @__PURE__ */ new Date()
      };
    }
    try {
      const personalization = {
        to: toSendGridAddresses(message.to)
      };
      if (message.cc) {
        personalization.cc = toSendGridAddresses(message.cc);
      }
      if (message.bcc) {
        personalization.bcc = toSendGridAddresses(message.bcc);
      }
      if (message.metadata) {
        personalization.custom_args = message.metadata;
      }
      const content = [];
      if (message.text) {
        content.push({ type: "text/plain", value: message.text });
      }
      if (message.html) {
        content.push({ type: "text/html", value: message.html });
      }
      const request = {
        personalizations: [personalization],
        from: toSendGridAddress(message.from),
        subject: message.subject,
        content
      };
      if (message.replyTo) {
        request.reply_to = toSendGridAddress(message.replyTo);
      }
      if (message.headers) {
        request.headers = message.headers;
      }
      if (message.tags) {
        request.categories = message.tags;
      }
      if (message.attachments) {
        request.attachments = message.attachments.map((att) => ({
          content: typeof att.content === "string" ? att.content : att.content.toString("base64"),
          filename: att.filename,
          type: att.contentType,
          content_id: att.cid
        }));
      }
      request.tracking_settings = {
        click_tracking: { enable: (_a = message.trackClicks) != null ? _a : true },
        open_tracking: { enable: (_b = message.trackOpens) != null ? _b : true }
      };
      if (this.config.sandboxMode) {
        request.mail_settings = { sandbox_mode: { enable: true } };
      }
      if (message.campaignId || message.recipientId) {
        request.custom_args = __spreadValues(__spreadValues(__spreadValues({}, request.custom_args), message.campaignId && { campaign_id: message.campaignId }), message.recipientId && { recipient_id: message.recipientId });
      }
      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(request)
      });
      if (!response.ok) {
        const errorBody = await response.text();
        return {
          success: false,
          provider: "sendgrid",
          error: `SendGrid API error: ${response.status} - ${errorBody}`,
          errorCode: response.status.toString(),
          timestamp: /* @__PURE__ */ new Date()
        };
      }
      const messageId = response.headers.get("x-message-id") || void 0;
      return {
        success: true,
        messageId,
        provider: "sendgrid",
        timestamp: /* @__PURE__ */ new Date()
      };
    } catch (error) {
      const err = error;
      return {
        success: false,
        provider: "sendgrid",
        error: err.message,
        timestamp: /* @__PURE__ */ new Date(),
        raw: error
      };
    }
  }
  async sendBulk(message) {
    var _a, _b;
    if (!message.from) {
      return {
        success: false,
        provider: "sendgrid",
        totalSent: 0,
        totalFailed: message.recipients.length,
        results: message.recipients.map((r) => ({
          email: r.to.email,
          success: false,
          error: "From address is required"
        })),
        timestamp: /* @__PURE__ */ new Date()
      };
    }
    try {
      const batchSize = 1e3;
      const allResults = [];
      let totalSent = 0;
      let totalFailed = 0;
      for (let i = 0; i < message.recipients.length; i += batchSize) {
        const batch = message.recipients.slice(i, i + batchSize);
        const personalizations = batch.map((recipient) => ({
          to: [toSendGridAddress(recipient.to)],
          substitutions: recipient.substitutions,
          custom_args: recipient.metadata
        }));
        const content = [];
        if (message.text) {
          content.push({ type: "text/plain", value: message.text });
        }
        if (message.html) {
          content.push({ type: "text/html", value: message.html });
        }
        const request = {
          personalizations,
          from: toSendGridAddress(message.from),
          subject: message.subject,
          content,
          tracking_settings: {
            click_tracking: { enable: (_a = message.trackClicks) != null ? _a : true },
            open_tracking: { enable: (_b = message.trackOpens) != null ? _b : true }
          }
        };
        if (message.replyTo) {
          request.reply_to = toSendGridAddress(message.replyTo);
        }
        if (this.config.sandboxMode) {
          request.mail_settings = { sandbox_mode: { enable: true } };
        }
        const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(request)
        });
        if (response.ok) {
          const messageId = response.headers.get("x-message-id") || void 0;
          for (const recipient of batch) {
            allResults.push({
              email: recipient.to.email,
              success: true,
              messageId
            });
            totalSent++;
          }
        } else {
          const errorBody = await response.text();
          for (const recipient of batch) {
            allResults.push({
              email: recipient.to.email,
              success: false,
              error: `SendGrid API error: ${response.status} - ${errorBody}`
            });
            totalFailed++;
          }
        }
      }
      return {
        success: totalFailed === 0,
        provider: "sendgrid",
        totalSent,
        totalFailed,
        results: allResults,
        timestamp: /* @__PURE__ */ new Date()
      };
    } catch (error) {
      const err = error;
      return {
        success: false,
        provider: "sendgrid",
        totalSent: 0,
        totalFailed: message.recipients.length,
        results: message.recipients.map((r) => ({
          email: r.to.email,
          success: false,
          error: err.message
        })),
        timestamp: /* @__PURE__ */ new Date()
      };
    }
  }
  async verify() {
    try {
      const response = await fetch("https://api.sendgrid.com/v3/user/profile", {
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`
        }
      });
      return response.ok;
    } catch (e) {
      return false;
    }
  }
};

// src/lib/email/providers/resend.ts
function formatAddress2(addr) {
  return addr.name ? `${addr.name} <${addr.email}>` : addr.email;
}
function formatAddresses2(addrs) {
  const arr = Array.isArray(addrs) ? addrs : [addrs];
  return arr.map(formatAddress2);
}
var ResendProvider = class {
  constructor(config) {
    this.name = "resend";
    this.config = config;
  }
  async send(message) {
    if (!message.from) {
      return {
        success: false,
        provider: "resend",
        error: "From address is required",
        timestamp: /* @__PURE__ */ new Date()
      };
    }
    try {
      const request = {
        from: formatAddress2(message.from),
        to: formatAddresses2(message.to),
        subject: message.subject,
        html: message.html,
        text: message.text
      };
      if (message.cc) {
        request.cc = formatAddresses2(message.cc);
      }
      if (message.bcc) {
        request.bcc = formatAddresses2(message.bcc);
      }
      if (message.replyTo) {
        request.reply_to = formatAddress2(message.replyTo);
      }
      if (message.headers) {
        request.headers = message.headers;
      }
      if (message.attachments) {
        request.attachments = message.attachments.map((att) => ({
          filename: att.filename,
          content: typeof att.content === "string" ? att.content : att.content.toString("base64")
        }));
      }
      const tags = [];
      if (message.campaignId) {
        tags.push({ name: "campaign_id", value: message.campaignId });
      }
      if (message.recipientId) {
        tags.push({ name: "recipient_id", value: message.recipientId });
      }
      if (message.tags) {
        message.tags.forEach((tag) => {
          tags.push({ name: "tag", value: tag });
        });
      }
      if (tags.length > 0) {
        request.tags = tags;
      }
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(request)
      });
      const result = await response.json();
      if (!response.ok) {
        return {
          success: false,
          provider: "resend",
          error: result.message || `Resend API error: ${response.status}`,
          errorCode: result.name,
          timestamp: /* @__PURE__ */ new Date(),
          raw: result
        };
      }
      return {
        success: true,
        messageId: result.id,
        provider: "resend",
        timestamp: /* @__PURE__ */ new Date(),
        raw: result
      };
    } catch (error) {
      const err = error;
      return {
        success: false,
        provider: "resend",
        error: err.message,
        timestamp: /* @__PURE__ */ new Date(),
        raw: error
      };
    }
  }
  async sendBulk(message) {
    if (!message.from) {
      return {
        success: false,
        provider: "resend",
        totalSent: 0,
        totalFailed: message.recipients.length,
        results: message.recipients.map((r) => ({
          email: r.to.email,
          success: false,
          error: "From address is required"
        })),
        timestamp: /* @__PURE__ */ new Date()
      };
    }
    try {
      const batchSize = 100;
      const allResults = [];
      let totalSent = 0;
      let totalFailed = 0;
      for (let i = 0; i < message.recipients.length; i += batchSize) {
        const batch = message.recipients.slice(i, i + batchSize);
        const batchRequests = batch.map((recipient) => {
          var _a;
          return {
            from: formatAddress2(message.from),
            to: [formatAddress2(recipient.to)],
            subject: message.subject,
            html: message.html,
            text: message.text,
            reply_to: message.replyTo ? formatAddress2(message.replyTo) : void 0,
            tags: [
              ...message.campaignId ? [{ name: "campaign_id", value: message.campaignId }] : [],
              ...((_a = recipient.metadata) == null ? void 0 : _a.recipientId) ? [{ name: "recipient_id", value: recipient.metadata.recipientId }] : []
            ]
          };
        });
        const response = await fetch("https://api.resend.com/emails/batch", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(batchRequests)
        });
        const result = await response.json();
        if (response.ok && Array.isArray(result.data)) {
          for (let j = 0; j < batch.length; j++) {
            const itemResult = result.data[j];
            if (itemResult == null ? void 0 : itemResult.id) {
              allResults.push({
                email: batch[j].to.email,
                success: true,
                messageId: itemResult.id
              });
              totalSent++;
            } else {
              allResults.push({
                email: batch[j].to.email,
                success: false,
                error: (itemResult == null ? void 0 : itemResult.message) || "Unknown error"
              });
              totalFailed++;
            }
          }
        } else {
          for (const recipient of batch) {
            allResults.push({
              email: recipient.to.email,
              success: false,
              error: result.message || `Resend API error: ${response.status}`
            });
            totalFailed++;
          }
        }
      }
      return {
        success: totalFailed === 0,
        provider: "resend",
        totalSent,
        totalFailed,
        results: allResults,
        timestamp: /* @__PURE__ */ new Date()
      };
    } catch (error) {
      const err = error;
      return {
        success: false,
        provider: "resend",
        totalSent: 0,
        totalFailed: message.recipients.length,
        results: message.recipients.map((r) => ({
          email: r.to.email,
          success: false,
          error: err.message
        })),
        timestamp: /* @__PURE__ */ new Date()
      };
    }
  }
  async verify() {
    try {
      const response = await fetch("https://api.resend.com/domains", {
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`
        }
      });
      return response.ok;
    } catch (e) {
      return false;
    }
  }
};

// src/lib/email/providers/mailgun.ts
function formatAddress3(addr) {
  return addr.name ? `${addr.name} <${addr.email}>` : addr.email;
}
function formatAddresses3(addrs) {
  const arr = Array.isArray(addrs) ? addrs : [addrs];
  return arr.map(formatAddress3).join(", ");
}
var MailgunProvider = class {
  constructor(config) {
    this.name = "mailgun";
    this.config = config;
    this.baseUrl = config.region === "eu" ? `https://api.eu.mailgun.net/v3/${config.domain}` : `https://api.mailgun.net/v3/${config.domain}`;
  }
  getAuthHeader() {
    return "Basic " + Buffer.from(`api:${this.config.apiKey}`).toString("base64");
  }
  async send(message) {
    if (!message.from) {
      return {
        success: false,
        provider: "mailgun",
        error: "From address is required",
        timestamp: /* @__PURE__ */ new Date()
      };
    }
    try {
      const formData = new FormData();
      formData.append("from", formatAddress3(message.from));
      formData.append("to", formatAddresses3(message.to));
      formData.append("subject", message.subject);
      if (message.text) {
        formData.append("text", message.text);
      }
      if (message.html) {
        formData.append("html", message.html);
      }
      if (message.cc) {
        formData.append("cc", formatAddresses3(message.cc));
      }
      if (message.bcc) {
        formData.append("bcc", formatAddresses3(message.bcc));
      }
      if (message.replyTo) {
        formData.append("h:Reply-To", formatAddress3(message.replyTo));
      }
      if (message.headers) {
        for (const [key, value] of Object.entries(message.headers)) {
          formData.append(`h:${key}`, value);
        }
      }
      if (message.tags) {
        for (const tag of message.tags) {
          formData.append("o:tag", tag);
        }
      }
      formData.append("o:tracking", "yes");
      formData.append("o:tracking-clicks", message.trackClicks !== false ? "yes" : "no");
      formData.append("o:tracking-opens", message.trackOpens !== false ? "yes" : "no");
      if (message.campaignId) {
        formData.append("v:campaign_id", message.campaignId);
      }
      if (message.recipientId) {
        formData.append("v:recipient_id", message.recipientId);
      }
      if (message.metadata) {
        for (const [key, value] of Object.entries(message.metadata)) {
          formData.append(`v:${key}`, value);
        }
      }
      if (message.attachments) {
        for (const att of message.attachments) {
          let content;
          if (typeof att.content === "string") {
            content = att.content;
          } else {
            content = att.content.toString("base64");
          }
          const blob = new Blob([Buffer.from(content, "base64")], { type: att.contentType || "application/octet-stream" });
          if (att.cid) {
            formData.append("inline", blob, att.filename);
          } else {
            formData.append("attachment", blob, att.filename);
          }
        }
      }
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: "POST",
        headers: {
          Authorization: this.getAuthHeader()
        },
        body: formData
      });
      const result = await response.json();
      if (!response.ok) {
        return {
          success: false,
          provider: "mailgun",
          error: result.message || `Mailgun API error: ${response.status}`,
          errorCode: response.status.toString(),
          timestamp: /* @__PURE__ */ new Date(),
          raw: result
        };
      }
      return {
        success: true,
        messageId: result.id,
        provider: "mailgun",
        timestamp: /* @__PURE__ */ new Date(),
        raw: result
      };
    } catch (error) {
      const err = error;
      return {
        success: false,
        provider: "mailgun",
        error: err.message,
        timestamp: /* @__PURE__ */ new Date(),
        raw: error
      };
    }
  }
  async sendBulk(message) {
    if (!message.from) {
      return {
        success: false,
        provider: "mailgun",
        totalSent: 0,
        totalFailed: message.recipients.length,
        results: message.recipients.map((r) => ({
          email: r.to.email,
          success: false,
          error: "From address is required"
        })),
        timestamp: /* @__PURE__ */ new Date()
      };
    }
    try {
      const batchSize = 1e3;
      const allResults = [];
      let totalSent = 0;
      let totalFailed = 0;
      for (let i = 0; i < message.recipients.length; i += batchSize) {
        const batch = message.recipients.slice(i, i + batchSize);
        const formData = new FormData();
        formData.append("from", formatAddress3(message.from));
        formData.append("to", batch.map((r) => formatAddress3(r.to)).join(", "));
        formData.append("subject", message.subject);
        if (message.text) {
          formData.append("text", message.text);
        }
        if (message.html) {
          formData.append("html", message.html);
        }
        if (message.replyTo) {
          formData.append("h:Reply-To", formatAddress3(message.replyTo));
        }
        formData.append("o:tracking", "yes");
        formData.append("o:tracking-clicks", message.trackClicks !== false ? "yes" : "no");
        formData.append("o:tracking-opens", message.trackOpens !== false ? "yes" : "no");
        const recipientVariables = {};
        for (const recipient of batch) {
          recipientVariables[recipient.to.email] = __spreadValues(__spreadValues({}, recipient.substitutions), recipient.metadata);
        }
        formData.append("recipient-variables", JSON.stringify(recipientVariables));
        const response = await fetch(`${this.baseUrl}/messages`, {
          method: "POST",
          headers: {
            Authorization: this.getAuthHeader()
          },
          body: formData
        });
        const result = await response.json();
        if (response.ok) {
          for (const recipient of batch) {
            allResults.push({
              email: recipient.to.email,
              success: true,
              messageId: result.id
            });
            totalSent++;
          }
        } else {
          for (const recipient of batch) {
            allResults.push({
              email: recipient.to.email,
              success: false,
              error: result.message || `Mailgun API error: ${response.status}`
            });
            totalFailed++;
          }
        }
      }
      return {
        success: totalFailed === 0,
        provider: "mailgun",
        totalSent,
        totalFailed,
        results: allResults,
        timestamp: /* @__PURE__ */ new Date()
      };
    } catch (error) {
      const err = error;
      return {
        success: false,
        provider: "mailgun",
        totalSent: 0,
        totalFailed: message.recipients.length,
        results: message.recipients.map((r) => ({
          email: r.to.email,
          success: false,
          error: err.message
        })),
        timestamp: /* @__PURE__ */ new Date()
      };
    }
  }
  async verify() {
    try {
      const response = await fetch(`${this.baseUrl}`, {
        headers: {
          Authorization: this.getAuthHeader()
        }
      });
      return response.ok;
    } catch (e) {
      return false;
    }
  }
};

// src/lib/email/providers/ses.ts
async function signRequest(config, method, url, body, headers) {
  const now = /* @__PURE__ */ new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const host = new URL(url).host;
  const service = "ses";
  const signedHeaders = "content-type;host;x-amz-date";
  const canonicalHeaders = `content-type:${headers["Content-Type"]}
host:${host}
x-amz-date:${amzDate}
`;
  const encoder = new TextEncoder();
  const payloadHash = await crypto.subtle.digest("SHA-256", encoder.encode(body));
  const payloadHashHex = Array.from(new Uint8Array(payloadHash)).map((b) => b.toString(16).padStart(2, "0")).join("");
  const canonicalRequest = `${method}
/

${canonicalHeaders}
${signedHeaders}
${payloadHashHex}`;
  const credentialScope = `${dateStamp}/${config.region}/${service}/aws4_request`;
  const canonicalRequestHash = await crypto.subtle.digest("SHA-256", encoder.encode(canonicalRequest));
  const canonicalRequestHashHex = Array.from(new Uint8Array(canonicalRequestHash)).map((b) => b.toString(16).padStart(2, "0")).join("");
  const stringToSign = `AWS4-HMAC-SHA256
${amzDate}
${credentialScope}
${canonicalRequestHashHex}`;
  async function hmac(key, data) {
    const keyData = typeof key === "string" ? encoder.encode(key) : key;
    const cryptoKey = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    return crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(data));
  }
  const kDate = await hmac(`AWS4${config.secretAccessKey}`, dateStamp);
  const kRegion = await hmac(kDate, config.region);
  const kService = await hmac(kRegion, service);
  const kSigning = await hmac(kService, "aws4_request");
  const signature = await hmac(kSigning, stringToSign);
  const signatureHex = Array.from(new Uint8Array(signature)).map((b) => b.toString(16).padStart(2, "0")).join("");
  const authorizationHeader = `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signatureHex}`;
  return __spreadProps(__spreadValues({}, headers), {
    "X-Amz-Date": amzDate,
    Authorization: authorizationHeader
  });
}
function formatAddress4(addr) {
  return addr.name ? `${addr.name} <${addr.email}>` : addr.email;
}
var SesProvider = class {
  constructor(config) {
    this.name = "ses";
    this.config = config;
    this.endpoint = `https://email.${config.region}.amazonaws.com`;
  }
  async send(message) {
    if (!message.from) {
      return {
        success: false,
        provider: "ses",
        error: "From address is required",
        timestamp: /* @__PURE__ */ new Date()
      };
    }
    try {
      const params = new URLSearchParams();
      params.append("Action", "SendEmail");
      params.append("Version", "2010-12-01");
      params.append("Source", formatAddress4(message.from));
      const toAddrs = Array.isArray(message.to) ? message.to : [message.to];
      toAddrs.forEach((addr, i) => {
        params.append(`Destination.ToAddresses.member.${i + 1}`, formatAddress4(addr));
      });
      if (message.cc) {
        const ccAddrs = Array.isArray(message.cc) ? message.cc : [message.cc];
        ccAddrs.forEach((addr, i) => {
          params.append(`Destination.CcAddresses.member.${i + 1}`, formatAddress4(addr));
        });
      }
      if (message.bcc) {
        const bccAddrs = Array.isArray(message.bcc) ? message.bcc : [message.bcc];
        bccAddrs.forEach((addr, i) => {
          params.append(`Destination.BccAddresses.member.${i + 1}`, formatAddress4(addr));
        });
      }
      params.append("Message.Subject.Data", message.subject);
      params.append("Message.Subject.Charset", "UTF-8");
      if (message.text) {
        params.append("Message.Body.Text.Data", message.text);
        params.append("Message.Body.Text.Charset", "UTF-8");
      }
      if (message.html) {
        params.append("Message.Body.Html.Data", message.html);
        params.append("Message.Body.Html.Charset", "UTF-8");
      }
      if (message.replyTo) {
        params.append("ReplyToAddresses.member.1", formatAddress4(message.replyTo));
      }
      let tagIndex = 1;
      if (message.campaignId) {
        params.append(`Tags.member.${tagIndex}.Name`, "campaign_id");
        params.append(`Tags.member.${tagIndex}.Value`, message.campaignId);
        tagIndex++;
      }
      if (message.recipientId) {
        params.append(`Tags.member.${tagIndex}.Name`, "recipient_id");
        params.append(`Tags.member.${tagIndex}.Value`, message.recipientId);
        tagIndex++;
      }
      if (message.tags) {
        for (const tag of message.tags) {
          params.append(`Tags.member.${tagIndex}.Name`, "tag");
          params.append(`Tags.member.${tagIndex}.Value`, tag);
          tagIndex++;
        }
      }
      const body = params.toString();
      const headers = {
        "Content-Type": "application/x-www-form-urlencoded"
      };
      const signedHeaders = await signRequest(this.config, "POST", this.endpoint, body, headers);
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: signedHeaders,
        body
      });
      const responseText = await response.text();
      if (!response.ok) {
        const errorMatch = responseText.match(/<Message>([^<]+)<\/Message>/);
        const errorMessage = errorMatch ? errorMatch[1] : `SES API error: ${response.status}`;
        return {
          success: false,
          provider: "ses",
          error: errorMessage,
          errorCode: response.status.toString(),
          timestamp: /* @__PURE__ */ new Date(),
          raw: responseText
        };
      }
      const messageIdMatch = responseText.match(/<MessageId>([^<]+)<\/MessageId>/);
      const messageId = messageIdMatch ? messageIdMatch[1] : void 0;
      return {
        success: true,
        messageId,
        provider: "ses",
        timestamp: /* @__PURE__ */ new Date(),
        raw: responseText
      };
    } catch (error) {
      const err = error;
      return {
        success: false,
        provider: "ses",
        error: err.message,
        timestamp: /* @__PURE__ */ new Date(),
        raw: error
      };
    }
  }
  async sendBulk(message) {
    const results = [];
    let totalSent = 0;
    let totalFailed = 0;
    for (const recipient of message.recipients) {
      const result = await this.send(__spreadProps(__spreadValues({}, message), {
        to: recipient.to,
        metadata: __spreadValues(__spreadValues({}, message.metadata), recipient.metadata)
      }));
      results.push({
        email: recipient.to.email,
        success: result.success,
        messageId: result.messageId,
        error: result.error
      });
      if (result.success) {
        totalSent++;
      } else {
        totalFailed++;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return {
      success: totalFailed === 0,
      provider: "ses",
      totalSent,
      totalFailed,
      results,
      timestamp: /* @__PURE__ */ new Date()
    };
  }
  async verify() {
    try {
      const params = new URLSearchParams();
      params.append("Action", "GetSendQuota");
      params.append("Version", "2010-12-01");
      const body = params.toString();
      const headers = {
        "Content-Type": "application/x-www-form-urlencoded"
      };
      const signedHeaders = await signRequest(this.config, "POST", this.endpoint, body, headers);
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: signedHeaders,
        body
      });
      return response.ok;
    } catch (e) {
      return false;
    }
  }
};

// src/lib/email/merge-tags.ts
var formatters = {
  // Default value if empty/undefined
  default: (value, defaultValue = "") => {
    if (value === null || value === void 0 || value === "") {
      return defaultValue;
    }
    return String(value);
  },
  // Currency formatting
  currency: (value, currency = "USD", locale = "en-US") => {
    const num = typeof value === "number" ? value : parseFloat(String(value));
    if (isNaN(num)) return String(value);
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency
    }).format(num / 100);
  },
  // Date formatting
  date: (value, format = "short", locale = "en-US") => {
    const date = value instanceof Date ? value : new Date(String(value));
    if (isNaN(date.getTime())) return String(value);
    const options = {};
    switch (format) {
      case "short":
        options.dateStyle = "short";
        break;
      case "medium":
        options.dateStyle = "medium";
        break;
      case "long":
        options.dateStyle = "long";
        break;
      case "full":
        options.dateStyle = "full";
        break;
      default:
        options.dateStyle = "short";
    }
    return new Intl.DateTimeFormat(locale, options).format(date);
  },
  // Time formatting
  time: (value, format = "short", locale = "en-US") => {
    const date = value instanceof Date ? value : new Date(String(value));
    if (isNaN(date.getTime())) return String(value);
    const options = {};
    switch (format) {
      case "short":
        options.timeStyle = "short";
        break;
      case "medium":
        options.timeStyle = "medium";
        break;
      case "long":
        options.timeStyle = "long";
        break;
      default:
        options.timeStyle = "short";
    }
    return new Intl.DateTimeFormat(locale, options).format(date);
  },
  // Number formatting
  number: (value, locale = "en-US") => {
    const num = typeof value === "number" ? value : parseFloat(String(value));
    if (isNaN(num)) return String(value);
    return new Intl.NumberFormat(locale).format(num);
  },
  // Percent formatting
  percent: (value, decimals = "0") => {
    const num = typeof value === "number" ? value : parseFloat(String(value));
    if (isNaN(num)) return String(value);
    return `${(num * 100).toFixed(parseInt(decimals))}%`;
  },
  // Uppercase
  upper: (value) => String(value).toUpperCase(),
  // Lowercase
  lower: (value) => String(value).toLowerCase(),
  // Capitalize first letter
  capitalize: (value) => {
    const str = String(value);
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  },
  // Title case
  title: (value) => {
    return String(value).split(" ").map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ");
  },
  // Truncate
  truncate: (value, length = "50", suffix = "...") => {
    const str = String(value);
    const maxLength = parseInt(length);
    if (str.length <= maxLength) return str;
    return str.slice(0, maxLength) + suffix;
  },
  // URL encode
  urlencode: (value) => encodeURIComponent(String(value)),
  // HTML escape
  escape: (value) => {
    return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }
};
function getNestedValue(data, path) {
  const parts = path.split(".");
  let current = data;
  for (const part of parts) {
    if (current === null || current === void 0) {
      return void 0;
    }
    if (typeof current === "object" && part in current) {
      current = current[part];
    } else {
      return void 0;
    }
  }
  return current;
}
function parseFormatter(formatterStr) {
  const parts = formatterStr.split(":");
  return {
    name: parts[0],
    args: parts.slice(1)
  };
}
function processMergeTag(tag, data) {
  let content = tag.slice(2, -2).trim();
  let formatterStr = null;
  const pipeIndex = content.indexOf("|");
  if (pipeIndex !== -1) {
    formatterStr = content.slice(pipeIndex + 1).trim();
    content = content.slice(0, pipeIndex).trim();
  }
  let value = getNestedValue(data, content);
  if (value === void 0) {
    const mailchimpMappings = {
      FNAME: "subscriber.firstName",
      LNAME: "subscriber.lastName",
      EMAIL: "subscriber.email",
      MERGE0: "subscriber.email",
      MERGE1: "subscriber.firstName",
      MERGE2: "subscriber.lastName"
    };
    if (content in mailchimpMappings) {
      value = getNestedValue(data, mailchimpMappings[content]);
    }
  }
  if (formatterStr) {
    const defaultMatch = formatterStr.match(/^default:"([^"]*)"$/);
    if (defaultMatch) {
      return formatters.default(value, defaultMatch[1]);
    }
    const { name, args } = parseFormatter(formatterStr);
    const formatter = formatters[name];
    if (formatter) {
      return formatter(value, ...args);
    }
  }
  if (value === null || value === void 0) {
    return "";
  }
  return String(value);
}
function processConditionals(template, data) {
  const ifRegex = /\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
  return template.replace(ifRegex, (_, condition, content) => {
    const value = getNestedValue(data, condition.trim());
    const isTruthy = Boolean(value) && value !== "" && value !== 0 && value !== "0";
    const parts = content.split(/\{\{else\}\}/);
    if (isTruthy) {
      return parts[0] || "";
    } else {
      return parts[1] || "";
    }
  });
}
function processLoops(template, data) {
  const eachRegex = /\{\{#each\s+([^}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g;
  return template.replace(eachRegex, (_, arrayPath, content) => {
    const items = getNestedValue(data, arrayPath.trim());
    if (!Array.isArray(items)) {
      return "";
    }
    return items.map((item, index) => {
      const itemData = __spreadProps(__spreadValues({}, data), {
        "@index": index,
        "@first": index === 0,
        "@last": index === items.length - 1,
        this: item
      });
      let itemContent = content.replace(/\{\{this\.([^}|]+)([^}]*)?\}\}/g, (_2, path, rest) => {
        const fullTag = `{{${path}${rest || ""}}}`;
        return processMergeTag(fullTag, item);
      });
      itemContent = itemContent.replace(/\{\{([a-zA-Z_][a-zA-Z0-9_]*)([^}]*)?\}\}/g, (match, path, rest) => {
        if (path.startsWith("#") || path.startsWith("/") || path === "else") {
          return match;
        }
        if (typeof item === "object" && item !== null && path in item) {
          const fullTag = `{{${path}${rest || ""}}}`;
          return processMergeTag(fullTag, item);
        }
        return match;
      });
      return processMergeTagsInternal(itemContent, itemData);
    }).join("");
  });
}
function processMergeTagsInternal(template, data) {
  const tagRegex = /\{\{([^#/}][^}]*)\}\}/g;
  return template.replace(tagRegex, (match) => processMergeTag(match, data));
}
function parseMergeTags(template, data) {
  let result = template;
  result = processLoops(result, data);
  result = processConditionals(result, data);
  result = processMergeTagsInternal(result, data);
  return result;
}
function extractMergeTags(template) {
  const tags = /* @__PURE__ */ new Set();
  const simpleRegex = /\{\{([^#/}][^}|]*)/g;
  let match;
  while ((match = simpleRegex.exec(template)) !== null) {
    tags.add(match[1].trim());
  }
  const ifRegex = /\{\{#if\s+([^}]+)\}\}/g;
  while ((match = ifRegex.exec(template)) !== null) {
    tags.add(match[1].trim());
  }
  const eachRegex = /\{\{#each\s+([^}]+)\}\}/g;
  while ((match = eachRegex.exec(template)) !== null) {
    tags.add(match[1].trim());
  }
  return Array.from(tags);
}
function validateMergeTagData(template, data) {
  const tags = extractMergeTags(template);
  const missing = [];
  for (const tag of tags) {
    const value = getNestedValue(data, tag);
    if (value === void 0) {
      missing.push(tag);
    }
  }
  return {
    valid: missing.length === 0,
    missing
  };
}
function registerFormatter(name, formatter) {
  formatters[name] = formatter;
}
function getFormatters() {
  return Object.keys(formatters);
}

// src/lib/encryption/index.ts
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";
var ALGORITHM = "aes-256-gcm";
var IV_LENGTH = 16;
var SALT_LENGTH = 32;
var KEY_LENGTH = 32;
function getEncryptionKey() {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    console.warn(
      "WARNING: ENCRYPTION_KEY not set. Using fallback key. Set ENCRYPTION_KEY in production!"
    );
    return scryptSync("development-fallback-key", "salt", KEY_LENGTH);
  }
  if (key.length === 64) {
    return Buffer.from(key, "hex");
  }
  return scryptSync(key, "nextjs-cms-salt", KEY_LENGTH);
}
function encrypt(plaintext) {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const salt = randomBytes(SALT_LENGTH);
  const derivedKey = scryptSync(key, salt, KEY_LENGTH);
  const cipher = createCipheriv(ALGORITHM, derivedKey, iv);
  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag();
  return `${salt.toString("hex")}:${iv.toString("hex")}:${tag.toString("hex")}:${encrypted}`;
}
function decrypt(encryptedData) {
  const key = getEncryptionKey();
  const parts = encryptedData.split(":");
  if (parts.length !== 4) {
    throw new Error("Invalid encrypted data format");
  }
  const [saltHex, ivHex, tagHex, encrypted] = parts;
  const salt = Buffer.from(saltHex, "hex");
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const derivedKey = scryptSync(key, salt, KEY_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, derivedKey, iv);
  decipher.setAuthTag(tag);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
function isEncrypted(value) {
  const parts = value.split(":");
  if (parts.length !== 4) return false;
  return parts.every((part) => /^[0-9a-f]+$/i.test(part));
}
function safeEncrypt(value) {
  try {
    return encrypt(value);
  } catch (error) {
    console.error("Encryption failed:", error);
    return value;
  }
}
function safeDecrypt(value) {
  try {
    if (!isEncrypted(value)) {
      return value;
    }
    return decrypt(value);
  } catch (error) {
    console.error("Decryption failed:", error);
    return value;
  }
}
function hash(value) {
  const salt = randomBytes(16).toString("hex");
  const hashed = scryptSync(value, salt, 64).toString("hex");
  return `${salt}:${hashed}`;
}
function verifyHash(value, hashedValue) {
  const [salt, originalHash] = hashedValue.split(":");
  const hashed = scryptSync(value, salt, 64).toString("hex");
  return hashed === originalHash;
}

// src/lib/settings/types.ts
var DEFAULT_BRANDING_SETTINGS = {
  siteName: process.env.NEXT_PUBLIC_SITE_NAME || "My Site",
  siteTagline: "Welcome to our platform",
  primaryColor: "#0066cc",
  accentColor: "#6366f1"
};
var DEFAULT_GENERAL_SETTINGS = {
  siteName: "My Store",
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  supportEmail: "support@example.com",
  timezone: "America/New_York",
  currency: "USD",
  locale: "en-US"
};
var DEFAULT_EMAIL_SETTINGS = {
  provider: "smtp",
  fromName: "My Store",
  fromEmail: "noreply@example.com"
};
var DEFAULT_STORAGE_SETTINGS = {
  provider: "s3",
  maxFileSize: 10,
  // 10MB
  allowedFileTypes: ["image/*", "application/pdf"]
};
var DEFAULT_AI_SETTINGS = {
  enabled: false,
  provider: "openai",
  model: "gpt-4o",
  maxTokens: 4096,
  temperature: 0.7
};
var DEFAULT_SECURITY_SETTINGS = {
  allowRegistration: true,
  requireEmailVerification: true,
  sessionTimeout: 60,
  maxLoginAttempts: 5,
  lockoutDuration: 15,
  twoFactorEnabled: false,
  passwordMinLength: 8,
  passwordRequireUppercase: true,
  passwordRequireNumbers: true,
  passwordRequireSymbols: false
};
var REQUIRED_ENV_VARS = [
  // Database
  { name: "DATABASE_URL", configured: false, required: true, group: "general", description: "PostgreSQL connection string" },
  // Auth
  { name: "NEXTAUTH_SECRET", configured: false, required: true, group: "security", description: "NextAuth secret for session encryption" },
  { name: "NEXTAUTH_URL", configured: false, required: true, group: "security", description: "Application URL for auth callbacks" },
  // Stripe
  { name: "STRIPE_SECRET_KEY", configured: false, required: false, group: "payments", description: "Stripe API secret key" },
  { name: "STRIPE_WEBHOOK_SECRET", configured: false, required: false, group: "payments", description: "Stripe webhook signing secret" },
  { name: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", configured: false, required: false, group: "payments", description: "Stripe publishable key (public)" },
  // Shippo
  { name: "SHIPPO_API_KEY", configured: false, required: false, group: "shipping", description: "Shippo API token" },
  { name: "SHIPPO_WEBHOOK_SECRET", configured: false, required: false, group: "shipping", description: "Shippo webhook secret" },
  // Analytics
  { name: "NEXT_PUBLIC_GA_MEASUREMENT_ID", configured: false, required: false, group: "analytics", description: "Google Analytics 4 Measurement ID" },
  { name: "NEXT_PUBLIC_MATOMO_URL", configured: false, required: false, group: "analytics", description: "Matomo server URL" },
  { name: "NEXT_PUBLIC_MATOMO_SITE_ID", configured: false, required: false, group: "analytics", description: "Matomo site ID" },
  // Storage (S3/R2)
  { name: "S3_BUCKET", configured: false, required: false, group: "storage", description: "S3 bucket name" },
  { name: "S3_REGION", configured: false, required: false, group: "storage", description: "S3 region" },
  { name: "S3_ACCESS_KEY_ID", configured: false, required: false, group: "storage", description: "S3 access key ID" },
  { name: "S3_SECRET_ACCESS_KEY", configured: false, required: false, group: "storage", description: "S3 secret access key" },
  { name: "S3_ENDPOINT", configured: false, required: false, group: "storage", description: "S3-compatible endpoint (for R2)" },
  // AI
  { name: "OPENAI_API_KEY", configured: false, required: false, group: "ai", description: "OpenAI API key" },
  { name: "ANTHROPIC_API_KEY", configured: false, required: false, group: "ai", description: "Anthropic API key" },
  { name: "GOOGLE_AI_API_KEY", configured: false, required: false, group: "ai", description: "Google AI API key" },
  // Email
  { name: "SMTP_HOST", configured: false, required: false, group: "email", description: "SMTP server host" },
  { name: "SMTP_PORT", configured: false, required: false, group: "email", description: "SMTP server port" },
  { name: "SMTP_USER", configured: false, required: false, group: "email", description: "SMTP username" },
  { name: "SMTP_PASS", configured: false, required: false, group: "email", description: "SMTP password" },
  { name: "SENDGRID_API_KEY", configured: false, required: false, group: "email", description: "SendGrid API key" },
  { name: "RESEND_API_KEY", configured: false, required: false, group: "email", description: "Resend API key" }
];

// src/lib/settings/index.ts
var SENSITIVE_KEYS = {
  email: ["smtpPass", "sendgridApiKey", "resendApiKey", "mailgunApiKey", "sesAccessKeyId", "sesSecretAccessKey"],
  storage: ["accessKeyId", "secretAccessKey"],
  ai: ["apiKey"],
  payments: ["stripeSecretKey", "stripeWebhookSecret", "paypalClientSecret"],
  branding: [],
  general: [],
  store: [],
  shipping: [],
  analytics: [],
  seo: [],
  security: []
};
var settingsCache = /* @__PURE__ */ new Map();
var CACHE_TTL = 60 * 1e3;
async function getSettings(group, defaults) {
  const cached = settingsCache.get(group);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  const records = await prisma.setting.findMany({
    where: { group }
  });
  const settings = __spreadValues({}, defaults);
  const sensitiveKeys = SENSITIVE_KEYS[group] || [];
  for (const record of records) {
    const key = record.key.replace(`${group}.`, "");
    let value = record.value;
    if (sensitiveKeys.includes(key) && record.encrypted && isEncrypted(value)) {
      value = safeDecrypt(value);
    }
    try {
      settings[key] = JSON.parse(value);
    } catch (e) {
      settings[key] = value;
    }
  }
  settingsCache.set(group, { data: settings, timestamp: Date.now() });
  return settings;
}
async function updateSettings(group, settings) {
  const sensitiveKeys = SENSITIVE_KEYS[group] || [];
  for (const [key, value] of Object.entries(settings)) {
    if (value === void 0) continue;
    if (value === "********") continue;
    const fullKey = `${group}.${key}`;
    const isSensitive = sensitiveKeys.includes(key);
    let stringValue = typeof value === "string" ? value : JSON.stringify(value);
    if (isSensitive && stringValue && stringValue !== "") {
      stringValue = encrypt(stringValue);
    }
    await prisma.setting.upsert({
      where: { key: fullKey },
      create: {
        key: fullKey,
        value: stringValue,
        group,
        encrypted: isSensitive
      },
      update: {
        value: stringValue,
        encrypted: isSensitive
      }
    });
  }
  settingsCache.delete(group);
}
function clearSettingsCache(group) {
  if (group) {
    settingsCache.delete(group);
  } else {
    settingsCache.clear();
  }
}
async function getBrandingSettings() {
  return getSettings("branding", DEFAULT_BRANDING_SETTINGS);
}
async function getGeneralSettings() {
  return getSettings("general", DEFAULT_GENERAL_SETTINGS);
}
async function getEmailSettings() {
  const settings = await getSettings("email", DEFAULT_EMAIL_SETTINGS);
  if (!settings.smtpHost) settings.smtpHost = process.env.SMTP_HOST;
  if (!settings.smtpPort) settings.smtpPort = parseInt(process.env.SMTP_PORT || "587");
  if (!settings.smtpUser) settings.smtpUser = process.env.SMTP_USER;
  if (!settings.smtpPass) settings.smtpPass = process.env.SMTP_PASS;
  if (!settings.sendgridApiKey) settings.sendgridApiKey = process.env.SENDGRID_API_KEY;
  if (!settings.resendApiKey) settings.resendApiKey = process.env.RESEND_API_KEY;
  return settings;
}
async function getStorageSettings() {
  const settings = await getSettings("storage", DEFAULT_STORAGE_SETTINGS);
  if (!settings.bucket) settings.bucket = process.env.S3_BUCKET || process.env.R2_BUCKET;
  if (!settings.region) settings.region = process.env.S3_REGION || "auto";
  if (!settings.accessKeyId) settings.accessKeyId = process.env.S3_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID;
  if (!settings.secretAccessKey) settings.secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY;
  if (!settings.endpoint) {
    if (process.env.S3_ENDPOINT) {
      settings.endpoint = process.env.S3_ENDPOINT;
    } else if (process.env.R2_ACCOUNT_ID) {
      settings.endpoint = `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
    }
  }
  if (!settings.publicUrl) settings.publicUrl = process.env.R2_PUBLIC_URL;
  if (process.env.R2_BUCKET || process.env.R2_ACCOUNT_ID) {
    settings.provider = "r2";
  }
  return settings;
}
async function getAiSettings() {
  const settings = await getSettings("ai", DEFAULT_AI_SETTINGS);
  if (!settings.apiKey) {
    switch (settings.provider) {
      case "openai":
        settings.apiKey = process.env.OPENAI_API_KEY;
        break;
      case "anthropic":
        settings.apiKey = process.env.ANTHROPIC_API_KEY;
        break;
      case "google":
        settings.apiKey = process.env.GOOGLE_AI_API_KEY;
        break;
    }
  }
  return settings;
}
async function getSecuritySettings() {
  return getSettings("security", DEFAULT_SECURITY_SETTINGS);
}
function getEnvVarStatus() {
  return REQUIRED_ENV_VARS.map((envVar) => __spreadProps(__spreadValues({}, envVar), {
    configured: !!process.env[envVar.name]
  }));
}
async function getAllSettings() {
  const [branding, general, email, storage, ai, security] = await Promise.all([
    getBrandingSettings(),
    getGeneralSettings(),
    getEmailSettings(),
    getStorageSettings(),
    getAiSettings(),
    getSecuritySettings()
  ]);
  return {
    branding,
    general,
    email: __spreadProps(__spreadValues({}, email), {
      // Mask sensitive values
      smtpPass: email.smtpPass ? "********" : void 0,
      sendgridApiKey: email.sendgridApiKey ? "********" : void 0,
      resendApiKey: email.resendApiKey ? "********" : void 0,
      mailgunApiKey: email.mailgunApiKey ? "********" : void 0,
      sesSecretAccessKey: email.sesSecretAccessKey ? "********" : void 0
    }),
    storage: __spreadProps(__spreadValues({}, storage), {
      secretAccessKey: storage.secretAccessKey ? "********" : void 0
    }),
    ai: __spreadProps(__spreadValues({}, ai), {
      apiKey: ai.apiKey ? "********" : void 0
    }),
    security,
    envVars: getEnvVarStatus()
  };
}

// src/lib/email/tracking.ts
import crypto2 from "crypto";
var APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
function generateTrackingToken() {
  return crypto2.randomBytes(16).toString("hex");
}
function createOpenTrackingUrl(recipientId, campaignId) {
  const params = new URLSearchParams(__spreadValues({
    r: recipientId
  }, campaignId && { c: campaignId }));
  return `${APP_URL}/api/email/track/open?${params.toString()}`;
}
function createClickTrackingUrl(recipientId, originalUrl, linkId, campaignId) {
  const params = new URLSearchParams(__spreadValues(__spreadValues({
    r: recipientId,
    u: originalUrl
  }, linkId && { l: linkId }), campaignId && { c: campaignId }));
  return `${APP_URL}/api/email/track/click?${params.toString()}`;
}
function createUnsubscribeUrl(subscriberId, token) {
  const params = new URLSearchParams(__spreadValues({
    s: subscriberId
  }, token && { t: token }));
  return `${APP_URL}/api/email/unsubscribe?${params.toString()}`;
}
function createPreferenceCenterUrl(subscriberId, token) {
  const params = new URLSearchParams(__spreadValues({
    s: subscriberId
  }, token && { t: token }));
  return `${APP_URL}/email/preferences?${params.toString()}`;
}
function injectOpenTrackingPixel(html, recipientId, campaignId) {
  const trackingUrl = createOpenTrackingUrl(recipientId, campaignId);
  const pixel = `<img src="${trackingUrl}" width="1" height="1" alt="" style="display:none;width:1px;height:1px;border:0;" />`;
  if (html.includes("</body>")) {
    return html.replace("</body>", `${pixel}</body>`);
  }
  return html + pixel;
}
function rewriteLinksForTracking(html, recipientId, campaignId, excludePatterns = []) {
  const defaultExclusions = [
    /^mailto:/i,
    /^tel:/i,
    /^#/,
    /^javascript:/i,
    /unsubscribe/i,
    /preference/i
  ];
  const exclusions = [...defaultExclusions, ...excludePatterns];
  const hrefRegex = /href=["']([^"']+)["']/gi;
  return html.replace(hrefRegex, (match, url) => {
    for (const pattern of exclusions) {
      if (pattern.test(url)) {
        return match;
      }
    }
    if (url.includes("/api/email/track/")) {
      return match;
    }
    const trackedUrl = createClickTrackingUrl(recipientId, url, void 0, campaignId);
    return `href="${trackedUrl}"`;
  });
}
function getUnsubscribeHeaders(subscriberId, token) {
  const unsubscribeUrl = createUnsubscribeUrl(subscriberId, token);
  return {
    "List-Unsubscribe": `<${unsubscribeUrl}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click"
  };
}
function processEmailForTracking(html, recipientId, options = {}) {
  let processed = html;
  if (options.trackClicks !== false) {
    processed = rewriteLinksForTracking(processed, recipientId, options.campaignId, options.excludeLinkPatterns);
  }
  if (options.trackOpens !== false) {
    processed = injectOpenTrackingPixel(processed, recipientId, options.campaignId);
  }
  return processed;
}
async function recordEmailOpen(recipientId, metadata) {
  const now = /* @__PURE__ */ new Date();
  await prisma.emailRecipient.update({
    where: { id: recipientId },
    data: {
      openedAt: now,
      openCount: { increment: 1 }
    }
  });
  if (metadata == null ? void 0 : metadata.campaignId) {
    await prisma.emailCampaign.update({
      where: { id: metadata.campaignId },
      data: {
        openCount: { increment: 1 }
        // uniqueOpenCount handled separately with deduplication
      }
    });
  }
  await prisma.$executeRaw`
    UPDATE email_subscribers es
    SET
      total_opens = total_opens + 1,
      last_engaged_at = ${now},
      engagement_score = LEAST(engagement_score + 1, 100)
    FROM email_recipients er
    WHERE er.id = ${recipientId}
    AND es.email = er.email
  `;
}
async function recordEmailClick(recipientId, url, metadata) {
  const now = /* @__PURE__ */ new Date();
  await prisma.emailRecipient.update({
    where: { id: recipientId },
    data: {
      clickedAt: now,
      clickCount: { increment: 1 }
    }
  });
  if (metadata == null ? void 0 : metadata.linkId) {
    await prisma.emailLinkClick.create({
      data: {
        linkId: metadata.linkId,
        recipientId,
        clickedAt: now,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent
      }
    });
    await prisma.emailLink.update({
      where: { id: metadata.linkId },
      data: {
        clickCount: { increment: 1 }
      }
    });
  }
  if (metadata == null ? void 0 : metadata.campaignId) {
    await prisma.emailCampaign.update({
      where: { id: metadata.campaignId },
      data: {
        clickCount: { increment: 1 }
      }
    });
  }
  await prisma.$executeRaw`
    UPDATE email_subscribers es
    SET
      total_clicks = total_clicks + 1,
      last_engaged_at = ${now},
      engagement_score = LEAST(engagement_score + 2, 100)
    FROM email_recipients er
    WHERE er.id = ${recipientId}
    AND es.email = er.email
  `;
}
async function getOrCreateTrackedLink(campaignId, targetUrl) {
  let link = await prisma.emailLink.findFirst({
    where: {
      campaignId,
      url: targetUrl
    }
  });
  if (!link) {
    link = await prisma.emailLink.create({
      data: {
        campaignId,
        url: targetUrl,
        clickCount: 0
      }
    });
  }
  return link.id;
}
async function rewriteLinksWithTracking(html, recipientId, campaignId, excludePatterns = []) {
  const defaultExclusions = [
    /^mailto:/i,
    /^tel:/i,
    /^#/,
    /^javascript:/i,
    /unsubscribe/i,
    /preference/i
  ];
  const exclusions = [...defaultExclusions, ...excludePatterns];
  const hrefRegex = /href=["']([^"']+)["']/gi;
  const links = [];
  let match;
  while ((match = hrefRegex.exec(html)) !== null) {
    const url = match[1];
    let shouldExclude = false;
    for (const pattern of exclusions) {
      if (pattern.test(url)) {
        shouldExclude = true;
        break;
      }
    }
    if (!shouldExclude && !url.includes("/api/email/track/")) {
      links.push(url);
    }
  }
  const linkMap = /* @__PURE__ */ new Map();
  for (const url of links) {
    const linkId = await getOrCreateTrackedLink(campaignId, url);
    linkMap.set(url, linkId);
  }
  return html.replace(hrefRegex, (match2, url) => {
    const linkId = linkMap.get(url);
    if (!linkId) {
      return match2;
    }
    const trackedUrl = createClickTrackingUrl(recipientId, url, linkId, campaignId);
    return `href="${trackedUrl}"`;
  });
}

// src/lib/email/webhooks.ts
import crypto3 from "crypto";
async function processEmailWebhookEvent(event) {
  const now = /* @__PURE__ */ new Date();
  switch (event.type) {
    case "bounced":
    case "soft_bounced":
      await handleBounce(event);
      break;
    case "complained":
      await handleComplaint(event);
      break;
    case "delivered":
      await handleDelivery(event);
      break;
    case "unsubscribed":
      await handleUnsubscribe(event);
      break;
    case "opened":
    case "clicked":
      break;
    case "dropped":
    case "deferred":
      await handleDropped(event);
      break;
  }
  console.log(`Email event: ${event.type} for ${event.email} via ${event.provider}`);
}
async function handleBounce(event) {
  const isHardBounce = event.bounceType === "hard";
  await prisma.emailSubscriber.updateMany({
    where: { email: event.email },
    data: {
      status: isHardBounce ? "BOUNCED" : "ACTIVE",
      unsubscribedAt: isHardBounce ? /* @__PURE__ */ new Date() : void 0
    }
  });
  if (event.recipientId) {
    await prisma.emailRecipient.update({
      where: { id: event.recipientId },
      data: {
        bouncedAt: /* @__PURE__ */ new Date(),
        bounceType: event.bounceType,
        errorMessage: event.bounceReason
      }
    });
  } else if (event.messageId) {
    await prisma.emailRecipient.updateMany({
      where: {
        email: event.email,
        providerMessageId: event.messageId
      },
      data: {
        bouncedAt: /* @__PURE__ */ new Date(),
        bounceType: event.bounceType,
        errorMessage: event.bounceReason
      }
    });
  }
  if (event.campaignId) {
    await prisma.emailCampaign.update({
      where: { id: event.campaignId },
      data: {
        bounceCount: { increment: 1 }
      }
    });
  }
}
async function handleComplaint(event) {
  await prisma.emailSubscriber.updateMany({
    where: { email: event.email },
    data: {
      status: "COMPLAINED",
      unsubscribedAt: /* @__PURE__ */ new Date()
    }
  });
  if (event.recipientId) {
    await prisma.emailRecipient.update({
      where: { id: event.recipientId },
      data: {
        bouncedAt: /* @__PURE__ */ new Date(),
        errorMessage: `Spam complaint: ${event.complaintType || "unknown"}`
      }
    });
  }
  if (event.campaignId) {
    await prisma.emailCampaign.update({
      where: { id: event.campaignId },
      data: {
        bounceCount: { increment: 1 }
      }
    });
  }
}
async function handleDelivery(event) {
  if (event.recipientId) {
    await prisma.emailRecipient.update({
      where: { id: event.recipientId },
      data: {
        sentAt: /* @__PURE__ */ new Date(),
        status: "SENT"
      }
    });
  }
  if (event.campaignId) {
    await prisma.emailCampaign.update({
      where: { id: event.campaignId },
      data: {
        sentCount: { increment: 1 }
      }
    });
  }
}
async function handleUnsubscribe(event) {
  await prisma.emailSubscriber.updateMany({
    where: { email: event.email },
    data: {
      status: "UNSUBSCRIBED",
      unsubscribedAt: /* @__PURE__ */ new Date()
    }
  });
  if (event.campaignId) {
    await prisma.emailCampaign.update({
      where: { id: event.campaignId },
      data: {
        unsubscribeCount: { increment: 1 }
      }
    });
  }
}
async function handleDropped(event) {
  if (event.recipientId) {
    await prisma.emailRecipient.update({
      where: { id: event.recipientId },
      data: {
        status: "FAILED",
        errorMessage: event.bounceReason || `Email ${event.type}`
      }
    });
  }
}
function parseSendGridWebhook(payload) {
  const events = [];
  if (!Array.isArray(payload)) {
    return events;
  }
  for (const item of payload) {
    const eventType = mapSendGridEventType(item.event);
    if (!eventType) continue;
    events.push({
      type: eventType,
      email: item.email,
      messageId: item.sg_message_id,
      timestamp: new Date(item.timestamp * 1e3),
      provider: "sendgrid",
      campaignId: item.campaign_id,
      recipientId: item.recipient_id,
      bounceType: item.bounce_classification === "hard" ? "hard" : "soft",
      bounceReason: item.reason,
      linkUrl: item.url,
      userAgent: item.useragent,
      ipAddress: item.ip,
      raw: item
    });
  }
  return events;
}
function mapSendGridEventType(event) {
  const mapping = {
    delivered: "delivered",
    bounce: "bounced",
    dropped: "dropped",
    spamreport: "complained",
    unsubscribe: "unsubscribed",
    open: "opened",
    click: "clicked",
    deferred: "deferred"
  };
  return mapping[event] || null;
}
function parseMailgunWebhook(payload) {
  var _a, _b, _c, _d;
  const data = payload;
  const eventData = data["event-data"];
  if (!eventData) return null;
  const eventType = mapMailgunEventType(eventData.event);
  if (!eventType) return null;
  const recipient = eventData.recipient;
  const message = eventData.message;
  const headers = message == null ? void 0 : message.headers;
  return {
    type: eventType,
    email: recipient,
    messageId: headers == null ? void 0 : headers["message-id"],
    timestamp: new Date(eventData.timestamp * 1e3),
    provider: "mailgun",
    campaignId: (_a = eventData["user-variables"]) == null ? void 0 : _a.campaign_id,
    recipientId: (_b = eventData["user-variables"]) == null ? void 0 : _b.recipient_id,
    bounceType: eventData.severity === "permanent" ? "hard" : "soft",
    bounceReason: (_c = eventData["delivery-status"]) == null ? void 0 : _c.message,
    linkUrl: eventData.url,
    userAgent: (_d = eventData["client-info"]) == null ? void 0 : _d["user-agent"],
    ipAddress: eventData.ip,
    raw: payload
  };
}
function mapMailgunEventType(event) {
  const mapping = {
    delivered: "delivered",
    failed: "bounced",
    complained: "complained",
    unsubscribed: "unsubscribed",
    opened: "opened",
    clicked: "clicked"
  };
  return mapping[event] || null;
}
function parseResendWebhook(payload) {
  var _a, _b, _c, _d, _e, _f, _g;
  const data = payload;
  const eventType = mapResendEventType(data.type);
  if (!eventType) return null;
  const emailData = data.data;
  return {
    type: eventType,
    email: ((_a = emailData.to) == null ? void 0 : _a[0]) || "",
    messageId: emailData.email_id,
    timestamp: new Date(data.created_at),
    provider: "resend",
    campaignId: (_c = (_b = emailData.tags) == null ? void 0 : _b.find((t) => t.name === "campaign_id")) == null ? void 0 : _c.value,
    recipientId: (_e = (_d = emailData.tags) == null ? void 0 : _d.find((t) => t.name === "recipient_id")) == null ? void 0 : _e.value,
    bounceType: ((_f = emailData.bounce) == null ? void 0 : _f.type) === "permanent" ? "hard" : "soft",
    bounceReason: (_g = emailData.bounce) == null ? void 0 : _g.message,
    raw: payload
  };
}
function mapResendEventType(type) {
  const mapping = {
    "email.delivered": "delivered",
    "email.bounced": "bounced",
    "email.complained": "complained",
    "email.opened": "opened",
    "email.clicked": "clicked"
  };
  return mapping[type] || null;
}
function parseSesWebhook(payload) {
  var _a, _b, _c, _d, _e, _f;
  const data = payload;
  let message;
  if (typeof data.Message === "string") {
    try {
      message = JSON.parse(data.Message);
    } catch (e) {
      return null;
    }
  } else {
    message = data;
  }
  const notificationType = message.notificationType;
  const eventType = mapSesEventType(notificationType);
  if (!eventType) return null;
  const mail = message.mail;
  const bounce = message.bounce;
  const complaint = message.complaint;
  const delivery = message.delivery;
  let email = "";
  let bounceType;
  let bounceReason;
  if (bounce) {
    const recipients = bounce.bouncedRecipients;
    email = ((_a = recipients == null ? void 0 : recipients[0]) == null ? void 0 : _a.emailAddress) || "";
    bounceType = bounce.bounceType === "Permanent" ? "hard" : "soft";
    bounceReason = bounce.bounceSubType;
  } else if (complaint) {
    const recipients = complaint.complainedRecipients;
    email = ((_b = recipients == null ? void 0 : recipients[0]) == null ? void 0 : _b.emailAddress) || "";
  } else if (delivery) {
    const recipients = delivery.recipients;
    email = (recipients == null ? void 0 : recipients[0]) || "";
  }
  return {
    type: eventType,
    email,
    messageId: mail == null ? void 0 : mail.messageId,
    timestamp: new Date((mail == null ? void 0 : mail.timestamp) || message.timestamp),
    provider: "ses",
    campaignId: (_d = (_c = mail == null ? void 0 : mail.tags) == null ? void 0 : _c.campaign_id) == null ? void 0 : _d[0],
    recipientId: (_f = (_e = mail == null ? void 0 : mail.tags) == null ? void 0 : _e.recipient_id) == null ? void 0 : _f[0],
    bounceType,
    bounceReason,
    complaintType: complaint == null ? void 0 : complaint.complaintFeedbackType,
    raw: payload
  };
}
function mapSesEventType(type) {
  const mapping = {
    Delivery: "delivered",
    Bounce: "bounced",
    Complaint: "complained",
    Open: "opened",
    Click: "clicked"
  };
  return mapping[type] || null;
}
function verifySendGridWebhook(payload, signature, timestamp, publicKey) {
  try {
    const timestampPayload = timestamp + payload;
    const verify = crypto3.createVerify("sha256");
    verify.update(timestampPayload);
    return verify.verify(publicKey, signature, "base64");
  } catch (e) {
    return false;
  }
}
function verifyMailgunWebhook(timestamp, token, signature, apiKey) {
  const hmac = crypto3.createHmac("sha256", apiKey);
  hmac.update(timestamp + token);
  const expected = hmac.digest("hex");
  return crypto3.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
function verifyResendWebhook(payload, signature, secret) {
  const hmac = crypto3.createHmac("sha256", secret);
  hmac.update(payload);
  const expected = hmac.digest("hex");
  return crypto3.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

// src/lib/email/subscriptions.ts
import crypto4 from "crypto";
var APP_URL2 = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
function generateSubscriptionToken(email) {
  const secret = process.env.ENCRYPTION_KEY || "default-secret-key";
  const hmac = crypto4.createHmac("sha256", secret);
  hmac.update(email + Date.now().toString());
  return hmac.digest("hex");
}
function verifySubscriptionToken(email, token, maxAgeMs = 7 * 24 * 60 * 60 * 1e3) {
  return token.length === 64;
}
async function subscribeEmail(email, options = {}) {
  const normalizedEmail = email.toLowerCase().trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    return { success: false, error: "Invalid email address" };
  }
  try {
    const existing = await prisma.emailSubscriber.findUnique({
      where: { email: normalizedEmail }
    });
    if (existing) {
      if (existing.status === "ACTIVE") {
        return { success: true, subscriber: existing, error: "Already subscribed" };
      }
      if (["UNSUBSCRIBED", "CLEANED"].includes(existing.status)) {
        const confirmationToken2 = options.doubleOptIn ? generateSubscriptionToken(normalizedEmail) : void 0;
        const updated = await prisma.emailSubscriber.update({
          where: { email: normalizedEmail },
          data: {
            status: options.doubleOptIn ? "PENDING" : "ACTIVE",
            firstName: options.firstName || existing.firstName,
            lastName: options.lastName || existing.lastName,
            name: options.name || existing.name,
            source: options.source || existing.source,
            tags: options.tags || existing.tags,
            metadata: options.metadata ? JSON.parse(JSON.stringify(options.metadata)) : existing.metadata,
            confirmationToken: confirmationToken2,
            consentTimestamp: options.doubleOptIn ? void 0 : /* @__PURE__ */ new Date(),
            consentIp: options.consentIp,
            consentSource: options.source,
            unsubscribedAt: null
          }
        });
        if (options.doubleOptIn && confirmationToken2) {
          await sendConfirmationEmail(normalizedEmail, confirmationToken2);
          return { success: true, subscriber: updated, needsConfirmation: true };
        }
        return { success: true, subscriber: updated };
      }
      if (["BOUNCED", "COMPLAINED"].includes(existing.status)) {
        return { success: false, error: "This email address cannot be resubscribed" };
      }
    }
    const confirmationToken = options.doubleOptIn ? generateSubscriptionToken(normalizedEmail) : void 0;
    const subscriber = await prisma.emailSubscriber.create({
      data: {
        email: normalizedEmail,
        firstName: options.firstName,
        lastName: options.lastName,
        name: options.name,
        status: options.doubleOptIn ? "PENDING" : "ACTIVE",
        source: options.source,
        tags: options.tags || [],
        metadata: options.metadata ? JSON.parse(JSON.stringify(options.metadata)) : void 0,
        confirmationToken,
        consentTimestamp: options.doubleOptIn ? void 0 : /* @__PURE__ */ new Date(),
        consentIp: options.consentIp,
        consentSource: options.source
      }
    });
    if (options.doubleOptIn && confirmationToken) {
      await sendConfirmationEmail(normalizedEmail, confirmationToken);
      return { success: true, subscriber, needsConfirmation: true };
    }
    return { success: true, subscriber };
  } catch (error) {
    console.error("Error subscribing email:", error);
    return { success: false, error: "Failed to subscribe" };
  }
}
async function confirmSubscription(token) {
  try {
    const subscriber = await prisma.emailSubscriber.findUnique({
      where: { confirmationToken: token }
    });
    if (!subscriber) {
      return { success: false, error: "Invalid or expired confirmation token" };
    }
    if (subscriber.status === "ACTIVE") {
      return { success: true, subscriber, error: "Already confirmed" };
    }
    const updated = await prisma.emailSubscriber.update({
      where: { id: subscriber.id },
      data: {
        status: "ACTIVE",
        confirmedAt: /* @__PURE__ */ new Date(),
        consentTimestamp: /* @__PURE__ */ new Date(),
        confirmationToken: null
      }
    });
    return { success: true, subscriber: updated };
  } catch (error) {
    console.error("Error confirming subscription:", error);
    return { success: false, error: "Failed to confirm subscription" };
  }
}
async function unsubscribeEmail(email, options = {}) {
  const normalizedEmail = email.toLowerCase().trim();
  try {
    const subscriber = await prisma.emailSubscriber.findUnique({
      where: { email: normalizedEmail }
    });
    if (!subscriber) {
      return { success: false, error: "Subscriber not found" };
    }
    if (subscriber.status === "UNSUBSCRIBED") {
      return { success: true, error: "Already unsubscribed" };
    }
    await prisma.emailSubscriber.update({
      where: { email: normalizedEmail },
      data: {
        status: "UNSUBSCRIBED",
        unsubscribedAt: /* @__PURE__ */ new Date(),
        metadata: __spreadProps(__spreadValues({}, subscriber.metadata || {}), {
          unsubscribeReason: options.reason,
          unsubscribeCampaignId: options.campaignId
        })
      }
    });
    if (options.campaignId) {
      await prisma.emailCampaign.update({
        where: { id: options.campaignId },
        data: {
          unsubscribeCount: { increment: 1 }
        }
      });
    }
    return { success: true };
  } catch (error) {
    console.error("Error unsubscribing email:", error);
    return { success: false, error: "Failed to unsubscribe" };
  }
}
async function unsubscribeById(subscriberId, options = {}) {
  try {
    const subscriber = await prisma.emailSubscriber.findUnique({
      where: { id: subscriberId }
    });
    if (!subscriber) {
      return { success: false, error: "Subscriber not found" };
    }
    return unsubscribeEmail(subscriber.email, options);
  } catch (error) {
    console.error("Error unsubscribing by ID:", error);
    return { success: false, error: "Failed to unsubscribe" };
  }
}
async function getSubscriberPreferences(subscriberIdOrEmail) {
  try {
    let subscriber = await prisma.emailSubscriber.findUnique({
      where: { id: subscriberIdOrEmail }
    });
    if (!subscriber) {
      subscriber = await prisma.emailSubscriber.findUnique({
        where: { email: subscriberIdOrEmail.toLowerCase().trim() }
      });
    }
    if (!subscriber) {
      return { success: false, error: "Subscriber not found" };
    }
    return {
      success: true,
      subscriber: {
        id: subscriber.id,
        email: subscriber.email,
        firstName: subscriber.firstName,
        lastName: subscriber.lastName,
        status: subscriber.status,
        tags: subscriber.tags,
        preferences: subscriber.preferences || {}
      }
    };
  } catch (error) {
    console.error("Error getting subscriber preferences:", error);
    return { success: false, error: "Failed to get preferences" };
  }
}
async function updateSubscriberPreferences(subscriberIdOrEmail, preferences) {
  var _a, _b, _c;
  try {
    let subscriber = await prisma.emailSubscriber.findUnique({
      where: { id: subscriberIdOrEmail }
    });
    if (!subscriber) {
      subscriber = await prisma.emailSubscriber.findUnique({
        where: { email: subscriberIdOrEmail.toLowerCase().trim() }
      });
    }
    if (!subscriber) {
      return { success: false, error: "Subscriber not found" };
    }
    const currentPrefs = subscriber.preferences || {};
    const updated = await prisma.emailSubscriber.update({
      where: { id: subscriber.id },
      data: {
        firstName: (_a = preferences.firstName) != null ? _a : subscriber.firstName,
        lastName: (_b = preferences.lastName) != null ? _b : subscriber.lastName,
        tags: (_c = preferences.tags) != null ? _c : subscriber.tags,
        preferences: __spreadValues(__spreadValues({}, currentPrefs), preferences.emailPreferences)
      }
    });
    return { success: true, subscriber: updated };
  } catch (error) {
    console.error("Error updating subscriber preferences:", error);
    return { success: false, error: "Failed to update preferences" };
  }
}
async function sendConfirmationEmail(email, token) {
  const { sendEmail: sendEmail2 } = await import("./email-ZIZRTFYR.mjs");
  const confirmUrl = `${APP_URL2}/api/email/confirm?token=${token}`;
  await sendEmail2({
    to: { email },
    subject: "Please confirm your subscription",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h1 style="margin: 0 0 20px; color: #333; font-size: 24px;">Confirm your subscription</h1>
          <p style="margin: 0 0 20px; color: #666; line-height: 1.6;">
            Thank you for subscribing! Please click the button below to confirm your email address.
          </p>
          <a href="${confirmUrl}" style="display: inline-block; background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
            Confirm Subscription
          </a>
          <p style="margin: 20px 0 0; color: #999; font-size: 14px;">
            If you didn't subscribe, you can safely ignore this email.
          </p>
        </div>
      </body>
      </html>
    `,
    text: `
      Confirm your subscription

      Thank you for subscribing! Please click the link below to confirm your email address:

      ${confirmUrl}

      If you didn't subscribe, you can safely ignore this email.
    `
  });
}
async function addSubscriberTags(subscriberIdOrEmail, tags) {
  try {
    let subscriber = await prisma.emailSubscriber.findUnique({
      where: { id: subscriberIdOrEmail }
    });
    if (!subscriber) {
      subscriber = await prisma.emailSubscriber.findUnique({
        where: { email: subscriberIdOrEmail.toLowerCase().trim() }
      });
    }
    if (!subscriber) {
      return { success: false, error: "Subscriber not found" };
    }
    const currentTags = new Set(subscriber.tags);
    tags.forEach((tag) => currentTags.add(tag));
    await prisma.emailSubscriber.update({
      where: { id: subscriber.id },
      data: {
        tags: Array.from(currentTags)
      }
    });
    return { success: true };
  } catch (error) {
    console.error("Error adding subscriber tags:", error);
    return { success: false, error: "Failed to add tags" };
  }
}
async function removeSubscriberTags(subscriberIdOrEmail, tags) {
  try {
    let subscriber = await prisma.emailSubscriber.findUnique({
      where: { id: subscriberIdOrEmail }
    });
    if (!subscriber) {
      subscriber = await prisma.emailSubscriber.findUnique({
        where: { email: subscriberIdOrEmail.toLowerCase().trim() }
      });
    }
    if (!subscriber) {
      return { success: false, error: "Subscriber not found" };
    }
    const tagsToRemove = new Set(tags);
    const newTags = subscriber.tags.filter((tag) => !tagsToRemove.has(tag));
    await prisma.emailSubscriber.update({
      where: { id: subscriber.id },
      data: {
        tags: newTags
      }
    });
    return { success: true };
  } catch (error) {
    console.error("Error removing subscriber tags:", error);
    return { success: false, error: "Failed to remove tags" };
  }
}

// src/lib/email/queue.ts
var EmailQueue = class {
  constructor(options = {}) {
    this.queue = /* @__PURE__ */ new Map();
    this.processing = /* @__PURE__ */ new Set();
    this.deduplicationKeys = /* @__PURE__ */ new Set();
    this.isProcessing = false;
    this.processTimer = null;
    this.lastSendTime = 0;
    this.sendCount = 0;
    this.totalProcessingTime = 0;
    this.processedCount = 0;
    var _a, _b, _c, _d, _e, _f;
    this.options = {
      concurrency: (_a = options.concurrency) != null ? _a : 5,
      rateLimit: (_b = options.rateLimit) != null ? _b : 10,
      // 10 emails/second default
      maxAttempts: (_c = options.maxAttempts) != null ? _c : 3,
      retryDelay: (_d = options.retryDelay) != null ? _d : 1e3,
      processInterval: (_e = options.processInterval) != null ? _e : 1e3,
      persistToDb: (_f = options.persistToDb) != null ? _f : false
    };
  }
  /**
   * Enqueue an email for sending
   */
  async enqueue(message, options = {}) {
    var _a, _b;
    const id = this.generateId();
    const now = /* @__PURE__ */ new Date();
    if (options.deduplicationKey) {
      if (this.deduplicationKeys.has(options.deduplicationKey)) {
        throw new Error(`Duplicate email: ${options.deduplicationKey}`);
      }
      this.deduplicationKeys.add(options.deduplicationKey);
    }
    const queuedEmail = {
      id,
      message,
      priority: (_a = options.priority) != null ? _a : "normal",
      status: "pending",
      attempts: 0,
      maxAttempts: (_b = options.maxAttempts) != null ? _b : this.options.maxAttempts,
      scheduledFor: options.scheduledFor,
      createdAt: now
    };
    this.queue.set(id, queuedEmail);
    if (this.options.persistToDb) {
      await this.persistEmail(queuedEmail);
    }
    this.startProcessing();
    return id;
  }
  /**
   * Enqueue multiple emails
   */
  async enqueueBatch(messages, options = {}) {
    const ids = [];
    for (const message of messages) {
      const id = await this.enqueue(message, options);
      ids.push(id);
    }
    return ids;
  }
  /**
   * Get email status by ID
   */
  getStatus(id) {
    return this.queue.get(id);
  }
  /**
   * Cancel a pending email
   */
  cancel(id) {
    const email = this.queue.get(id);
    if (!email || email.status !== "pending") {
      return false;
    }
    email.status = "cancelled";
    return true;
  }
  /**
   * Get queue statistics
   */
  getStats() {
    const stats = {
      pending: 0,
      processing: 0,
      sent: 0,
      failed: 0,
      total: this.queue.size
    };
    for (const email of this.queue.values()) {
      switch (email.status) {
        case "pending":
          stats.pending++;
          break;
        case "processing":
          stats.processing++;
          break;
        case "sent":
          stats.sent++;
          break;
        case "failed":
          stats.failed++;
          break;
      }
    }
    if (this.processedCount > 0) {
      stats.averageProcessingTime = this.totalProcessingTime / this.processedCount;
    }
    return stats;
  }
  /**
   * Start queue processing
   */
  start() {
    this.startProcessing();
  }
  /**
   * Stop queue processing
   */
  stop() {
    this.isProcessing = false;
    if (this.processTimer) {
      clearTimeout(this.processTimer);
      this.processTimer = null;
    }
  }
  /**
   * Clear completed/failed emails from queue
   */
  clear(options = {}) {
    const { keepPending = true } = options;
    let cleared = 0;
    for (const [id, email] of this.queue.entries()) {
      if (email.status === "sent" || email.status === "failed" || email.status === "cancelled") {
        this.queue.delete(id);
        cleared++;
      } else if (!keepPending && email.status === "pending") {
        this.queue.delete(id);
        cleared++;
      }
    }
    return cleared;
  }
  /**
   * Retry failed emails
   */
  async retryFailed() {
    let retriedCount = 0;
    for (const email of this.queue.values()) {
      if (email.status === "failed" && email.attempts < email.maxAttempts) {
        email.status = "pending";
        email.lastError = void 0;
        retriedCount++;
      }
    }
    if (retriedCount > 0) {
      this.startProcessing();
    }
    return retriedCount;
  }
  // =============================================================================
  // PRIVATE METHODS
  // =============================================================================
  generateId() {
    return `email_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  startProcessing() {
    if (this.isProcessing) return;
    this.isProcessing = true;
    this.scheduleProcess();
  }
  scheduleProcess() {
    if (!this.isProcessing) return;
    this.processTimer = setTimeout(async () => {
      await this.process();
      this.scheduleProcess();
    }, this.options.processInterval);
  }
  async process() {
    const pending = this.getPendingEmails();
    if (pending.length === 0) {
      return;
    }
    const now = Date.now();
    if (now - this.lastSendTime < 1e3) {
      if (this.sendCount >= this.options.rateLimit) {
        return;
      }
    } else {
      this.sendCount = 0;
      this.lastSendTime = now;
    }
    const toProcess = pending.slice(0, this.options.concurrency - this.processing.size);
    const promises = toProcess.map((email) => this.processEmail(email));
    await Promise.allSettled(promises);
  }
  getPendingEmails() {
    const now = /* @__PURE__ */ new Date();
    const pending = [];
    for (const email of this.queue.values()) {
      if (email.status !== "pending") continue;
      if (this.processing.has(email.id)) continue;
      if (email.scheduledFor && email.scheduledFor > now) continue;
      if (email.lastAttemptAt) {
        const delay = this.calculateRetryDelay(email.attempts);
        const nextAttempt = new Date(email.lastAttemptAt.getTime() + delay);
        if (nextAttempt > now) continue;
      }
      pending.push(email);
    }
    const priorityOrder = {
      high: 0,
      normal: 1,
      low: 2
    };
    pending.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
    return pending;
  }
  calculateRetryDelay(attempts) {
    return this.options.retryDelay * Math.pow(2, attempts);
  }
  async processEmail(email) {
    if (this.processing.has(email.id)) return;
    this.processing.add(email.id);
    email.status = "processing";
    const startTime = Date.now();
    try {
      const result = await sendEmail(email.message);
      email.attempts++;
      email.lastAttemptAt = /* @__PURE__ */ new Date();
      email.result = result;
      if (result.success) {
        email.status = "sent";
        email.sentAt = /* @__PURE__ */ new Date();
        this.sendCount++;
      } else {
        email.lastError = result.error;
        if (email.attempts >= email.maxAttempts) {
          email.status = "failed";
        } else {
          email.status = "pending";
        }
      }
      this.processedCount++;
      this.totalProcessingTime += Date.now() - startTime;
      if (this.options.persistToDb) {
        await this.updatePersistedEmail(email);
      }
    } catch (error) {
      email.attempts++;
      email.lastAttemptAt = /* @__PURE__ */ new Date();
      email.lastError = error instanceof Error ? error.message : "Unknown error";
      if (email.attempts >= email.maxAttempts) {
        email.status = "failed";
      } else {
        email.status = "pending";
      }
    } finally {
      this.processing.delete(email.id);
    }
  }
  async persistEmail(email) {
    try {
      await prisma.emailQueueItem.create({
        data: {
          id: email.id,
          message: email.message,
          priority: email.priority,
          status: email.status,
          attempts: email.attempts,
          maxAttempts: email.maxAttempts,
          scheduledFor: email.scheduledFor,
          createdAt: email.createdAt
        }
      });
    } catch (error) {
      console.error("Failed to persist email to database:", error);
    }
  }
  async updatePersistedEmail(email) {
    try {
      await prisma.emailQueueItem.update({
        where: { id: email.id },
        data: {
          status: email.status,
          attempts: email.attempts,
          lastAttemptAt: email.lastAttemptAt,
          lastError: email.lastError,
          sentAt: email.sentAt,
          result: email.result
        }
      });
    } catch (error) {
      console.error("Failed to update persisted email:", error);
    }
  }
  /**
   * Load pending emails from database on startup
   */
  async loadFromDatabase() {
    var _a, _b, _c;
    if (!this.options.persistToDb) return 0;
    try {
      const items = await prisma.emailQueueItem.findMany({
        where: {
          status: { in: ["pending", "processing"] }
        }
      });
      for (const item of items) {
        const queuedEmail = {
          id: item.id,
          message: item.message,
          priority: item.priority,
          status: "pending",
          // Reset processing items to pending
          attempts: item.attempts,
          maxAttempts: item.maxAttempts,
          scheduledFor: (_a = item.scheduledFor) != null ? _a : void 0,
          lastAttemptAt: (_b = item.lastAttemptAt) != null ? _b : void 0,
          lastError: (_c = item.lastError) != null ? _c : void 0,
          createdAt: item.createdAt
        };
        this.queue.set(item.id, queuedEmail);
      }
      if (items.length > 0) {
        this.startProcessing();
      }
      return items.length;
    } catch (error) {
      console.error("Failed to load emails from database:", error);
      return 0;
    }
  }
};
var queueInstance = null;
function getEmailQueue(options) {
  if (!queueInstance) {
    queueInstance = new EmailQueue(options);
  }
  return queueInstance;
}
async function queueEmail(message, options) {
  const queue = getEmailQueue();
  return queue.enqueue(message, options);
}
async function queueEmails(messages, options) {
  const queue = getEmailQueue();
  return queue.enqueueBatch(messages, options);
}
async function queueUrgentEmail(message, options) {
  return queueEmail(message, __spreadProps(__spreadValues({}, options), { priority: "high" }));
}
async function scheduleEmail(message, sendAt, options) {
  return queueEmail(message, __spreadProps(__spreadValues({}, options), { scheduledFor: sendAt }));
}
function getQueueStats() {
  const queue = getEmailQueue();
  return queue.getStats();
}
function checkEmailStatus(id) {
  const queue = getEmailQueue();
  return queue.getStatus(id);
}

// src/lib/email/index.ts
var providerInstance = null;
var currentProviderName = null;
function createProvider(settings) {
  switch (settings.provider) {
    case "smtp":
      return new SmtpProvider({
        host: settings.smtpHost,
        port: settings.smtpPort,
        secure: settings.smtpSecure,
        user: settings.smtpUser,
        pass: settings.smtpPass
      });
    case "sendgrid":
      return new SendGridProvider({
        apiKey: settings.sendgridApiKey
      });
    case "resend":
      return new ResendProvider({
        apiKey: settings.resendApiKey
      });
    case "mailgun":
      return new MailgunProvider({
        apiKey: settings.mailgunApiKey,
        domain: settings.mailgunDomain
      });
    case "ses":
      return new SesProvider({
        region: settings.sesRegion,
        accessKeyId: settings.sesAccessKeyId,
        secretAccessKey: settings.sesSecretAccessKey
      });
    default:
      throw new Error(`Unknown email provider: ${settings.provider}`);
  }
}
async function getProvider() {
  const settings = await getEmailSettings();
  if (currentProviderName !== settings.provider) {
    if (providerInstance == null ? void 0 : providerInstance.close) {
      await providerInstance.close();
    }
    providerInstance = null;
    currentProviderName = null;
  }
  if (!providerInstance) {
    providerInstance = createProvider(settings);
    currentProviderName = settings.provider;
  }
  return providerInstance;
}
async function getDefaultFrom() {
  const settings = await getEmailSettings();
  return {
    email: settings.fromEmail || "noreply@example.com",
    name: settings.fromName
  };
}
async function getDefaultReplyTo() {
  const settings = await getEmailSettings();
  return settings.replyTo ? { email: settings.replyTo } : void 0;
}
var EmailService = class {
  constructor() {
    this.provider = null;
    this.config = null;
  }
  /**
   * Initialize with explicit configuration (for testing)
   */
  initWithConfig(providerType, providerConfig, serviceConfig) {
    switch (providerType) {
      case "smtp":
        this.provider = new SmtpProvider(providerConfig);
        break;
      case "sendgrid":
        this.provider = new SendGridProvider(providerConfig);
        break;
      case "resend":
        this.provider = new ResendProvider(providerConfig);
        break;
      case "mailgun":
        this.provider = new MailgunProvider(providerConfig);
        break;
      case "ses":
        this.provider = new SesProvider(providerConfig);
        break;
    }
    this.config = __spreadValues({
      provider: providerType,
      defaultFrom: serviceConfig.defaultFrom || { email: "noreply@example.com" }
    }, serviceConfig);
  }
  /**
   * Get provider (lazy load from settings if not initialized)
   */
  async getProvider() {
    if (this.provider) {
      return this.provider;
    }
    return getProvider();
  }
  /**
   * Send a single email
   */
  async send(message) {
    var _a, _b;
    const provider = await this.getProvider();
    if (!message.from) {
      message.from = ((_a = this.config) == null ? void 0 : _a.defaultFrom) || await getDefaultFrom();
    }
    if (!message.replyTo) {
      message.replyTo = ((_b = this.config) == null ? void 0 : _b.defaultReplyTo) || await getDefaultReplyTo();
    }
    return provider.send(message);
  }
  /**
   * Send email with merge tags
   */
  async sendWithMergeTags(message, data) {
    const subject = parseMergeTags(message.subjectTemplate, data);
    const html = message.htmlTemplate ? parseMergeTags(message.htmlTemplate, data) : void 0;
    const text = message.textTemplate ? parseMergeTags(message.textTemplate, data) : void 0;
    return this.send(__spreadProps(__spreadValues({}, message), {
      subject,
      html,
      text
    }));
  }
  /**
   * Send bulk emails
   */
  async sendBulk(message) {
    var _a, _b;
    const provider = await this.getProvider();
    if (!message.from) {
      message.from = ((_a = this.config) == null ? void 0 : _a.defaultFrom) || await getDefaultFrom();
    }
    if (!message.replyTo) {
      message.replyTo = ((_b = this.config) == null ? void 0 : _b.defaultReplyTo) || await getDefaultReplyTo();
    }
    if (provider.sendBulk) {
      return provider.sendBulk(message);
    }
    const results = [];
    let totalSent = 0;
    let totalFailed = 0;
    for (const recipient of message.recipients) {
      const result = await provider.send(__spreadProps(__spreadValues({}, message), {
        to: recipient.to,
        metadata: __spreadValues(__spreadValues({}, message.metadata), recipient.metadata)
      }));
      results.push({
        email: recipient.to.email,
        success: result.success,
        messageId: result.messageId,
        error: result.error
      });
      if (result.success) {
        totalSent++;
      } else {
        totalFailed++;
      }
    }
    return {
      success: totalFailed === 0,
      provider: provider.name,
      totalSent,
      totalFailed,
      results,
      timestamp: /* @__PURE__ */ new Date()
    };
  }
  /**
   * Send bulk emails with per-recipient merge tags
   */
  async sendBulkWithMergeTags(message, recipientData) {
    var _a;
    const provider = await this.getProvider();
    if (!message.from) {
      message.from = ((_a = this.config) == null ? void 0 : _a.defaultFrom) || await getDefaultFrom();
    }
    const results = [];
    let totalSent = 0;
    let totalFailed = 0;
    for (const recipient of message.recipients) {
      const data = recipientData.get(recipient.to.email) || {};
      const subject = parseMergeTags(message.subjectTemplate, data);
      const html = message.htmlTemplate ? parseMergeTags(message.htmlTemplate, data) : void 0;
      const text = message.textTemplate ? parseMergeTags(message.textTemplate, data) : void 0;
      const result = await provider.send(__spreadProps(__spreadValues({}, message), {
        to: recipient.to,
        subject,
        html,
        text,
        metadata: __spreadValues(__spreadValues({}, message.metadata), recipient.metadata)
      }));
      results.push({
        email: recipient.to.email,
        success: result.success,
        messageId: result.messageId,
        error: result.error
      });
      if (result.success) {
        totalSent++;
      } else {
        totalFailed++;
      }
    }
    return {
      success: totalFailed === 0,
      provider: provider.name,
      totalSent,
      totalFailed,
      results,
      timestamp: /* @__PURE__ */ new Date()
    };
  }
  /**
   * Verify provider configuration
   */
  async verify() {
    const provider = await this.getProvider();
    return provider.verify();
  }
  /**
   * Get current provider name
   */
  async getProviderName() {
    const provider = await this.getProvider();
    return provider.name;
  }
  /**
   * Close provider connections
   */
  async close() {
    var _a;
    if ((_a = this.provider) == null ? void 0 : _a.close) {
      await this.provider.close();
    }
    this.provider = null;
    if (providerInstance == null ? void 0 : providerInstance.close) {
      await providerInstance.close();
    }
    providerInstance = null;
    currentProviderName = null;
  }
};
var emailService = new EmailService();
async function sendEmail(message) {
  return emailService.send(message);
}
async function sendBulkEmail2(message) {
  return emailService.sendBulk(message);
}
async function sendEmailWithMergeTags(message, data) {
  return emailService.sendWithMergeTags(message, data);
}

export {
  parseMergeTags,
  extractMergeTags,
  validateMergeTagData,
  registerFormatter,
  getFormatters,
  encrypt,
  decrypt,
  isEncrypted,
  safeEncrypt,
  safeDecrypt,
  hash,
  verifyHash,
  DEFAULT_BRANDING_SETTINGS,
  DEFAULT_GENERAL_SETTINGS,
  DEFAULT_EMAIL_SETTINGS,
  DEFAULT_STORAGE_SETTINGS,
  DEFAULT_AI_SETTINGS,
  DEFAULT_SECURITY_SETTINGS,
  REQUIRED_ENV_VARS,
  getSettings,
  updateSettings,
  clearSettingsCache,
  getBrandingSettings,
  getGeneralSettings,
  getEmailSettings,
  getStorageSettings,
  getAiSettings,
  getSecuritySettings,
  getEnvVarStatus,
  getAllSettings,
  generateTrackingToken,
  createOpenTrackingUrl,
  createClickTrackingUrl,
  createUnsubscribeUrl,
  createPreferenceCenterUrl,
  injectOpenTrackingPixel,
  rewriteLinksForTracking,
  getUnsubscribeHeaders,
  processEmailForTracking,
  recordEmailOpen,
  recordEmailClick,
  getOrCreateTrackedLink,
  rewriteLinksWithTracking,
  processEmailWebhookEvent,
  parseSendGridWebhook,
  parseMailgunWebhook,
  parseResendWebhook,
  parseSesWebhook,
  verifySendGridWebhook,
  verifyMailgunWebhook,
  verifyResendWebhook,
  generateSubscriptionToken,
  verifySubscriptionToken,
  subscribeEmail,
  confirmSubscription,
  unsubscribeEmail,
  unsubscribeById,
  getSubscriberPreferences,
  updateSubscriberPreferences,
  addSubscriberTags,
  removeSubscriberTags,
  EmailQueue,
  getEmailQueue,
  queueEmail,
  queueEmails,
  queueUrgentEmail,
  scheduleEmail,
  getQueueStats,
  checkEmailStatus,
  EmailService,
  emailService,
  sendEmail,
  sendBulkEmail2 as sendBulkEmail,
  sendEmailWithMergeTags
};
//# sourceMappingURL=chunk-LSKIDFZZ.mjs.map