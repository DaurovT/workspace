import os
import re

directory = "/root/workspace/src/finance/pages/"
for filename in os.listdir(directory):
    if not filename.endswith(".tsx"):
        continue
    filepath = os.path.join(directory, filename)
    with open(filepath, 'r') as f:
        content = f.read()

    # Make sure useEffect is imported
    if "import React" in content and "useEffect" not in content:
        content = re.sub(r'import React, {([^}]+)}', r'import React, {\1, useEffect}', content)

    # Patterns
    patterns = [
        (r'const \[isSidebarOpen, setSidebarOpen\] = useState\((?:true|false)\);', 'isSidebarOpen', 'setSidebarOpen'),
        (r'const \[isFilterOpen, setIsFilterOpen\] = useState\((?:true|false)\);', 'isFilterOpen', 'setIsFilterOpen')
    ]

    for regex, state_var, setter in patterns:
        if re.search(regex, content):
            replacement = f"""const [{state_var}, {setter}] = useState(false);

  React.useEffect(() => {{
    const handleKeyDown = (e: KeyboardEvent) => {{
      if (e.key.toLowerCase() === 'f' && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {{
        {setter}(prev => !prev);
      }}
    }};
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }}, []);"""
            
            # Remove existing useEffect for handleKeyDown if it exists (for idempotency)
            # Actually, I'll just replace the single line first, assuming it's only one.
            content = re.sub(regex, replacement, content)

    with open(filepath, 'w') as f:
        f.write(content)
print("Done")
