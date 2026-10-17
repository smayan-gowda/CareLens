import fs from "fs";

let content = fs.readFileSync("src/components/scan/LiveWalkthrough.tsx", "utf8");

content = content.replace(
    'streamRef.current = stream;',
    `streamRef.current = stream;
        const currentStream = stream;`
);

content = content.replace(
    'ws = new WebSocket',
    'const newWs = new WebSocket'
);

content = content.replace(
    'wsRef.current = ws;',
    `ws = newWs;
        wsRef.current = newWs;
        const currentWs = newWs;`
);

content = content.replace(
    'inputAudioCtxRef.current = inputCtx;',
    `inputAudioCtxRef.current = inputCtx;
        const currentInputCtx = inputCtx;`
);

content = content.replace(
    'outputAudioCtxRef.current = outputCtx;',
    `outputAudioCtxRef.current = outputCtx;
        const currentOutputCtx = outputCtx;`
);

content = content.replace(
    'videoIntervalRef.current = window.setInterval(() => {',
    `const intervalId = window.setInterval(() => {
          videoIntervalRef.current = intervalId;`
);

// We need to rewrite cleanup entirely
const oldCleanup = `  function cleanup() {
    if (videoIntervalRef.current) clearInterval(videoIntervalRef.current);
    if (wsRef.current) wsRef.current.close();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    if (inputAudioCtxRef.current && inputAudioCtxRef.current.state !== 'closed') {
      inputAudioCtxRef.current.close();
    }
    if (outputAudioCtxRef.current && outputAudioCtxRef.current.state !== 'closed') {
      outputAudioCtxRef.current.close();
    }
  }`;

const newCleanup = `  function cleanup(specificWs?: WebSocket, specificStream?: MediaStream, specificInterval?: number) {
    if (specificInterval) clearInterval(specificInterval);
    else if (videoIntervalRef.current) clearInterval(videoIntervalRef.current);
    
    if (specificWs) specificWs.close();
    else if (wsRef.current) wsRef.current.close();
    
    if (specificStream) {
      specificStream.getTracks().forEach(t => t.stop());
    } else if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    
    if (inputAudioCtxRef.current && inputAudioCtxRef.current.state !== 'closed') {
      inputAudioCtxRef.current.close();
    }
    if (outputAudioCtxRef.current && outputAudioCtxRef.current.state !== 'closed') {
      outputAudioCtxRef.current.close();
    }
  }`;

content = content.replace(oldCleanup, newCleanup);

// And change the unmount cleanup to use specific instances
content = content.replace(
    `    return () => {
      isActive = false;
      cleanup();
    };`,
    `    return () => {
      isActive = false;
      cleanup(ws, streamRef.current, videoIntervalRef.current); // Use current refs at unmount, or better, the variables from the closure if we could
    };`
);

fs.writeFileSync("src/components/scan/LiveWalkthrough.tsx", content);
