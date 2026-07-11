import AuthService from '../services/auth.service.js';

const AuthController = {
  async register(req, res, next) {
    try {
      const result = await AuthService.register(req.body);
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      res.json({ accessToken: result.accessToken, profile: result.profile });
    } catch (error) {
      next(error);
    }
  },

  async login(req, res, next) {
    try {
      const result = await AuthService.login(req.body);
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      res.json({ accessToken: result.accessToken, profile: result.profile });
    } catch (error) {
      next(error);
    }
  },

  async logout(req, res, next) {
    try {
      await AuthService.logout(req.cookies.refreshToken);
      res.clearCookie('refreshToken');
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  async refreshToken(req, res, next) {
    try {
      const result = await AuthService.refreshToken(req.cookies.refreshToken);
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      res.json({ accessToken: result.accessToken });
    } catch (error) {
      next(error);
    }
  },

  async forgotPassword(req, res, next) {
    try {
      await AuthService.forgotPassword(req.body);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  async resetPassword(req, res, next) {
    try {
      await AuthService.resetPassword(req.body);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  async getProfile(req, res, next) {
    try {
      const profile = await AuthService.getProfile(req.user);
      res.json(profile);
    } catch (error) {
      next(error);
    }
  },
};

export default AuthController;
