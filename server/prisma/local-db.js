import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";

if (process.platform !== "win32") {
  throw new Error("Cette commande est prévue pour l’instance PostgreSQL locale Windows.");
}

const action = process.argv[2];
if (!["start", "stop"].includes(action)) {
  throw new Error("Usage : node prisma/local-db.js <start|stop>");
}

const programFiles = process.env.ProgramW6432 || process.env.ProgramFiles || "C:\\Program Files";
const postgresBin = process.env.FERROLINK_POSTGRES_BIN || path.join(programFiles, "PostgreSQL", "18", "bin");
const pgCtl = path.join(postgresBin, "pg_ctl.exe");
const dataDirectory = path.join(process.env.LOCALAPPDATA, "FerroLink", "PostgreSQL18", "data");
const logFile = path.join(path.dirname(dataDirectory), "postgresql.log");

if (!existsSync(pgCtl)) {
  throw new Error(`pg_ctl est introuvable : ${pgCtl}. Définissez FERROLINK_POSTGRES_BIN si nécessaire.`);
}
if (!existsSync(dataDirectory)) {
  throw new Error("La base locale FerroLink n’est pas initialisée ; configurez server/.env et initialisez PostgreSQL.");
}
mkdirSync(path.dirname(logFile), { recursive: true });

const status = spawnSync(pgCtl, ["status", "-D", dataDirectory], { stdio: "ignore", windowsHide: true });
if (action === "start" && status.status === 0) {
  console.log("La base locale FerroLink est déjà démarrée.");
  process.exit(0);
}
if (action === "stop" && status.status !== 0) {
  console.log("La base locale FerroLink est déjà arrêtée.");
  process.exit(0);
}

const args = action === "start"
  ? ["start", "-D", dataDirectory, "-l", logFile, "-o", "-h 127.0.0.1 -p 5433", "-w"]
  : ["stop", "-D", dataDirectory, "-w"];
const result = spawnSync(pgCtl, args, { stdio: "inherit", windowsHide: true });
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status || 1);
console.log(`Base locale FerroLink ${action === "start" ? "démarrée" : "arrêtée"}.`);
