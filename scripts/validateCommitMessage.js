const fs = require("fs");

const commitMessagePath = process.argv[2];
const message = fs.readFileSync(commitMessagePath, "utf8").trim();
const subject = message.split(/\r?\n/)[0];
const allowedTypes = ["feat", "fix", "test", "docs", "refactor", "chore"];
const commitPattern = new RegExp(
  `^(${allowedTypes.join("|")})(\\([a-z0-9-]+\\))?: .{3,100}$`
);

if (/^(Merge|Revert)\b/.test(subject)) {
  process.exit(0);
}

if (!commitPattern.test(subject)) {
  console.error("\nInvalid commit message.");
  console.error("Use: type: short description");
  console.error(`Allowed types: ${allowedTypes.join(", ")}`);
  console.error("\nExamples:");
  console.error("  feat: add profile update api");
  console.error("  fix(auth): protect production cookies");
  process.exit(1);
}
