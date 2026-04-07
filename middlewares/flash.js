// middlewares/flash.js
// Reads flash from session once per request, exposes it to all templates
// via res.locals, then immediately deletes it so it only shows once.
export const flashMiddleware = (req, res, next) => {
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;
  next();
};
