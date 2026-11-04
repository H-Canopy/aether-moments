import json
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(sys.argv[1] if len(sys.argv)>1 else 'outputs/aether-moments-v0.3.0/examples/earthrise').resolve()
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    page=browser.new_page(viewport={'width':1200,'height':1000},accept_downloads=True)
    errors=[]
    page.on('pageerror',lambda e: errors.append(str(e)))
    page.goto((root/'preview.html').as_uri())
    assert page.locator('article').count()==3
    assert page.locator('img').evaluate_all('(imgs)=>imgs.every(x=>x.complete&&x.naturalWidth>0)')
    original=json.loads((root/'project.json').read_text(encoding='utf-8'))
    page.locator('textarea').nth(1).fill('Bill Anders 记录的地出。')
    page.locator('input').nth(1).fill('6')
    page.locator('select').nth(1).select_option('push')
    with page.expect_download() as info:
        page.locator('#save').click()
    download=info.value
    download.save_as(root/'browser-edited-project.json')
    edited=json.loads((root/'browser-edited-project.json').read_text(encoding='utf-8'))
    assert edited['scenes'][1]['seconds']==6
    assert edited['scenes'][1]['motion']=='push'
    assert edited['scenes'][0]==original['scenes'][0]
    assert edited['scenes'][2]==original['scenes'][2]
    page.locator('input').nth(1).fill('0')
    page.locator('#save').click()
    assert '检查字幕' in page.locator('#status').inner_text()
    page.screenshot(path=str(root/'preview-desktop.png'),full_page=True)
    page.set_viewport_size({'width':390,'height':844})
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    page.screenshot(path=str(root/'preview-mobile.png'),full_page=True)
    assert errors==[],errors
    report={'pass':True,'checks':['3 scenes and loaded photos','edit second caption and duration','download valid project JSON','preserve other scenes','reject invalid duration','390px no horizontal overflow','no JS errors'],'runner':'Python Playwright / Chromium headless','scope':'offline storyboard editor, not video player'}
    (root/'browser-results.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    print(json.dumps(report,indent=2))
    browser.close()
