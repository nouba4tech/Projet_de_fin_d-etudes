import os
import glob
import re

components_dir = r'C:\Users\nouba\Desktop\Mirador-hotel\frontend\components'

for filepath in glob.glob(os.path.join(components_dir, '*.tsx')):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Fix the main wrapper background
    content = re.sub(
        r'<div\s+className="min-h-screen\s+[^"]*">',
        '<div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">',
        content
    )
    
    # 2. Fix the active tab styles to match Security.tsx
    content = re.sub(
        r'border-blue-500 text-blue-\d+ bg-[a-z]+-50/?[0-9]*',
        'border-blue-500 text-blue-400 bg-gradient-to-r from-blue-500/10 to-purple-500/10',
        content
    )
    # Fix the active tab if it's text-white
    content = re.sub(
        r'border-blue-500 text-white bg-white/[0-9]+',
        'border-blue-500 text-blue-400 bg-gradient-to-r from-blue-500/10 to-purple-500/10',
        content
    )

    # 3. Fix the inner max-w wrapper
    content = re.sub(
        r'<div className="max-w-7xl mx-auto[^"]*">',
        '<div className="max-w-full mx-auto px-6 lg:px-8 py-8">',
        content
    )
    
    # 4. Clean up corrupted classes created by previous script
    content = content.replace('bg-gray-800/50/5', 'bg-white/5')
    content = content.replace('bg-white/5/5', 'bg-white/5')
    content = content.replace('bg-gray-50/50', 'bg-white/5')
    content = content.replace('bg-gray-50', 'bg-white/5')
    content = content.replace('text-blue-600', 'text-blue-400')
    content = content.replace('text-blue-700', 'text-blue-300')
    content = content.replace('text-blue-800', 'text-blue-300')
    content = content.replace('text-green-600', 'text-green-400')
    content = content.replace('text-green-700', 'text-green-300')
    content = content.replace('text-green-800', 'text-green-300')
    content = content.replace('text-red-600', 'text-red-400')
    content = content.replace('text-red-700', 'text-red-300')
    content = content.replace('text-red-800', 'text-red-300')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print('Cleaned UI consistency')
