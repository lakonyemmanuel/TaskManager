export const sendInvitationEmail = async (
    to: string,
    workspaceName: string,
    token: string,
): Promise<void> => {
    // Placeholder for a real email service integration.
    // Logs the invitation details to the console so the token/link
    // can be shared out-of-band until an email provider is configured.
    console.log("═══════════════════════════════════════════");
    console.log("[EMAIL] To:", to);
    console.log("[EMAIL] Subject: You're invited to", workspaceName);
    console.log("[EMAIL] Accept using token:", token);
    console.log("[EMAIL] Accept via API: POST /api/invitations/" + token + "/accept");
    console.log("═══════════════════════════════════════════");
};
