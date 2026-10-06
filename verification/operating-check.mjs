(()=>JSON.stringify({
 primaryNavigation:[...document.querySelectorAll('nav[aria-label="Workspace"] button')].map(button=>button.textContent.trim()),
 stages:[...document.querySelectorAll('.operating-stage')].map(button=>({label:button.querySelector('.stage-label').textContent,count:button.querySelector('strong').textContent})),
 contentQueue:document.body.innerText.includes('research-derived items ready to publish'),
 olaQueue:document.body.innerText.includes('Needs Ola'),
 analystQueue:document.body.innerText.includes('Needs Analyst'),
 overflow:document.documentElement.scrollWidth>innerWidth
}))();
