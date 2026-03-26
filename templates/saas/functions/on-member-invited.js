module.exports = async (ctx) => {
  const record = ctx.event?.record ?? ctx.executionParams;

  console.log("[on-member-invited] New member added:", {
    orgId: record?.data?.orgId,
    userId: record?.data?.userId,
    role: record?.data?.role,
    status: record?.data?.status,
  });

  if (record?.data?.status === "invited") {
    // Replace this with your email service (e.g. Resend, SendGrid, Postmark).
    console.log(
      `[on-member-invited] Would send invite email to user ${record.data.userId}`,
    );
  }

  return { success: true, message: "Member invitation processed." };
};
