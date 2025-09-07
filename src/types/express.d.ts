import type { IUser, IOrganization } from '../models';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      organization?: IOrganization;
    }
  }
}