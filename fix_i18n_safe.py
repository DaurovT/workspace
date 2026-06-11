import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    changed = False

    # 1. Replace attributes: label="Выручка" -> label={t("Выручка", "Выручка")}
    def attr_repl(m):
        attr = m.group(1)
        val = m.group(2)
        if re.search(r'[А-Яа-яЁё]', val):
            return f'{attr}={{t("{val}", "{val}")}}'
        return m.group(0)

    new_content = re.sub(r'(label|title|name|placeholder|dataKey|text)="([^"{\n]+)"', attr_repl, content)
    if new_content != content:
        content = new_content
        changed = True

    # 2. Replace object keys in simple arrays (like menuItems)
    def prop_repl(m):
        prop = m.group(1)
        val = m.group(2)
        if re.search(r'[А-Яа-яЁё]', val):
            return f"{prop}: t('{val}', '{val}')"
        return m.group(0)
    
    new_content = re.sub(r'(label|title|name):\s*\'([^\'{\n]+)\'', prop_repl, content)
    if new_content != content:
        content = new_content
        changed = True

    if changed:
        if 'useTranslation' not in content:
            content = "import { useTranslation } from 'react-i18next';\n" + content
        
        # Inject ONLY into the main exported functional component safely
        # E.g. export const Dashboard = () => {
        # or export default function Dashboard() {
        if 'const { t }' not in content:
            content = re.sub(r'(export const [A-Z]\w+ = \([^)]*\)\s*=>\s*\{)', r'\1\n  const { t } = useTranslation();\n', content, count=1)
            content = re.sub(r'(export function [A-Z]\w+\([^)]*\)\s*\{)', r'\1\n  const { t } = useTranslation();\n', content, count=1)

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed {filepath}")

for root, _, files in os.walk('src/modules/finance'):
    for file in files:
        if file.endswith('.tsx'):
            process_file(os.path.join(root, file))

