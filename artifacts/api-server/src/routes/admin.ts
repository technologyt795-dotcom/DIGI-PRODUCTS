import path from "path";
import crypto from "crypto";
import { mkdirSync } from "fs";
import { Router, type IRouter } from "express";
import multer from "multer";
import { AdminLoginBody } from "@workspace/api-zod";
import {
  checkAdminPassword,
  issueAdminToken,
  requireAdmin,
} from "../middlewares/adminAuth";

const router: IRouter = Router();

router.post("/admin/login", (req, res): void => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (!checkAdminPassword(parsed.data.password)) {
    res.status(401).json({ error: "Invalid password" });
    return;
  }

  res.json({ token: issueAdminToken() });
});

// After esbuild bundling, import.meta.dirname resolves to dist/
// so one ".." reaches the artifact root where public/ lives.
const uploadDir = path.resolve(
  import.meta.dirname,
  "..",
  "public",
  "images",
  "uploads",
);

// Ensure the directory exists (important for fresh deployments)
mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || ".jpg";
      cb(null, `${crypto.randomUUID()}${ext}`);
    },
  }),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only image files are allowed"));
      return;
    }
    cb(null, true);
  },
});

router.post(
  "/admin/uploads",
  requireAdmin,
  (req, res, next) => {
    upload.single("file")(req, res, (err: unknown) => {
      if (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        res.status(400).json({ error: message });
        return;
      }
      next();
    });
  },
  (req, res): void => {
    if (!req.file) {
      res.status(400).json({ error: "No file provided" });
      return;
    }
    res.status(201).json({ url: `/api/images/uploads/${req.file.filename}` });
  },
);

export default router;
