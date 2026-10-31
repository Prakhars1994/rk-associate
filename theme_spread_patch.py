from pathlib import Path
b=Path(r"C:\Users\prana\CurrentPulse-Original-Multi\rk-associate-website")
cfg={
"app/page.tsx":("themeHome",[
('<section className="section"><div className="sectionHead"><span className="eyebrow">OUR SERVICES','<section className="section"><div className="inlineVisual right"><img src="/images/consulting-2.jpg" alt="HR consulting discussion"/><span>Business-ready HR support</span></div><div className="sectionHead"><span className="eyebrow">OUR SERVICES'),
('<section className="section soft"><div className="split">','<section className="section soft"><div className="inlineVisual left portrait"><img src="/images/training-2.jpg" alt="Practical HR training"/><span>Practical learning</span></div><div className="split">')]),
"app/about/page.tsx":("themeAbout",[
('<section className="section editorial"><div className="split">','<section className="section editorial"><div className="inlineVisual right portrait"><img src="/images/about-team.jpg" alt="RK Associate team approach"/><span>People-first execution</span></div><div className="split">'),
('<section className="section"><div className="sectionHead"><span className="eyebrow">OUR TEAM','<section className="section"><div className="inlineVisual left"><img src="/images/team-2.jpg" alt="Professional team collaboration"/><span>One team, multiple capabilities</span></div><div className="sectionHead"><span className="eyebrow">OUR TEAM')]),
"app/services/page.tsx":("themeServices",[
('<section className="section luxuryDark"><div className="sectionHead">','<section className="section luxuryDark"><div className="inlineVisual right"><img src="/images/documents-2.jpg" alt="Compliance documentation"/><span>Compliance with clarity</span></div><div className="sectionHead">'),
('<section className="section editorial"><div className="split">','<section className="section editorial"><div className="inlineVisual left portrait"><img src="/images/recruitment-2.jpg" alt="Recruitment consultation"/><span>From requirement to joining</span></div><div className="split">')]),
"app/courses/page.tsx":("themeCourses",[
('<section className="section wineSoft courseShowcase"><div className="sectionHead">','<section className="section wineSoft courseShowcase"><div className="inlineVisual right portrait"><img src="/images/training-2.jpg" alt="Professional HR classroom"/><span>Learn through practice</span></div><div className="sectionHead">'),
('<section className="section editorial timelineSection"><div className="sectionHead">','<section className="section editorial timelineSection"><div className="inlineVisual left"><img src="/images/documents-2.jpg" alt="HR practical assignments"/><span>Assignments that build confidence</span></div><div className="sectionHead">')]),
"app/resources/page.tsx":("themeResources",[
('<section className="section editorial"><div className="sectionHead">','<section className="section editorial"><div className="inlineVisual right"><img src="/images/resources-office.jpg" alt="HR knowledge resources"/><span>Knowledge for daily HR work</span></div><div className="sectionHead">'),
('<section className="section soft"><div className="split">','<section className="section soft"><div className="inlineVisual left portrait"><img src="/images/documents-2.jpg" alt="HR documentation resources"/><span>Useful formats & guidance</span></div><div className="split">')]),
"app/clients/page.tsx":("themeClients",[
('<section className="section editorial"><div className="sectionHead">','<section className="section editorial"><div className="inlineVisual right portrait"><img src="/images/clients-meeting.jpg" alt="Client partnership meeting"/><span>Partnership over transactions</span></div><div className="sectionHead">'),
('<section className="section"><div className="sectionHead">','<section className="section"><div className="inlineVisual left"><img src="/images/office-2.jpg" alt="Cross-sector business support"/><span>Support across industries</span></div><div className="sectionHead">')]),
"app/contact/page.tsx":("themeContact",[
('<section className="section contactConcierge">','<section className="section contactConcierge"><div className="inlineVisual right portrait"><img src="/images/contact-consult.jpg" alt="Business consultation"/><span>A focused conversation starts here</span></div>'),
('<section className="section soft"><div className="split">','<section className="section soft"><div className="inlineVisual left"><img src="/images/consulting-2.jpg" alt="HR advisory consultation"/><span>Talk directly to the team</span></div><div className="split">')])
}
for f,(theme,repls) in cfg.items():
 p=b/f;s=p.read_text(encoding="utf-8")
 # theme wrapper via first fragment root
 marker='return <>'
 if marker in s and ('<div className="'+theme+'">') not in s:
  s=s.replace(marker,'return <><div className="'+theme+'">',1)
  # close before final fragment
  idx=s.rfind('</>}')
  if idx>=0:s=s[:idx]+'</div>'+s[idx:]
 for a,z in repls:
  if a in s and 'inlineVisual' not in s[s.find(a):s.find(a)+120]:s=s.replace(a,z,1)
 p.write_text(s,encoding="utf-8")
print("THEMES AND DISTRIBUTED VISUALS APPLIED")
