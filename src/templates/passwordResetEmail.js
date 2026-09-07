export function passwordResetEmail({ resetUrl }) {
  return {
    subject: 'Reset your password | Dominion City Asaba HQ Department Portal',

    text: `You requested a password reset for your Dominion City Asaba HQ Department Portal account.

Click the link below to reset your password:

${resetUrl}

This link will expire in 15 minutes.

If you did not request this password reset, you can safely ignore this email.`,

    html: `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <title>Reset your password</title>
        </head>

        <body
          style="
            margin: 0;
            padding: 0;
            background-color: #f4f4f5;
            font-family: Arial, Helvetica, sans-serif;
            color: #18181b;
          "
        >
          <table
            width="100%"
            cellpadding="0"
            cellspacing="0"
            border="0"
            style="background-color: #f4f4f5; padding: 40px 16px;"
          >
            <tr>
              <td align="center">

                <table
                  width="100%"
                  cellpadding="0"
                  cellspacing="0"
                  border="0"
                  style="
                    max-width: 560px;
                    background-color: #ffffff;
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
                  "
                >

                  <!-- Header -->
                  <tr>
                    <td
                      style="
                        background-color: #09090b;
                        padding: 28px 32px;
                        text-align: center;
                      "
                    >
                      <div
                        style="
                          font-size: 24px;
                          font-weight: 700;
                          color: #2563eb;
                          letter-spacing: 0.5px;
                        "
                      >
                        Dominion City Asaba HQ Department Portal
                      </div>

                      <div
                        style="
                          margin-top: 6px;
                          font-size: 13px;
                          color: #a1a1aa;
                        "
                      >
                        Secure account management
                      </div>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 36px;">

                      <div
                        style="
                          width: 52px;
                          height: 52px;
                          margin: 0 auto 24px;
                          border-radius: 14px;
                          background-color: #eff6ff;
                          text-align: center;
                          line-height: 52px;
                          font-size: 24px;
                        "
                      >
                        🔐
                      </div>

                      <h1
                        style="
                          margin: 0 0 12px;
                          text-align: center;
                          font-size: 26px;
                          line-height: 1.3;
                          color: #18181b;
                        "
                      >
                        Reset your password
                      </h1>

                      <p
                        style="
                          margin: 0 0 28px;
                          text-align: center;
                          font-size: 15px;
                          line-height: 1.7;
                          color: #52525b;
                        "
                      >
                        We received a request to reset the password for your
                        Dominion City Asaba HQ Department Portal account.
                      </p>

                      <!-- Button -->
                      <table
                        width="100%"
                        cellpadding="0"
                        cellspacing="0"
                        border="0"
                      >
                        <tr>
                          <td align="center">

                            <a
                              href="${resetUrl}"
                              style="
                                display: inline-block;
                                padding: 14px 28px;
                                background-color: #2563eb;
                                color: #ffffff;
                                font-size: 15px;
                                font-weight: 700;
                                text-decoration: none;
                                border-radius: 10px;
                              "
                            >
                              Reset Password
                            </a>

                          </td>
                        </tr>
                      </table>

                      <!-- Expiration notice -->
                      <div
                        style="
                          margin-top: 32px;
                          padding: 16px 18px;
                          background-color: #fafafa;
                          border: 1px solid #e4e4e7;
                          border-radius: 10px;
                        "
                      >
                        <p
                          style="
                            margin: 0;
                            font-size: 13px;
                            line-height: 1.6;
                            color: #52525b;
                          "
                        >
                          <strong style="color: #18181b;">
                            This link expires in 15 minutes.
                          </strong>
                          For your security, the link can only be used once.
                        </p>
                      </div>

                      <!-- Fallback URL -->
                      <p
                        style="
                          margin: 28px 0 0;
                          font-size: 12px;
                          line-height: 1.6;
                          color: #71717a;
                        "
                      >
                        If the button above doesn't work, copy and paste this
                        link into your browser:
                      </p>

                      <p
                        style="
                          margin: 8px 0 0;
                          font-size: 12px;
                          line-height: 1.6;
                          word-break: break-all;
                        "
                      >
                        <a
                          href="${resetUrl}"
                          style="
                            color: #2563eb;
                            text-decoration: none;
                          "
                        >
                          ${resetUrl}
                        </a>
                      </p>

                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td
                      style="
                        padding: 22px 32px;
                        background-color: #fafafa;
                        border-top: 1px solid #e4e4e7;
                        text-align: center;
                      "
                    >
                      <p
                        style="
                          margin: 0;
                          font-size: 12px;
                          color: #71717a;
                          line-height: 1.6;
                        "
                      >
                        If you didn't request a password reset, you can safely
                        ignore this email.
                      </p>

                      <p
                        style="
                          margin: 10px 0 0;
                          font-size: 11px;
                          color: #a1a1aa;
                        "
                      >
                        © ${new Date().getFullYear()}
                        Dominion City Asaba HQ Department Portal
                      </p>
                    </td>
                  </tr>

                </table>

              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  };
}
