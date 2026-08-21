import re

path = 'src/app/sectionNavigation.ts'
with open(path, 'r') as f:
    content = f.read()

# Remove 'nfl_touchdown' from lists in sectionNavigation.ts
content = re.sub(r"^\s*'nfl_touchdown',?\n?", "", content, flags=re.MULTILINE)
# Remove the exact target checks
content = content.replace("    target === 'nfl-touchdown' || target === '/nfl-touchdown' ||\n    target === 'nfl_touchdown' || target === '/nfl_touchdown'", "    target === 'nfl-touchdown' || target === '/nfl-touchdown'")

content = content.replace(", 'nfl_touchdown'", "")

with open(path, 'w') as f:
    f.write(content)
