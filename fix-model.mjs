import fs from "fs";
let content = fs.readFileSync("server.ts", "utf8");
content = content.replace('model: "gemini-3.1-flash-live-preview"', 'model: "gemini-2.0-flash-exp"');
fs.writeFileSync("server.ts", content);
