import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

interface InlineImage {
  data: string; // base64, without the data: URI prefix
  mimeType: string;
}

interface GenerateBody {
  productDesc?: string;
  atmosphereDesc?: string;
  productImages?: InlineImage[];
  atmosphereImages?: InlineImage[];
  prompt?: string;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  // Scripted endpoint to process or return room visual
  app.post("/api/generate", async (req, res) => {
    try {
      const { prompt, imageBase64 } = req.body;
      if (!prompt && !imageBase64) {
        return res.status(400).json({ error: "Prompt or image is required" });
      }

      // Return processed room image directly
      res.json({ imageUrl: imageBase64 || "" });
    } catch (error: any) {
      console.error("Error generating image via script:", error);
      res.status(500).json({ error: error.message || "Failed to generate image" });
    }
  });

  // Scripted endpoint to generate cinematic directorial prompt
  app.post("/api/generate-prompt", async (req, res) => {
    try {
      const { productDesc, atmosphereDesc }: GenerateBody = req.body;
      const scriptPrompt = `Create a professional showcase reel of ${productDesc || "the stylized interior space"}. Smooth cinematic camera dolly, warm motivated natural lighting, atmospheric depth. Environment: ${atmosphereDesc || "refined modern architecture"}.`;
      res.json({ prompt: scriptPrompt });
    } catch (e: any) {
      console.error("Error generating prompt:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // Scripted endpoint to auto-describe space / atmosphere
  app.post("/api/describe", async (req, res) => {
    try {
      const { type }: { type?: "product" | "atmosphere" } = req.body;
      const description = type === "atmosphere"
        ? "Minimalist craft luxury with balanced natural light and serene architectural lines."
        : "Warm living space featuring balanced organic textures and curated furniture.";
      res.json({ description });
    } catch (e: any) {
      console.error("Error describing image:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // Scripted endpoint to start cinematic video generation
  app.post("/api/generate-video", async (req, res) => {
    try {
      const id = "script_vid_" + Date.now();
      res.json({ interactionId: id, uri: `files/${id}`, fileId: id });
    } catch (e: any) {
      console.error("Error generating video:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // Scripted endpoint to poll file status
  app.get("/api/file-status/:fileId", async (req, res) => {
    res.json({ state: "ACTIVE" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT} (script mode active)`);
  });
}

startServer().catch(console.error);
