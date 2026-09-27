// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || (err.code === "INSUFFICIENT_BALANCE" ? 400 : 500);
  res.status(status).json({ error: err.message || "서버 오류가 발생했습니다." });
}

module.exports = { errorHandler };
