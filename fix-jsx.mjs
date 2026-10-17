import fs from "fs";
let content = fs.readFileSync("src/components/scan/LiveWalkthrough.tsx", "utf8");

content = content.replace(
    '          </div>\n        </div>\n      </div>\n    </div>\n  );\n}',
    '          </div>\n        </div>\n      </div>\n    </div>\n    </div>\n  );\n}'
);

fs.writeFileSync("src/components/scan/LiveWalkthrough.tsx", content);
