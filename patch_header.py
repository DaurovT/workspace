import re

with open('src/modules/finance/components/FinanceHeader.tsx', 'r') as f:
    content = f.read()

# Add imports
if 'LanguageSwitcher' not in content:
    content = re.sub(r'(import .* from .lucide-react.;)', r"\1\nimport { LanguageSwitcher } from '../../../components/LanguageSwitcher';\nimport { useTranslation } from 'react-i18next';", content)

# Inject LanguageSwitcher
if '<LanguageSwitcher />' not in content:
    content = content.replace('{/* Тема */}', '{/* Язык */}\n      <LanguageSwitcher />\n\n      {/* Тема */}')

# Inject useTranslation hook
if 'const { t } = useTranslation();' not in content:
    content = content.replace('const { activeView } = useFinanceStore();', 'const { activeView } = useFinanceStore();\n  const { t } = useTranslation();')

# Translate getTitle()
def replace_title(m):
    return f"case '{m.group(1)}': return t('{m.group(2)}', '{m.group(2)}');"

content = re.sub(r"case '([^']+)': return '([^']+)';", replace_title, content)
content = content.replace("default: return 'Финансы';", "default: return t('Финансы', 'Финансы');")

with open('src/modules/finance/components/FinanceHeader.tsx', 'w') as f:
    f.write(content)
