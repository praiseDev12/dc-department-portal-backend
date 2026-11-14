export function birthdaySummaryEmail({ departmentName, monthName, birthdays }) {
  const birthdayRows = birthdays
    .map(
      (member, index) => `
        <tr>
          <td style="padding: 0 0 ${index === birthdays.length - 1 ? '0' : '14px'} 0;">
            <table
              width="100%"
              cellpadding="0"
              cellspacing="0"
              border="0"
              style="
                background-color: #fafafa;
                border: 1px solid #ececec;
                border-radius: 14px;
              "
            >
              <tr>
                <td style="padding: 16px; width: 60px;">
                  ${
                    member.photoUrl
                      ? `
                        <img
                          src="${member.photoUrl}"
                          alt="${member.fullName}"
                          width="48"
                          height="48"
                          style="
                            display: block;
                            width: 48px;
                            height: 48px;
                            border-radius: 50%;
                            object-fit: cover;
                            border: 2px solid #ffffff;
                            box-shadow: 0 2px 6px rgba(0,0,0,0.08);
                          "
                        />
                      `
                      : `
                        <div
                          style="
                            width: 48px;
                            height: 48px;
                            border-radius: 50%;
                            background: linear-gradient(135deg, #2563eb, #7c3aed);
                            text-align: center;
                            line-height: 48px;
                            font-size: 18px;
                            font-weight: 700;
                            color: #ffffff;
                          "
                        >
                          ${member.fullName?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                      `
                  }
                </td>

                <td style="padding: 16px 16px 16px 0;">
                  <div style="font-size: 15px; font-weight: 700; color: #18181b; margin-bottom: 3px;">
                    ${member.fullName}
                  </div>
                  <div style="font-size: 13px; color: #71717a;">
                    ${member.unit?.name || 'No unit'}
                  </div>
                </td>

                <td style="padding: 16px; text-align: right; white-space: nowrap;">
                  <span
                    style="
                      display: inline-block;
                      background: linear-gradient(135deg, #2563eb, #7c3aed);
                      color: #ffffff;
                      font-size: 12px;
                      font-weight: 700;
                      padding: 6px 12px;
                      border-radius: 999px;
                    "
                  >
                    🎂 ${new Date(member.dateOfBirth).toLocaleDateString(
                      'en-NG',
                      {
                        day: 'numeric',
                        month: 'long',
                      },
                    )}
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `,
    )
    .join('');

  return {
    subject: `🎂 ${monthName} Birthdays | ${departmentName}`,

    text: `Here are the birthdays for ${monthName} in ${departmentName}.

${birthdays
  .map(
    (member) =>
      `${member.fullName} - ${new Date(member.dateOfBirth).toLocaleDateString(
        'en-NG',
        {
          day: 'numeric',
          month: 'long',
        },
      )} - ${member.unit?.name || 'No unit'}`,
  )
  .join('\n')}

Dominion City Asaba HQ Department Portal`,

    html: `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>${monthName} Birthdays</title>
        </head>

        <body
          style="
            margin: 0;
            padding: 0;
            background-color: #ffffff;
            font-family: Arial, Helvetica, sans-serif;
            color: #18181b;
          "
        >
          <table
            width="100%"
            cellpadding="0"
            cellspacing="0"
            border="0"
            style="background-color: #ffffff; padding: 40px 16px;"
          >
            <tr>
              <td align="center">

                <table
                  width="100%"
                  cellpadding="0"
                  cellspacing="0"
                  border="0"
                  style="
                    max-width: 650px;
                    background-color: #ffffff;
                    border-radius: 20px;
                    overflow: hidden;
                    border: 1px solid #ececec;
                  "
                >

                  <!-- Header -->
                  <tr>
                    <td
                      style="
                        background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
                        padding: 40px 32px;
                        text-align: center;
                      "
                    >
                      <div
                        style="
                          width: 64px;
                          height: 64px;
                          margin: 0 auto 16px;
                          border-radius: 18px;
                          background-color: rgba(255,255,255,0.18);
                          text-align: center;
                          line-height: 64px;
                          font-size: 32px;
                        "
                      >
                        🎂
                      </div>

                      <div
                        style="
                          font-size: 22px;
                          font-weight: 800;
                          color: #ffffff;
                          letter-spacing: 0.3px;
                        "
                      >
                        ${monthName} Birthdays
                      </div>

                      <div
                        style="
                          margin-top: 8px;
                          font-size: 13px;
                          color: rgba(255,255,255,0.85);
                          font-weight: 500;
                        "
                      >
                        ${departmentName}
                      </div>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 36px 32px;">

                      <p
                        style="
                          margin: 0 auto 26px;
                          max-width: 500px;
                          text-align: center;
                          font-size: 15px;
                          line-height: 1.7;
                          color: #52525b;
                        "
                      >
                        Here are the members of <strong style="color: #18181b;">${departmentName}</strong>
                        celebrating their birthdays this month.
                      </p>

                      ${
                        birthdays.length
                          ? `
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                              ${birthdayRows}
                            </table>
                          `
                          : `
                            <div
                              style="
                                padding: 32px 24px;
                                text-align: center;
                                background-color: #fafafa;
                                border: 1px solid #ececec;
                                border-radius: 14px;
                              "
                            >
                              <div style="font-size: 32px; margin-bottom: 8px;">📭</div>
                              <p style="margin: 0; font-size: 14px; color: #52525b;">
                                There are no birthdays recorded for this month.
                              </p>
                            </div>
                          `
                      }

                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td
                      style="
                        padding: 24px 32px;
                        background-color: #fafafa;
                        border-top: 1px solid #ececec;
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
                        Don't forget to celebrate and appreciate the
                        birthday celebrants in your department.
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
