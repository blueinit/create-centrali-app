module.exports = async (ctx) => {
  const record = ctx.event?.record ?? ctx.executionParams;

  console.log("[on-member-invited] New member added:", {
    orgId: record?.data?.orgId,
    email: record?.data?.email,
    role: record?.data?.role,
    status: record?.data?.status,
  });

  if (record?.data?.status === "invited") {
    const email = record.data.email;

    // TODO: Send an actual invite email. Pick one:
    //
    // Option 1 — Clerk Invitations API (recommended):
    //   await api.httpPost("https://api.clerk.com/v1/invitations", {
    //     headers: { Authorization: "Bearer sk_live_..." },
    //     body: { email_address: email, redirect_url: "https://yourapp.com/sign-up" },
    //   });
    //
    // Option 2 — Resend (https://resend.com):
    //   await api.httpPost("https://api.resend.com/emails", {
    //     headers: { Authorization: "Bearer re_..." },
    //     body: { from: "team@yourapp.com", to: email, subject: "You're invited!", html: "<p>Join us</p>" },
    //   });
    //
    // Option 3 — SendGrid, Postmark, or any HTTP email API via api.httpPost()

    console.log(`[on-member-invited] TODO: send invite email to ${email}`);
  }

  return { success: true, message: "Member invitation processed." };
};
