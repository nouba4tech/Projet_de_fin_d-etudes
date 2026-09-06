from pathlib import Path

path = Path('components/Parametres.tsx')
text = path.read_text(encoding='utf-8')
lines = text.splitlines()

start = None
brace = 0
for i, line in enumerate(lines, start=1):
    if start is None and 'const renderTabContent = () => {' in line:
        start = i
        print('start', i)
    if start is not None:
        opens = line.count('{')
        closes = line.count('}')
        brace += opens - closes
        if 2630 <= i <= 2950 or i in [start, len(lines)-5, len(lines)-1]:
            print(f'{i}: {brace}: {line}')
        if 'case \'caisse\':' in line:
            print('caisse at', i, brace)
        if 'default:' in line and i > 3600:
            print('default at', i, brace)
        if i == len(lines):
            print('end', brace)
