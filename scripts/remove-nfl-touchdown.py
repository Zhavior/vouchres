import os
import re

files_to_check = [
    'src/lib/featureConfig.ts',
    'src/app/betaNavigation.ts',
    'src/app/appNavModel.ts',
    'src/app/sectionNavigation.ts',
    'src/app/AppTopBar.tsx'
]

for filepath in files_to_check:
    with open(filepath, 'r') as f:
        content = f.read()

    if 'featureConfig.ts' in filepath:
        # Remove the config entry
        content = re.sub(r'^\s*\{\s*id:\s*"nfl_touchdown".*?\},?\n?', '', content, flags=re.MULTILINE)

    if 'betaNavigation.ts' in filepath:
        # Remove 'nfl_touchdown' from lists
        content = re.sub(r"^\s*'nfl_touchdown',?\n?", "", content, flags=re.MULTILINE)

    if 'sectionNavigation.ts' in filepath:
        # Remove 'nfl_touchdown'
        content = re.sub(r"^\s*'nfl_touchdown',?\n?", "", content, flags=re.MULTILINE)
        content = re.sub(r"target === 'nfl_touchdown' \|\| target === '/nfl_touchdown'", "", content)
        # Fix dangling `||` if we just removed the last condition
        content = re.sub(r"\|\|\s*$", "", content, flags=re.MULTILINE)
        content = re.sub(r"'nfl_touchdown', ", "", content)

    if 'appNavModel.ts' in filepath or 'AppTopBar.tsx' in filepath:
        # Remove `|| activeSection === 'nfl_touchdown'` and `|| featureId === 'nfl_touchdown'`
        content = content.replace(" || featureId === 'nfl_touchdown'", "")
        content = content.replace(" || activeSection === 'nfl_touchdown'", "")

    with open(filepath, 'w') as f:
        f.write(content)
