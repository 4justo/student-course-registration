import AuthService from '../services/auth.service.js';

const REFRESH_COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const AuthController = {
  async register(req, res, next) {
    try {
      const result = await AuthService.register(req.body);
      res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTS);
      res.json({ token: result.accessToken, user: result.user, student: result.student });
    } catch (error) {
      next(error);
    }
  },

  async registerAdmin(req, res, next) {
    try {
      const result = await AuthService.registerAdmin(req.body);
      res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTS);
      res.json({ token: result.accessToken, user: result.user, student: result.student });
    } catch (error) {
      next(error);
    }
  },

  async login(req, res, next) {
    try {
      const result = await AuthService.login(req.body);
      res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTS);
      res.json({ token: result.accessToken, user: result.user, student: result.student });
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
      res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTS);
      res.json({ token: result.accessToken });
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
      res.json(profile.user);
    } catch (error) {
      next(error);
    }
  },

  async listUsers(req, res, next) {
    try {
      const users = await AuthService.listUsers();
      res.json({ users });
    } catch (error) {
      next(error);
    }
  },

  async updateUserRole(req, res, next) {
    try {
      const { id } = req.params;
      const { role } = req.body;
      if (!role) {
        return res.status(400).json({ error: { message: 'role is required', status: 400 } });
      }
      const result = await AuthService.updateUserRole({ userId: id, role });
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
};

export default AuthController;
