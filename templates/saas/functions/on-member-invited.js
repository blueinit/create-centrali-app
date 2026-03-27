async function run() {
  const record = executionParams;

  api.log({
    message: "New member added",
    orgId: record?.data?.orgId,
    email: record?.data?.email,
    role: record?.data?.role,
    status: record?.data?.status,
  });

  if (record?.data?.status === "invited") {
    const email = record.data.email;

    // TODO: Send an actual invite via Clerk Invitations API:
    //   await api.httpPost("https://api.clerk.com/v1/invitations", {
    //     headers: { Authorization: "Bearer sk_live_..." },
    //     body: { email_address: email, redirect_url: "https://yourapp.com/sign-up" },
    //   });

    api.log({ message: `TODO: send invite email to ${email}` });
  }

  return { success: true, message: "Member invitation processed." };
}
