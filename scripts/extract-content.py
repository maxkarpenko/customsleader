"""Extract verbatim public copy; source Markdown is never modified."""
import json, re
from pathlib import Path
root = Path(__file__).resolve().parent.parent
source = (root / 'landing-structure.md').read_text()
blocks = re.split(r'^## (\d+)\. (.+)$', source, flags=re.M)
out = {}
def unquote(s):
    s = s.strip()
    return s[1:-1] if s.startswith('«') and s.endswith('»') else s
def quoted(s):
    start=s.find('«')
    if start<0: return ''
    depth=0
    for j in range(start,len(s)):
        if s[j]=='«': depth+=1
        if s[j]=='»': depth-=1
        if depth==0: return s[start+1:j]
    return ''
for i in range(1, len(blocks), 3):
    number, title, body = blocks[i:i+3]
    if number == '14': body = body.split('## Модальные окна')[0]
    entries = []
    for line in body.splitlines():
        if '~~' in line: continue
        # Find the outer Russian quotes, preserving nested company quotations.
        if '«' in line and '»' in line:
            raw = quoted(line)
            tags = re.findall(r'\*\*([^*]+)\*\*', line)
            entries.append({'tag': tags[0] if tags else 'text', 'text': raw})
    tables=[]
    for line in body.splitlines():
        if re.match(r'^\| \d+ \|', line):
            tables.append([unquote(x) for x in line.strip('|').split('|')[1:]])
    headings = {}
    for kind in ['H1','H2','LEAD']:
        m=re.search(r'\*\*'+kind+r'\*\*: «(.+)»',body)
        if m: headings[kind]=m.group(1)
    out[number]={'title':title,'body':body,'entries':entries,'tables':tables,**headings}
# Pull dedicated self-contained chunks so UI can preserve their exact copy.
def items(chunk, kind):
    return [quoted(x) for x in re.findall(r'\*\*'+kind+r'\*\*[^\n]+',chunk)]
services=[]
for chunk in re.split(r'\*\*Карточка \d\*\*',out['3']['body'])[1:]:
    services.append({'title':items(chunk,'H3')[0],'text':items(chunk,'P')[0],
      'list':re.findall(r'^  - «(.+)»',chunk,re.M),'cta':items(chunk,'LINK')[0]})
cases=[]
for chunk in re.split(r'### Кейс \d',out['4']['body'])[1:]:
    cases.append({'title':items(chunk,'H3')[0],'stat':items(chunk,'STAT')[0],
      'label':re.search(r'\*\*STAT\*\*.*?\+ \*\*LABEL\*\* «(.+)»',chunk).group(1) if '+ **LABEL**' in chunk else '',
      'description':items(chunk,'P')[0],'headings':items(chunk,'H4'), 'paragraphs':items(chunk,'P')[1:]})
tabs=[]
for chunk in re.split(r'### Таб «',out['6']['body'])[1:]:
    tabs.append({'label':chunk.split('»')[0],'title':items(chunk,'H3')[0],
      'text':items(chunk,'P')[0],'list':re.findall(r'^  - «(.+)»',chunk,re.M),
      'note':items(chunk,'P')[-1]})
faq=[]
for question, answer in re.findall(r'\d\. \*\*«(.+)»\*\*\n\s+(.+)',out['10']['body']):
    faq.append({'question':question,'answer':answer})
data={'sections':{k:{a:b for a,b in v.items() if a!='body'} for k,v in out.items()},'services':services,'cases':cases,'tabs':tabs,'faq':faq}
(root/'src'/'content.json').write_text(json.dumps(data,ensure_ascii=False,indent=2))
print(f'Extracted {len(out)} sections, {len(services)} services, {len(cases)} cases, {len(tabs)} tabs and {len(faq)} FAQs.')
