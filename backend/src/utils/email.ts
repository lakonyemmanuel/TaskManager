export type WorkspaceInvitationEmailPayload = {
    to: string;
    workspaceName: string;
    invitedByEmail: string;
    invitationToken: string;
    expiresAt: Date;
};

const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
const inviteBasePath = process.env.WORKSPACE_INVITE_PATH || "/invite";

export const sendWorkspaceInvitationEmail = async ({
    to,
    workspaceName,
    invitedByEmail,
    invitationToken,
    expiresAt,
}: WorkspaceInvitationEmailPayload) => {
    const inviteUrl = `${frontendUrl}${inviteBasePath}?token=${encodeURIComponent(invitationToken)}`;

    // Integration point for real providers. In development we log details for manual delivery.
    console.info(
        `[email:${process.env.EMAIL_PROVIDER || "log"}] Workspace invite to ${to} for workspace \"${workspaceName}\" from ${invitedByEmail}. Accept at: ${inviteUrl}. Expires at: ${expiresAt.toISOString()}`
    );

    return {
        delivered: true,
        provider: process.env.EMAIL_PROVIDER || "log",
        inviteUrl,
    };
};
