import { RequestHandler } from 'express';
import path from 'path';

export const renderInvitaitonMail: RequestHandler = async (req, res, next) => {
	try {
		res.render(path.join(__dirname, '../utils/mailer/templates/invitation'), {
			welcome_label: 'Welcome!',
			description_label:
				'Welcome to Loanly App! Please press button "Register" to finish account setup. If you have any questions or need assistance, please don\'t hesitate to reach out to our customer support team. We are here to help you succeed. Thanks for choosing Loanly!',
			confirm_account_label: 'Register',
			additional_label:
				'Dear recipient, please do not reply to this email. This email is for informational purposes only and is automatically sent to additional system users.',
			user_id: '1234',
		});
	} catch (err) {
		next(err);
	}
};
