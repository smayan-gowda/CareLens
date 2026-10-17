import fs from "fs";
let content = fs.readFileSync("src/components/scan/LiveWalkthrough.tsx", "utf8");

content = content.replace(
    '{isConnected ? "Live Walkthrough" : "Connecting..."}',
    '{isConnected ? "Connected - Start speaking!" : "Connecting..."}'
);

fs.writeFileSync("src/components/scan/LiveWalkthrough.tsx", content);
