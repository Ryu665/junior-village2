/** async 라우트 핸들러의 예외를 errorHandler로 넘겨주는 헬퍼 */
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = { asyncHandler };
