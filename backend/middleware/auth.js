// middleware/auth.js - Session authentication middleware
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.admin) {
    return next();
  }
  return res.status(401).json({ success: false, message: 'Unauthorized. Please login.' });
};

module.exports = { isAuthenticated };
