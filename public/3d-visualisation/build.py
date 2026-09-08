from pathlib import Path
root = Path(__file__).resolve().parent
html = (root / 'template.html').read_text(encoding='utf-8')
html = html.replace('/* STYLE */', (root / 'style.css').read_text(encoding='utf-8'))
html = html.replace('/* SCRIPT */', (root / 'app.js').read_text(encoding='utf-8'))
(root / 'index.html').write_text(html, encoding='utf-8')
print('Built index.html — open it in your browser.')
