import re

path = 'src/app/AppTopBar.tsx'
with open(path, 'r') as f:
    content = f.read()

content = content.replace(" && activeSection !== 'nfl_touchdown'", "")

with open(path, 'w') as f:
    f.write(content)
