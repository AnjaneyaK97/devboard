/**
 * Wraps async Express controllers to catch unhandled rejections and forward to error middleware
 */
export const asyncWrapper = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};
