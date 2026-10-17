import fs from "fs";
let content = fs.readFileSync("src/components/scan/LiveWalkthrough.tsx", "utf8");

content = content.replace(
    'const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");',
    `const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [subtitles, setSubtitles] = useState<string>("");
  const [chatInput, setChatInput] = useState<string>("");`
);

content = content.replace(
    `          if (parsed.audio) {
            playAudioChunk(outputCtx, parsed.audio);
          }`,
    `          if (parsed.audio) {
            playAudioChunk(outputCtx, parsed.audio);
          }
          if (parsed.text) {
            setSubtitles(prev => prev + parsed.text);
          }`
);

// We need an input and a display area for subtitles.
// Let's find the bottom controls
const bottomControls = `<div className="absolute bottom-6 inset-x-0 flex justify-center items-center gap-4">`;

content = content.replace(
    bottomControls,
    `
          {subtitles && (
            <div className="absolute bottom-24 inset-x-0 px-4 flex justify-center z-20 pointer-events-none">
               <div className="bg-black/60 text-white px-4 py-2 rounded-lg max-w-xl text-center text-lg backdrop-blur shadow-lg">
                  {subtitles}
               </div>
            </div>
          )}
          <div className="absolute bottom-6 inset-x-0 px-4 flex flex-col items-center gap-4 z-20">
            <form onSubmit={(e) => {
              e.preventDefault();
              if (chatInput.trim() && wsRef.current?.readyState === WebSocket.OPEN) {
                 wsRef.current.send(JSON.stringify({ text: chatInput.trim() }));
                 setSubtitles("You: " + chatInput.trim() + "\\n");
                 setChatInput("");
              }
            }} className="w-full max-w-md flex gap-2">
              <input 
                 type="text" 
                 value={chatInput} 
                 onChange={e => setChatInput(e.target.value)} 
                 placeholder="Type to chat..." 
                 className="flex-1 bg-white/20 border-white/30 text-white placeholder-white/70 rounded-full px-4 py-2 outline-none focus:bg-white/30 transition-colors backdrop-blur"
              />
              <Button type="submit" variant="secondary" className="rounded-full px-6">Send</Button>
            </form>
            <div className="flex justify-center items-center gap-4">
`
);

// We also replaced `flex justify-center items-center gap-4` above, let's fix the closing tags.
// Wait, the original code had:
// <div className="absolute bottom-6 inset-x-0 flex justify-center items-center gap-4">
// We replaced it with a div containing the form and then another div for the controls.
// But we need to make sure the original div's closing tag is accounted for.
// The original was:
// <div className="absolute bottom-6 inset-x-0 flex justify-center items-center gap-4">
//   <Button ... />
//   ...
// </div>
// Our replacement:
// <div className="absolute bottom-6 inset-x-0 px-4 flex flex-col items-center gap-4 z-20">
//   <form ... />
//   <div className="flex justify-center items-center gap-4">
// Wait, we need to add a closing `</div>` somewhere, because we added a new wrapping `div` (the `flex-col` one).
// Let's replace the original closing `</div>` of the bottom controls.
content = content.replace(
    '</Button>\n        </div>\n      </div>\n    </div>',
    '</Button>\n            </div>\n        </div>\n      </div>\n    </div>'
);

// We should also clear subtitles after some time if there's no new text.
// Let's use a ref and timeout.
content = content.replace(
    `const videoIntervalRef = useRef<number | null>(null);`,
    `const videoIntervalRef = useRef<number | null>(null);
  const subtitleTimeoutRef = useRef<NodeJS.Timeout | null>(null);`
);

content = content.replace(
    `          if (parsed.text) {
            setSubtitles(prev => prev + parsed.text);
          }`,
    `          if (parsed.text) {
            setSubtitles(prev => {
                const updated = prev + parsed.text;
                if (subtitleTimeoutRef.current) clearTimeout(subtitleTimeoutRef.current);
                subtitleTimeoutRef.current = setTimeout(() => setSubtitles(""), 8000);
                return updated;
            });
          }`
);

content = content.replace(
    `                 setSubtitles("You: " + chatInput.trim() + "\\n");`,
    `                 setSubtitles("You: " + chatInput.trim() + "\\n");
                 if (subtitleTimeoutRef.current) clearTimeout(subtitleTimeoutRef.current);
                 subtitleTimeoutRef.current = setTimeout(() => setSubtitles(""), 8000);`
);

fs.writeFileSync("src/components/scan/LiveWalkthrough.tsx", content);
