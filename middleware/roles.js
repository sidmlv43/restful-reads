// role check middleware
module.exports = function (requiredRole) {
  return (req, res, next) => {
    if (!req.user)
      return res.status(401).json({ message: "Not authenticated" });
    if (req.user.role !== requiredRole)
      return res.status(403).json({
        message: "Forbidden: user does not have required permissions",
      });
    next();
  };
};
