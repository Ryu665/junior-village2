require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const { errorHandler } = require("./middleware/errorHandler");
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const missionRoutes = require("./routes/mission.routes");
const accountRoutes = require("./routes/account.routes");
const savingsGoalRoutes = require("./routes/savingsGoal.routes");
const notificationRoutes = require("./routes/notification.routes");
const gameRoutes = require("./routes/game.routes");
const educationRoutes = require("./routes/education.routes");
const schoolRoutes = require("./routes/school.routes");

const app = express();
const isProd = process.env.NODE_ENV === "production";

// 배포 환경(Render 등)은 프록시 뒤에서 HTTPS로 동작하므로 원래 요청 프로토콜을 신뢰한다.
if (isProd) app.set("trust proxy", 1);

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (req, res) => res.json({ ok: true, service: "junior-village-server" }));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/missions", missionRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/savings-goals", savingsGoalRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/games", gameRoutes);
app.use("/api/education", educationRoutes);
app.use("/api/schools", schoolRoutes);

app.use("/api", (req, res) => res.status(404).json({ error: "요청하신 API를 찾을 수 없습니다." }));

// 배포 환경에서는 서버가 빌드된 프론트엔드(client/dist)까지 함께 서빙한다 (URL 하나로 접속, CORS 불필요).
// 새로고침/직접 접속 시에도 React Router가 동작하도록 /api 이외의 경로는 index.html로 보낸다.
if (isProd) {
  const clientDist = path.join(__dirname, "..", "..", "client", "dist");
  app.use(express.static(clientDist));
  app.get("*", (req, res) => res.sendFile(path.join(clientDist, "index.html")));
} else {
  app.use((req, res) => res.status(404).json({ error: "요청하신 API를 찾을 수 없습니다." }));
}
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🏦 Junior Village API server running on http://localhost:${PORT}`);
});
