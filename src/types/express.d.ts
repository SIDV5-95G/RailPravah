import { UserProfile } from './database.types';

declare global {
  namespace Express {
    interface Request {
      user?: UserProfile;
    }
  }
}
