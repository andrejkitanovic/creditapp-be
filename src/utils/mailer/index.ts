import nodeMailjet from 'node-mailjet';
import { readFile } from 'helpers/readFile';
import path from 'path';
import { IUser } from 'models/user';

const mailjet = nodeMailjet.connect(process.env.MJ_APIKEY_PUBLIC ?? '', process.env.MJ_APIKEY_PRIVATE ?? '');
const From = {
	Email: 'admin@lendzee.ai',
	Name: 'Lendzee | Notification',
};
const SubjectPrefix = 'Lendzee |';

export const sendEmailInvitation = async ({ userId, email }: { userId: string; email: string }) => {
	try {
		const html = await readFile({
			path: path.join(__dirname, './templates/invitation.jade'),
			context: {
				welcome_label: 'Welcome!',
				description_label:
					'Welcome to LENDZEE and your partner reporting dashboard. Please complete your account registration. For assistance or questions, contact <a href="mailto:admin@lendzee.ai">admin@lendzee.ai</a>.<br /><br />** Please note. All previous client files may not display current status as part of migration. All new client submissions will reflect real-time updates.<br /><br />Thank you for choosing LENDZEE and XS Capital Solutions, Inc., dba Lendzee. We appreciate your partnership!',
				confirm_account_label: 'Register',
				additional_label:
					'Dear recipient, please do not reply to this email. This email is for informational purposes only and is automatically sent to additional system users.',
				user_id: userId,
			},
		});

		await mailjet.post('send', { version: 'v3.1' }).request({
			Messages: [
				{
					From,
					To: [
						{
							Email: email,
						},
					],
					Subject: `${SubjectPrefix} User Invitation`,
					HTMLPart: html,
				},
			],
		});

		return true;
	} catch (err: any) {
		throw new Error(err);
	}
};

export const sendResetPassword = async ({ user, token, email }: { user: IUser; token: string; email: string }) => {
	try {
		const html = await readFile({
			path: path.join(__dirname, './templates/resetPassword.jade'),
			context: {
				token,
			},
		});
		const htmlAdmin = await readFile({
			path: path.join(__dirname, './templates/resetPasswordRequest.jade'),
			context: {
				name: user.name,
				email,
			},
		});

		await mailjet.post('send', { version: 'v3.1' }).request({
			Messages: [
				{
					From,
					To: [
						{
							Email: email,
						},
					],
					Subject: `${SubjectPrefix} Reset Password`,
					HTMLPart: html,
				},
				{
					From,
					To: [
						{
							Email: 'michael@cbfsolutionsgroup.com',
						},
					],
					Subject: `${SubjectPrefix} Reset Password Request`,
					HTMLPart: htmlAdmin,
				},
			],
		});

		return true;
	} catch (err: any) {
		throw new Error(err);
	}
};
