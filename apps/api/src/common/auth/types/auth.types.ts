import { UserSession } from '../guards';

declare global {
	namespace Express {
		interface Request {
			session?: UserSession['session'];
			user?: UserSession['user'];
		}
	}
}
