import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../middleware/auth";
import { sourceController } from "../controllers/source.controller";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

export const sourceRouter = Router({ mergeParams: true });

sourceRouter.use(requireAuth);

sourceRouter.post("/", upload.single("file"), sourceController.add);
sourceRouter.get("/", sourceController.list);
sourceRouter.post("/bulk-delete", sourceController.bulkRemove);
sourceRouter.get("/:sourceId", sourceController.getById);
sourceRouter.patch("/:sourceId", sourceController.update);
sourceRouter.delete("/:sourceId", sourceController.remove);
