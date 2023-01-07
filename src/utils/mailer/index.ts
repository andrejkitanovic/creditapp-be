import nodeMailjet from 'node-mailjet';
import { readFile } from 'helpers/readFile';
import path from 'path';

const mailjet = nodeMailjet.connect(process.env.MJ_APIKEY_PUBLIC ?? '', process.env.MJ_APIKEY_PRIVATE ?? '');
const From = {
	Email: 'kitanovicandrej213@gmail.com',
	Name: 'Loanly | Notification',
};
const SubjectPrefix = 'Loanly |';

export const sendEmailInvitation = async ({ userId, email }: { userId: string; email: string }) => {
	try {
		const html = await readFile({
			path: path.join(__dirname, './templates/invitation.jade'),
			context: {
				welcome_label: 'Welcome!',
				description_label:
					'Welcome to Loanly App! Please press button "Register" to finish account setup. If you have any questions or need assistance, please don\'t hesitate to reach out to our customer support team. We are here to help you succeed. Thanks for choosing Loanly!',
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
