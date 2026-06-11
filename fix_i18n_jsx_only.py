import os
import glob
import re

files = glob.glob('src/modules/finance/**/*.tsx', recursive=True)

def has_cyrillic(text):
    return bool(re.search(r'[А-Яа-яЁё]', text))

for file in files:
    with open(file, 'r') as f:
        content = f.read()

    if not has_cyrillic(content):
        continue

    original = content

    if 'useTranslation' not in content:
        content = "import { useTranslation } from 'react-i18next';\n" + content

    def inject_hook(m):
        prefix = m.group(1)
        name = m.group(2)
        rest = m.group(3)
        if name[0].isupper():
            return f"{prefix}{name}{rest}{{\n  const {{ t }} = useTranslation();\n"
        return m.group(0)

    # const MyComp: React.FC = () => {
    content = re.sub(r'(const\s+)([A-Z][a-zA-Z0-9_]*)(\s*(?::\s*React\.(?:FC|VFC)(?:<[^>]+>)?\s*)?=\s*(?:\([^)]*\)|[^=]*)\s*=>\s*){', inject_hook, content)

    # export function MyComp() {
    content = re.sub(r'(export\s+function\s+)([A-Z][a-zA-Z0-9_]*)(\s*\([^)]*\)\s*){', inject_hook, content)

    # ONLY REPLACE JSX Texts!
    def replace_jsx(m):
        prefix = m.group(1)
        text = m.group(2)
        suffix = m.group(3)
        if not has_cyrillic(text): return m.group(0)
        
        stripped = text.strip()
        escaped = stripped.replace('"', '\\"')
        replaced = text.replace(stripped, f'{{t("{escaped}", "{escaped}")}}')
        return f"{prefix}{replaced}{suffix}"

    content = re.sub(r'(>)([^<>{}\n]*[А-Яа-яЁё][^<>{}\n]*)(<)', replace_jsx, content)

    # ONLY REPLACE JSX String Attributes
    def replace_attr(m):
        attr = m.group(1)
        text = m.group(2)
        if not has_cyrillic(text): return m.group(0)
        escaped = text.replace('"', '\\"')
        return f'{attr}={{t("{escaped}", "{escaped}")}}'

    content = re.sub(r'([a-zA-Z0-9_]+)="([^"{}\n]*[А-Яа-яЁё][^"{}\n]*)"', replace_attr, content)

    if original != content:
        with open(file, 'w') as f:
            f.write(content)

print("Done")
