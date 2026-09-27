from pathlib import Path
import json, re
from PIL import Image

root = Path(__file__).resolve().parents[1]
p = root / 'projects.html'
html = p.read_text(encoding='utf-8')
shots = []
for name, caption, alt in [
    ('dashboard', 'Asset management dashboard / Public preview', 'AkerAI public dashboard preview with portfolio metrics and operating performance'),
    ('products', 'Analytics, agents, and workflows / Public overview', 'AkerAI public product overview showing connected data, analytics, agents, and workflows')]:
    src = f'img/projects/akerai-{name}.png'
    w, h = Image.open(root / src).size
    shots.append(f'<a class="work-shot" data-preview="" data-caption="{caption}" href="{src}"><img src="{src}" alt="{alt}" width="{w}" height="{h}" loading="{"eager" if name == "dashboard" else "lazy"}" decoding="async"/><span class="shot-caption">{caption}<span aria-hidden="true">↗</span></span></a>')
current = f'''<section class="work-current projects-theme-section" id="current-chapter" aria-labelledby="current-title" data-header-tone="dark"><div class="container">
<article class="work-current-project">
<div class="work-current-copy"><p class="page-kicker">The current chapter / Present</p><h2 id="current-title">Intelligence, put to work.</h2><h3>AkerAI</h3><p>Today, I lead AI &amp; Platforms at Aker, connecting institutional knowledge, operating data, analytics, and agents to improve how investment work gets done.</p><a class="inline-link" href="https://aker-ai.com/" rel="noreferrer" target="_blank">Explore AkerAI <span aria-hidden="true">↗</span></a></div>
<div class="work-gallery" aria-label="AkerAI screenshots">{shots[0]}<details class="work-gallery-more"><summary data-gallery-open="" aria-label="View 2 images of AkerAI">View 2 images</summary><div class="work-gallery-extras">{shots[1]}</div></details></div>
</article></div></section>'''
html = re.sub(r'<section class="work-current\b.*?</section>', '', html, flags=re.S)
html = html.replace('<section aria-labelledby="selected-title"', current + '\n<section aria-labelledby="selected-title"')
years = {'investopia':'2020', 'image-repository':'2021', 'ryzer':'2020', 'company-analysis':'2024', 'vaccine-distribution':'2021', 'quantitative-research':'2021'}
for ident, year in years.items():
    pattern = rf'(<article\b[^>]*id="{ident}".*?<div class="work-eyebrow">.*?<span>)([^<]+)(</span></div>)'
    html, n = re.subn(pattern, lambda m:m[1]+m[2]+f' · <time datetime="{year}">{year}</time>'+m[3], html, count=1, flags=re.S)
    assert n == 1, ident
html = html.replace('fetchpriority="high" ', '').replace('loading="eager" src="img/investopia', 'loading="lazy" src="img/investopia')
html = html.replace('css/projects.css?v=7','css/projects.css?v=8')
match = re.search(r'(<script type="application/ld\+json">\s*)(.*?)(\s*</script>)', html, re.S)
data = json.loads(match[2])
data['@graph'][0]['dateModified'] = '2026-09-27'
items = data['@graph'][1]['itemListElement']
items.insert(0, {'@type':'ListItem','position':1,'item':{'@type':'SoftwareApplication','name':'AkerAI','url':'https://aker-ai.com/','description':'AI and platforms work at Aker, connecting institutional knowledge, operating data, analytics, and agents.','author':{'@id':'https://pmoe7.com/#person'},'applicationCategory':'BusinessApplication','image':'https://pmoe7.com/img/projects/akerai-dashboard.png'}})
for i,item in enumerate(items,1): item['position']=i
data['@graph'][1]['numberOfItems']=len(items)
html=html[:match.start(2)]+json.dumps(data,ensure_ascii=False,separators=(',',':'))+html[match.end(2):]
p.write_text(html,encoding='utf-8')
api_path=root/'api/projects.json'
api=json.loads(api_path.read_text(encoding='utf-8'))
for project,year in zip(api['projects'],years.values()):
    project['year']=year
    project['dateNote']='Publication year' if year=='2024' else 'Year documented in the portfolio archive'
api['projects'].insert(0,{'id':'akerai','name':'AkerAI','category':['AI','Platforms','Real estate'],'description':'AI and platforms work at Aker, connecting institutional knowledge, operating data, analytics, and agents.','status':'Current','url':'https://aker-ai.com/','image':'https://pmoe7.com/img/projects/akerai-dashboard.png','images':['https://pmoe7.com/img/projects/akerai-dashboard.png','https://pmoe7.com/img/projects/akerai-products.png']})
api['lastUpdated']='2026-09-27'
api_path.write_text(json.dumps(api,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
