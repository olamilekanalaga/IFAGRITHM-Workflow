import {Memory,RecordItem,Kind} from './model';
const records:RecordItem[]=[]; const relations:Memory['relations']=[];
function add(id:string,kind:Kind,title:string,body:string,status='Active',owner='Ola',category?:string){records.push({id,kind,title,body,status,owner,category,createdAt:new Date(Date.UTC(2026,9,6,9,records.length)).toISOString(),confidence:kind==='Insight'?'Tentative':undefined});}
function link(from:string,to:string,label:string){relations.push({id:`${from}-${to}`,from,to,label});}
add('ola','Person','Ola','Decision owner and research contributor. Demonstration profile.');
add('ada','Person','Ada • Scout','Discovers companies and captures source-backed observations. Demonstration profile.');
add('sam','Person','Sam • Researcher','Investigates hypotheses and documents limitations. Demonstration profile.');
const examples=[['nova','NovaX','Exchange','Trading competition','NovaX announced a $100,000 trading competition.','Trading incentives may indicate acquisition spend.','Trading Competition Prospecting','Conversation'],['tide','Tide Protocol','Protocol','Liquidity incentive','Tide announced a liquidity incentive programme.','Incentives may attract capital without sustained usage.','Retention Research Outreach','Researching'],['orbit','Orbit Social','Consumer App','Ambassador recruitment','Orbit opened applications for community ambassadors.','Community recruitment may signal distribution friction.','Distribution Discovery','Contacted'],['cedar','Cedar RWA','RWA','Partnership expansion','Cedar announced an expansion into a new market.','Expansion may introduce onboarding and partner dependencies.','Market Entry Discovery','Future Opportunity']];
for(const [id,name,category,behaviour,observation,hypothesis,strategy,status] of examples){
add(id,'Company',name,`Fictional ${category.toLowerCase()} used to demonstrate connected company memory.`,status,'Ada',category);
add(`${id}-person`,'Person',`${name} growth lead`,'Fictional external contact. No real outreach has occurred.','Known','Ada');
add(`${id}-behaviour`,'Behaviour',behaviour,'Editable demonstration behaviour label.');
add(`${id}-obs`,'Observation',observation,'Scout observation in a fictional scenario. Validate the source before using it commercially.','Recorded','Ada');
add(`${id}-evidence`,'Evidence',`${name} announcement reference`,'Sample source reference only; this is not verified evidence.','Sample','Ada');
add(`${id}-research`,'Research',`${name}: acquisition and retention`,hypothesis+' Investigate motivations, alternatives and missing evidence.','In progress','Sam');
add(`${id}-insight`,'Insight',hypothesis,'Tentative hypothesis, not a validated finding. Announcement alone does not establish budget, intent or willingness to buy.','Needs validation','Sam');
add(`${id}-strategy`,'Strategy',strategy,'Test whether an evidence-led conversation reveals a research need. Stop if the company is not qualified.','Testing','Ola');
add(`${id}-action`,'Action',`${name}: discovery outreach`,'Fictional outreach. Ask about the business decision and uncertainty before proposing work.',id==='nova'?'Completed':'Planned','Ola');
add(`${id}-outcome`,'Outcome',id==='nova'?'Replied → discovery conversation':'Outcome pending','Demonstration only. No actual client, revenue or response is claimed.',id==='nova'?'Replied':'Pending','Ola');
link(id,`${id}-person`,'has contact');link(id,`${id}-obs`,'observed in');link(`${id}-obs`,`${id}-behaviour`,'exhibits');link(`${id}-evidence`,`${id}-obs`,'supports');link(`${id}-obs`,`${id}-research`,'prompted');link(`${id}-evidence`,`${id}-research`,'informs');link(`${id}-research`,`${id}-insight`,'produced');link(`${id}-insight`,`${id}-strategy`,'motivates');link(`${id}-strategy`,id,'applied to');link(`${id}-strategy`,`${id}-action`,'executed through');link(`${id}-action`,`${id}-person`,'contacted');link(`${id}-action`,`${id}-outcome`,'resulted in');link('ada',`${id}-obs`,'contributed');link('sam',`${id}-research`,'contributed');link('ola',`${id}-action`,'performed');
}
add('learning','Learning','An announcement is a starting point, not qualification','Separate observed activity from inferred intent. Ask which decision needs evidence.','Draft','Sam');link('nova-outcome','learning','informs');
add('playbook','Playbook','Evidence-led discovery • draft','1. Capture source. 2. State hypothesis and uncertainty. 3. Investigate need. 4. Record action and outcome. This sample playbook is not validated.','Draft','Ola');link('learning','playbook','candidate for');
add('task','Task','Validate NovaX acquisition hypothesis','Identify what would confirm or contradict the hypothesis before preparing a proposal.','Open','Sam');link('nova-research','task','requires');
export const seed:Memory={version:1,records,relations,activity:records.filter(r=>!['Behaviour','Person'].includes(r.kind)).map(r=>({id:`activity-${r.id}`,recordId:r.id,actor:r.owner,date:r.createdAt,description:`${r.kind} recorded: ${r.title}`})).reverse()};
