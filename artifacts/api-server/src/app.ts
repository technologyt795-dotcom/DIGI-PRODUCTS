import path from "path";
import express, { type Express } from "express";
import helmet from "helmet";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// تعطيل Content Security Policy مؤقتاً لضمان عدم حجب واجهات المظهر
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- مسارات الصور والملفات المرفوقة بالـ API ---
app.use(
  "/api/images",
  express.static(path.resolve(import.meta.dirname, "..", "public", "images")),
);
app.use(
  "/api/files",
  express.static(path.resolve(import.meta.dirname, "..", "public", "files")),
);

// --- مسارات الـ API الرئيسية ---
app.use("/api", router);

// --- خدمة الواجهة الأمامية (mockup-sandbox) ---
const clientDistPath = path.resolve(import.meta.dirname, "..", "..", "mockup-sandbox", "dist");

// تقديم الملفات الثابتة الخاصة بالواجهة
app.use(express.static(clientDistPath));

// توجيه جميع الزيارات الأخرى لـ index.html لتعمل الصفحات والواجهة
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.resolve(clientDistPath, "index.html"), (err) => {
    if (err) {
      next();
    }
  });
});

export default app;
