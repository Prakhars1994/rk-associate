import Link from "next/link";
import {business,type Policy} from "@/lib/policies";

export function PolicyPage({p}:{p:Policy}){
  return <section className="section policyPage">
    <div className="sectionHead"><span className="eyebrow">RK ASSOCIATE · POLICIES</span><h1>{p.title}</h1><p>Last updated: {business.updated}</p></div>
    <p className="lead">{p.intro}</p>
    {p.sections.map(([h,items])=><div key={h} className="policySection"><h2>{h}</h2><ul>{items.map(x=><li key={x}>{x}</li>)}</ul></div>)}
    <p className="policyNav"><Link href="/privacy">Privacy Policy</Link> · <Link href="/terms">Terms &amp; Conditions</Link> · <Link href="/refund-policy">Cancellation &amp; Refund Policy</Link> · <Link href="/contact">Contact</Link></p>
  </section>;
}
