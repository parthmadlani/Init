"""Validate structure in repository-authored HTML examples; never executes learner input."""
import json
from pathlib import Path
from html.parser import HTMLParser
root = Path(__file__).resolve().parents[1]
void = {'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}
class CheckHTML(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack=[]; self.ids=set(); self.labels=[]; self.fragments=[]
    def handle_starttag(self, tag, attrs):
        attrs=dict(attrs)
        if 'id' in attrs:
            assert attrs['id'] not in self.ids, 'Duplicate id'
            self.ids.add(attrs['id'])
        if tag=='label' and 'for' in attrs:self.labels.append(attrs['for'])
        if tag=='a' and attrs.get('href','').startswith('#'):self.fragments.append(attrs['href'][1:])
        if tag=='img':assert 'alt' in attrs, 'Missing image alternative'
        if tag=='th':assert attrs.get('scope') in {'row','col'}, 'Missing simple-table header scope'
        if tag=='button':assert attrs.get('type') in {'button','submit','reset'}, 'Explicit button type required'
        assert tag!='script', 'These are static HTML examples, not executable JavaScript'
        if tag not in void:self.stack.append(tag)
    def handle_endtag(self, tag):
        assert self.stack and self.stack[-1]==tag, f'Misnested closing {tag}'
        self.stack.pop()
    def finish(self):
        assert not self.stack, 'Unclosed elements'
        assert all(x in self.ids for x in self.labels), 'Label references missing control'
        assert all(x in self.ids for x in self.fragments), 'Fragment references missing target'
notes=[n for course in ['html','css','tailwind'] for n in json.loads((root/f'src/lib/learning/{course}-notes.json').read_text())]
examples=[(n['slug'],n['code']) for n in notes if n['code'].startswith('<')]
examples.extend((str(p.relative_to(root)), p.read_text()) for p in (root/'public/course-projects').rglob('*.html'))
for name, source in examples:
    try:
        parser=CheckHTML();parser.feed(source);parser.close();parser.finish()
    except AssertionError as exc:raise AssertionError(f'{name}: {exc}') from exc
print(f'Validated {len(examples)} authored HTML examples and starter documents.')
