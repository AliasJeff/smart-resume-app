const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const backendDir = path.join(projectRoot, "backend");
const frontendDir = path.join(projectRoot, "frontend");
const dataDir = path.join(projectRoot, "data");

module.exports = {
  apps: [
    {
      name: "resume-backend",
      cwd: backendDir,
      script: path.join(backendDir, "venv", "bin", "uvicorn"),
      args: "main:app --host 0.0.0.0 --port 8000",
      interpreter: "none",
      env: {
        DB_DIR: dataDir,
      },
      max_memory_restart: "512M",
      error_file: path.join(projectRoot, "logs", "backend-error.log"),
      out_file: path.join(projectRoot, "logs", "backend-out.log"),
      merge_logs: true,
      time: true,
    },
    {
      name: "resume-frontend",
      cwd: frontendDir,
      script: "npm",
      args: "start",
      interpreter: "none",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "0.0.0.0",
        BACKEND_URL: "http://127.0.0.1:8000",
        NEXT_TELEMETRY_DISABLED: "1",
      },
      max_memory_restart: "1G",
      error_file: path.join(projectRoot, "logs", "frontend-error.log"),
      out_file: path.join(projectRoot, "logs", "frontend-out.log"),
      merge_logs: true,
      time: true,
    },
  ],
};
