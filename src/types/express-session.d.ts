import 'express-session';

declare module 'express-session' {
  interface SessionData {
    captcha?: string;
    [key: string]: any;
  }
}

declare global {
  namespace Express {
    interface Session {
      captcha?: string;
      save(callback?: (err?: any) => void): void;
      [key: string]: any;
    }
  }
}


