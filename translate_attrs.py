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

# We will match attributes like placeholder="Russian" and title="Russian"
def replace_attrs(content):
    # placeholder="Text" -> placeholder={t('Text')}
    # Wait, we need `useTranslation` for t(). If we just use t('...'), it might crash if not defined.
    # It's safer to avoid t() if not imported.
    # Let's just find and report them, or actually we can add useTranslation where needed.
    return content

# Let's just do a check
found = 0
for path in files_to_process:
    if not os.path.exists(path):
        continue
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    matches = re.findall(r'(placeholder|title|label|name|text|data-tooltip-[a-z]+)="([^"]*[А-Яа-яЁё][^"]*)"', content)
    for m in matches:
        found += 1
        # print(f"{path}: {m[0]}={m[1]}")

print(f"Found {found} cyrillic attributes")
