import { runFullSystemDiagnostics } from "./systemIntegrationCheck.ts";

runFullSystemDiagnostics()
  .then((res) => {
    console.log("Diagnostic Result:", res);
    process.exit(0);
  })
  .catch((err) => {
    console.error("Diagnostic Failed:", err);
    process.exit(1);
  });
