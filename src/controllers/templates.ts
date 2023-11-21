import { RequestHandler } from 'express';
import path from 'path';

export const renderInvitaitonMail: RequestHandler = async (req, res, next) => {
	try {
		res.render(path.join(__dirname, '../utils/mailer/templates/invitation'), {
			welcome_label: 'Welcome!',
			description_label:
				'Welcome to LENDZEE and your partner reporting dashboard. Please complete your account registration. For assistance or questions, contact <a href="mailto:admin@cbfsolutionsgroup.com">admin@cbfsolutionsgroup.com</a>.<br /><br />** Please note. All previous client files may not display current status as part of migration. All new client submissions will reflect real-time updates.<br /><br />Thank you for choosing LENDZEE and CBF Solutions Group, LLC. We appreciate your partnership!',
			confirm_account_label: 'Register',
			additional_label:
				'Dear recipient, please do not reply to this email. This email is for informational purposes only and is automatically sent to additional system users.',
			user_id: '1234',
		});
	} catch (err) {
		next(err);
	}
};
