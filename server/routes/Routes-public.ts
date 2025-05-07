import { Router } from "express";
import path from "path";
import { fileURLToPath } from "url";

const router = Router();

/* --- health check ------------------------------------------------ */
router.get("/healthz", (_req, res) => res.json({ ok: true }));

/* --- static / fallback  ------------------------------------------ */
/*  If you have a client bundle, serve it here.  
    Delete this block if not needed.                                */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
router.use(
  "/",         // everything else
  (_req, res) =>
    res.sendFile(
      path.resolve(__dirname, "../../public/index.html") // adjust if different
    )
);

export default router;
