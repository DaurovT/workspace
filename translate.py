import os
import re

files_to_process = [
  'src/modules/finance/FinanceApp.tsx',
  'src/modules/finance/pages/ReferencesContractorsPage.tsx',
  'src/modules/finance/pages/DealsInvoicesPage.tsx',
  'src/modules/finance/pages/LiabilitiesPage.tsx',
  'src/modules/finance/pages/ReferencesCategoriesPage.tsx',
  'src/modules/finance/pages/AssetsPage.tsx',
  'src/modules/finance/pages/BudgetPlanningPage.tsx',
  'src/modules/finance/pages/ReferencesAccountsPage.tsx',
  'src/modules/finance/pages/SettingsPage.tsx',
  'src/modules/finance/pages/DocumentsPage.tsx',
  'src/modules/finance/pages/ProjectsPage.tsx',
  'src/modules/finance/pages/DealsSalesPage.tsx',
  'src/modules/finance/pages/ReferencesEntitiesPage.tsx',
  'src/modules/finance/pages/PaymentApprovalsPage.tsx',
  'src/modules/finance/pages/ReferencesProductsPage.tsx',
  'src/modules/finance/pages/DealsPurchasePage.tsx',
  'src/modules/finance/components/PayLoanModal.tsx',
  'src/modules/finance/components/LiabilitiesTable.tsx',
  'src/modules/finance/components/LoanModal.tsx',
  'src/modules/finance/components/DocumentViewerModal.tsx',
  'src/modules/finance/components/PurchaseDealDetailsView.tsx',
  'src/modules/finance/components/DealDetailsModal.tsx',
  'src/modules/finance/components/DataImportWizard.tsx',
  'src/modules/finance/components/BudgetBdrDetail.tsx',
  'src/modules/finance/components/AccountsTable.tsx',
  'src/modules/finance/components/ProductFormModal.tsx',
  'src/modules/finance/components/ProjectFormModal.tsx',
  'src/modules/finance/components/CategoriesTreeTable.tsx',
  'src/modules/finance/components/DealsTable.tsx',
  'src/modules/finance/components/BudgetBddsList.tsx',
  'src/modules/finance/components/PaymentCalendarTable.tsx',
  'src/modules/finance/components/QuickExpenseModal.tsx'
]

has_cyrillic = re.compile(r'[А-Яа-яЁё]')

# Matches things like > Текст <
# Note: we exclude < > to avoid replacing inside other tags.
# This simple regex matches text between > and < that contains Cyrillic characters.
# We must be careful about { } blocks inside JSX!

def replace_jsx_text(content):
    # This matches >...< where ... contains cyrillic, but does not contain < or >.
    # It might contain {} which means it's a JS expression, we shouldn't touch expressions directly with this simple regex.
    # Actually, if it has {} we shouldn't wrap the whole thing.
    
    def repl(m):
        inner_text = m.group(1)
        if '{' in inner_text or '}' in inner_text:
            return f">{inner_text}<"
        if not has_cyrillic.search(inner_text):
            return f">{inner_text}<"
            
        # Strip leading/trailing space for the component, but preserve it in the output
        left_space = inner_text[:len(inner_text) - len(inner_text.lstrip())]
        right_space = inner_text[len(inner_text.rstrip()):]
        text_core = inner_text.strip()
        
        # Escape quotes if necessary, though in JSX <TranslatableText text="..."/> usually works.
        # But if text contains quotes, we need to be careful.
        text_core = text_core.replace('"', '&quot;')
        
        return f">{left_space}<TranslatableText text=\"{text_core}\" />{right_space}<"

    new_content = re.sub(r'>([^<]+)<', repl, content)
    return new_content

def replace_placeholder(content):
    # placeholder="Текст" -> placeholder={t('placeholder.Текст', 'Текст')}
    # We will just use standard t() if possible, but t is not always imported.
    # Better to just stick to <TranslatableText /> for text nodes, and leave placeholders for manual or simple translation
    return content

for path in files_to_process:
    if not os.path.exists(path):
        continue
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    original_content = content
    content = replace_jsx_text(content)
    
    if content != original_content:
        # Check if TranslatableText is imported
        if 'TranslatableText' not in content:
            import_statement = "import { TranslatableText } from '../../../components/TranslatableText';\n"
            if 'components/' in path:
                import_statement = "import { TranslatableText } from '../../../components/TranslatableText';\n"
            # Just insert after the last import
            parts = content.split('\n')
            last_import = -1
            for i, line in enumerate(parts):
                if line.startswith('import '):
                    last_import = i
            
            if last_import != -1:
                parts.insert(last_import + 1, import_statement)
                content = '\n'.join(parts)
            else:
                content = import_statement + content
                
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
            
print("Done")
