const authService = require('../services/authService');
const env = require('../config/env');

/**
 * Handle user login requests.
 */
const login = async (req, res, next) => {
  try {
    const { loginIdentifier, password } = req.body;

    // 1. Input Validation
    if (!loginIdentifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username/Email and Password are required.'
      });
    }

    if (loginIdentifier.length > 100 || password.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Input parameters exceed maximum length limit.'
      });
    }

    const ip_address = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const user_agent = req.headers['user-agent'];

    // 2. Validate Credentials
    const result = await authService.validateUser(loginIdentifier, password, { ip_address, user_agent });

    // Generic error responses to avoid account enumeration
    if (!result) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.'
      });
    }

    if (result.error === 'ACCOUNT_INACTIVE') {
      return res.status(403).json({
        success: false,
        message: 'Your account is inactive. Please contact the administrator.'
      });
    }

    // 3. Generate JWT Token
    const token = authService.generateToken(result);

    // 4. Set HttpOnly Cookie
    const cookieOptions = {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days matching JWT expiration
    };

    res.cookie('token', token, cookieOptions);

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      user: {
        id: result.id,
        username: result.username,
        email: result.email,
        role: result.role,
        must_change_password: Boolean(result.must_change_password)
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Handle password change requests.
 */
const changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required.'
      });
    }

    const ip_address = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const user_agent = req.headers['user-agent'];

    const result = await authService.changePassword(req.user.id, current_password, new_password, { ip_address, user_agent });

    return res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * Handle logout requests by clearing the session cookie.
 */
const logout = async (req, res, next) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Return current authenticated user profile.
 */
const getMe = async (req, res, next) => {
  try {
    const profile = await authService.getUserProfile(req.user.id);
    return res.status(200).json({
      success: true,
      user: profile
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  changePassword,
  logout,
  getMe
};
