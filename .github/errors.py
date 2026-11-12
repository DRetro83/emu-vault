# Turns the compiler errors in a build log into GitHub annotations, so they show on the run's page.
import sys, re
log = open(sys.argv[1], encoding="utf-8", errors="replace").read()
log = re.sub(r"\x1b\[[0-9;]*m", "", log)
blocks, cur = [], None
for line in log.splitlines():
    if re.match(r"^(error|warning: unused)", line):
        if cur: blocks.append(cur)
        cur = [line] if line.startswith("error") else None
    elif cur is not None:
        if line.strip() == "" and len(cur) > 3:
            blocks.append(cur); cur = None
        else:
            cur.append(line)
if cur: blocks.append(cur)
if not blocks:
    blocks = [log.splitlines()[-60:]]
def esc(t): return t.replace("%", "%25").replace("\r", "").replace("\n", "%0A")
for b in blocks[:9]:
    print("::error title=" + esc(b[0][:120]).replace(":", " ").replace(",", " ") + "::" + esc("\n".join(b[:40])))
rest = blocks[9:]
if rest:
    print("::error title=more errors::" + esc("\n\n".join("\n".join(b[:12]) for b in rest)[:60000]))
