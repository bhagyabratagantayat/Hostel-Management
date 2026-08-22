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

    // Input sanitization / check length limits
    if (loginIdentifier.length > 100 || password.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Input parameters exceed maximum length limit.'
      });
    }

    // 2. Validate Credentials
    const result = await authService.validateUser(loginIdentifier, password);

    // Generic error responses to avoid account enumeration
    if (!result) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username/email or password.'
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
        role: result.role
      }
    });

  } catch (error) {
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
    // req.user is set by the requireAuth middleware
    return res.status(200).json({
      success: true,
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  logout,
  getMe
};
