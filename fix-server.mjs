import fs from "fs";
let content = fs.readFileSync("server.ts", "utf8");

content = content.replace(
    'session.send(JSON.stringify({ clientContent: { turns: [{ role: "user", parts: [{text: parsed.text}] }], turnComplete: true } }));',
    'session.sendClientContent({ turns: [{ role: "user", parts: [{text: parsed.text}] }], turnComplete: true });'
);

fs.writeFileSync("server.ts", content);
