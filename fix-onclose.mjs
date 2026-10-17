import fs from "fs";
let content = fs.readFileSync("src/components/scan/LiveWalkthrough.tsx", "utf8");

content = content.replace(
    'ws.onclose = (event) => {',
    `ws.onclose = (event) => {
          if (!isActive) return; // Ignore if unmounted
          console.log('WebSocket closed', event);
          if (wsRef.current !== ws) return; // Only cleanup if this is the active websocket`
);

fs.writeFileSync("src/components/scan/LiveWalkthrough.tsx", content);
