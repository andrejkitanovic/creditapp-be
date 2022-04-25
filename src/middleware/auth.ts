import { RequestHandler } from 'express';
// import jwt from 'jsonwebtoken';

export const auth: RequestHandler = async (req, res, next) => {
	try {
		if (req?.headers.authorization) {
			// const authorization = req.headers.authorization.split(' ')[1];
			// const decoded = jwt.verify(authorization, process.env.DECODE_KEY);
			// const { id, type } = decoded;
			// const user = await User.findById(id);
			// if (!user) {
			// 	return res.status(403).json({ message: 'User not found!' });
			// }
			// if (user.deactivated) {
			// 	return res.status(403).json({ message: 'User is deactivated!' });
			// }
			// req.auth = {
			// 	id,
			// 	type,
			// 	selectedCompany: user.selectedCompany,
			// };
		}
	} catch (err) {
		return res.status(403).json({ message: 'Not Authorized' });
	}

	return next();
};
