// Direction A — Home (Mithai Editorial)
// Modern premium cream/ivory with oxblood + gold

const { Icon: IconA, Rupee: RupeeA, ShopHeader: ShopHeaderA } = window.BBShared;
const DATA_A = window.BB_DATA;

function HomeA() {
  return (
    <div className="artboard dir-a" data-screen-label="A · Home">
      <ShopHeaderA dir="a"/>

      {/* HERO — Gift hampers led */}
      <section className="warm-grad-a" style={{padding:"56px 48px 64px", position:"relative"}}>
        <div style={{display:"grid", gridTemplateColumns:"1.05fr 0.95fr", gap:48, alignItems:"center"}}>
          <div>
            {/*<div className="eyebrow" style={{color:"var(--gold)"}}>Festive Edit · Diwali 2026</div>*/}
            <h1 className="disp" style={{fontSize:84, lineHeight:0.95, margin:"18px 0 14px", fontWeight:500}}>
              Gifts that<br/>
              <span style={{fontStyle:"italic", color:"var(--accent)"}}>arrive with</span><br/>
              <span style={{position:"relative"}}>blessings.<span style={{position:"absolute", right:-8, top:-6, color:"var(--gold)", fontSize:24}}>✦</span></span>
            </h1>
            <p className="hindi" style={{fontSize:20, color:"var(--ink-2)", marginBottom:24}}>
              मिठास और स्नेह से भरे, बंगाली स्वीट्स के पारंपरिक उपहार।
            </p>
            <p style={{fontSize:15, color:"var(--ink-2)", maxWidth:480, lineHeight:1.6, marginBottom:28}}>
              Hand-curated mithai &amp; dry-fruit hampers from our Bhind kitchen — built fresh, packed in keepsake brass-trim boxes, delivered same-day across India.
            </p>
            <div style={{display:"flex", gap:14, alignItems:"center"}}>
              <button className="btn btn-lg">Shop Hampers <IconA.arrow/></button>
              <button className="btn btn-ghost btn-lg">Build your own box</button>
            </div>

            <div style={{display:"flex", gap:36, marginTop:40, paddingTop:24, borderTop:"1px solid var(--rule-strong)"}}>
              <div><div className="eyebrow">Est.</div><div className="disp" style={{fontSize:24, color:"var(--accent)"}}>1987</div></div>
              <div><div className="eyebrow">Pure-veg</div><div className="disp" style={{fontSize:24}}>100%</div></div>
              <div><div className="eyebrow">Delivered to</div><div className="disp" style={{fontSize:24}}>410+ pin codes</div></div>
              <div><div className="eyebrow">Repeat buyers</div><div className="disp" style={{fontSize:24, color:"var(--gold)"}}>72%</div></div>
            </div>
          </div>

          {/* Hero collage */}
          <div style={{position:"relative", height:560}}>
            <div className="tile" style={{position:"absolute", left:40, top:0, width:280, height:360, transform:"rotate(-3deg)", boxShadow:"var(--shadow-md)"}}>
              <img src={DATA_A.hampers[0].img} alt=""/>
              <div style={{position:"absolute", left:14, bottom:14, color:"#fff", textShadow:"0 1px 2px rgba(0,0,0,.5)"}}>
                <div className="disp" style={{fontSize:22, fontStyle:"italic"}}>{DATA_A.hampers[0].en}</div>
                <div style={{fontSize:12, opacity:.9}}>{DATA_A.hampers[0].pieces}</div>
              </div>
              <span className="chip chip-gold" style={{position:"absolute", top:14, left:14}}>★ Bestseller</span>
            </div>
            <div className="tile" style={{position:"absolute", right:0, top:60, width:240, height:300, transform:"rotate(4deg)", boxShadow:"var(--shadow-md)"}}>
              <img src={DATA_A.hampers[1].img} alt=""/>
            </div>
            <div className="tile" style={{position:"absolute", right:30, bottom:0, width:220, height:220, transform:"rotate(-2deg)", boxShadow:"var(--shadow-md)"}}>
              <img src={DATA_A.hampers[2].img} alt=""/>
            </div>
            {/* Wax seal */}
            <div style={{position:"absolute", left:0, bottom:30, width:96, height:96, borderRadius:"50%", background:"var(--accent)", color:"var(--gold)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", boxShadow:"var(--shadow-md)", border:"2px solid var(--gold)"}}>
              <div className="hindi" style={{fontSize:13}}>शुद्ध</div>
              <div className="disp" style={{fontStyle:"italic", fontSize:13, marginTop:2}}>desi ghee</div>
              <div style={{width:30, height:1, background:"var(--gold)", margin:"4px 0"}}/>
              <div style={{fontSize:9, letterSpacing:".15em"}}>EST 1987</div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORY STRIP */}
      <section style={{padding:"56px 48px", background:"var(--paper)", borderTop:"1px solid var(--rule)", borderBottom:"1px solid var(--rule)"}}>
        <div style={{display:"flex", alignItems:"end", justifyContent:"space-between", marginBottom:28}}>
          <div>
            <div className="eyebrow">Categories</div>
            <h2 className="disp" style={{fontSize:42, margin:"6px 0 0"}}>Browse the kitchen</h2>
          </div>
          <span style={{fontSize:13, color:"var(--accent)", fontWeight:600}}>View all 257 items →</span>
        </div>
        <div style={{display:"grid", gridTemplateColumns:"repeat(7, 1fr)", gap:18}}>
          {DATA_A.categories.map(c => (
            <div key={c.slug} style={{cursor:"pointer"}}>
              <div className="tile" style={{aspectRatio:"1/1.1", marginBottom:12}}>
                <img src={c.hero} alt=""/>
                <div style={{position:"absolute", inset:0, background:"linear-gradient(180deg, transparent 50%, rgba(20,10,5,.6))"}}/>
                <div style={{position:"absolute", left:12, bottom:10, color:"#fff"}}>
                  <div className="hindi" style={{fontSize:13, opacity:.85}}>{c.hi}</div>
                  <div className="disp" style={{fontStyle:"italic", fontSize:18}}>{c.en}</div>
                </div>
              </div>
              <div style={{fontSize:11, color:"var(--ink-3)", textTransform:"uppercase", letterSpacing:".12em"}}>{c.items} items</div>
            </div>
          ))}
        </div>
      </section>

      {/* HAMPERS DEEP-DIVE */}
      <section style={{padding:"56px 48px"}}>
        <div style={{display:"flex", alignItems:"end", justifyContent:"space-between", marginBottom:28}}>
          <div>
            <div className="eyebrow" style={{color:"var(--gold)"}}>The Hamper Edit</div>
            <h2 className="disp" style={{fontSize:42, margin:"6px 0 0"}}>Gift like family</h2>
            <p className="hindi" style={{color:"var(--ink-3)", marginTop:6}}>परिवार जैसा प्यार, हर बक्से में</p>
          </div>
          <div style={{display:"flex", gap:10}}>
            <button className="btn-ghost btn btn-sm">All Hampers</button>
            <button className="btn-ghost btn btn-sm">Diwali</button>
            <button className="btn-ghost btn btn-sm">Corporate</button>
          </div>
        </div>
        <div style={{display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:24}}>
          {DATA_A.hampers.map(h => (
            <article key={h.id} style={{background:"var(--paper)", border:"1px solid var(--rule)", borderRadius:"var(--radius-lg)", overflow:"hidden"}}>
              <div className="tile" style={{aspectRatio:"1/1", borderRadius:0}}>
                <img src={h.img} alt=""/>
                <span className="chip chip-gold" style={{position:"absolute", top:12, left:12}}>{h.tag}</span>
                <button style={{position:"absolute", top:10, right:10, width:34, height:34, borderRadius:"50%", background:"var(--paper)", border:"none", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"var(--ink-2)"}}>
                  <IconA.heart/>
                </button>
              </div>
              <div style={{padding:18}}>
                <div className="hindi" style={{fontSize:13, color:"var(--accent)"}}>{h.hi}</div>
                <div className="disp" style={{fontSize:22, fontStyle:"italic", margin:"3px 0 4px"}}>{h.en}</div>
                <div style={{fontSize:12, color:"var(--ink-3)", marginBottom:14}}>{h.pieces}</div>
                <div style={{display:"flex", alignItems:"center", justifyContent:"space-between"}}>
                  <div>
                    <span className="disp" style={{fontSize:22}}><RupeeA v={h.price}/></span>
                    <span style={{fontSize:13, color:"var(--ink-3)", textDecoration:"line-through", marginLeft:8}}>₹{h.mrp}</span>
                  </div>
                  <button className="btn btn-sm">Add</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* BESTSELLER MITHAI */}
      <section style={{padding:"56px 48px", background:"var(--bg-sub)"}}>
        <div style={{display:"flex", alignItems:"end", justifyContent:"space-between", marginBottom:28}}>
          <div>
            <div className="eyebrow">Best selling mithai</div>
            <h2 className="disp" style={{fontSize:42, margin:"6px 0 0"}}>Kiratpura&apos;s favourites</h2>
          </div>
          <span style={{fontSize:13, color:"var(--accent)", fontWeight:600}}>Shop all sweets →</span>
        </div>
        <div style={{display:"grid", gridTemplateColumns:"repeat(6, 1fr)", gap:18}}>
          {DATA_A.sweets.map(s => (
            <article key={s.id} style={{background:"var(--paper)", borderRadius:"var(--radius-lg)", border:"1px solid var(--rule)", overflow:"hidden"}}>
              <div className="tile" style={{aspectRatio:"1/1", borderRadius:0}}>
                <img src={s.img} alt=""/>
              </div>
              <div style={{padding:14}}>
                <div className="hindi" style={{fontSize:12, color:"var(--accent)"}}>{s.hi}</div>
                <div className="disp" style={{fontSize:17, fontStyle:"italic", margin:"2px 0 3px"}}>{s.en}</div>
                <div style={{display:"flex", alignItems:"center", justifyContent:"space-between"}}>
                  <span style={{fontSize:13}}><strong><RupeeA v={s.price}/></strong> <span style={{color:"var(--ink-3)"}}>/ {s.unit}</span></span>
                  <button style={{width:30, height:30, borderRadius:"50%", border:"1px solid var(--rule-strong)", background:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--accent)"}}>
                    <IconA.plus/>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* OUR STORY + OUTLET */}
      <section style={{padding:"72px 48px", background:"var(--paper)"}}>
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:64, alignItems:"center"}}>
          <div className="tile" style={{aspectRatio:"4/3"}}>
            <img src="https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=900&q=80&auto=format" alt=""/>
          </div>
          <div>
            <div className="eyebrow" style={{color:"var(--gold)"}}>Our Outlet</div>
            <h2 className="disp" style={{fontSize:54, lineHeight:1.05, margin:"10px 0 14px"}}>
              Three generations in Pustak Bazaar, <span style={{fontStyle:"italic", color:"var(--accent)"}}>Bhind</span>.
            </h2>
            <p style={{fontSize:15, color:"var(--ink-2)", lineHeight:1.7, maxWidth:520}}>
              From a small wood-fired tava behind the Mahveer Ganj market in 1987, to a heritage kitchen serving 410+ pin codes — every kaju katli is still cut by hand by Bhaiya Ram&apos;s family.
            </p>
            <div style={{display:"flex", alignItems:"center", gap:24, marginTop:24, padding:"20px 22px", border:"1px solid var(--rule-strong)", borderRadius:"var(--radius-lg)", background:"var(--bg-sub)"}}>
              <IconA.pin/>
              <div>
                <div style={{fontWeight:600}}>Pustak Bazar, Mahveer Ganj</div>
                <div style={{fontSize:13, color:"var(--ink-2)"}}>Kiratpura, Bhind, MP 477001 · Open 9 AM – 10 PM</div>
              </div>
              <button className="btn btn-ghost btn-sm" style={{marginLeft:"auto"}}>Get directions →</button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{padding:"40px 48px 28px", background:"var(--ink)", color:"#dac6a8"}}>
        <div style={{display:"grid", gridTemplateColumns:"1.4fr 1fr 1fr 1fr 1fr", gap:32, marginBottom:32}}>
          <div>
            <div className="disp" style={{fontSize:24, color:"var(--gold)"}}>Bangali Sweets</div>
            <div className="hindi" style={{fontSize:13, marginTop:4, color:"#dac6a8"}}>बंगाली स्वीट्स · since 1987</div>
            <p style={{fontSize:12, lineHeight:1.6, marginTop:14, opacity:.7}}>Pure-veg mithai, namkeen and dry fruits — hand-made in Bhind, delivered fresh across India.</p>
            <div style={{display:"flex", gap:10, marginTop:18}}>
              {["IG","FB","YT","WA"].map(s=> <div key={s} style={{width:32, height:32, border:"1px solid #5a4a3a", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11}}>{s}</div>)}
            </div>
          </div>
          {[
            ["Shop", ["Sweets","Namkeen","Dry Fruits","Dairy","Bakery","Hampers","Birthday"]],
            ["Company", ["About Us","Our Outlet","Press","Careers","Sustainability"]],
            ["Help", ["Track Order","Shipping","Returns","FAQs","Contact"]],
            ["B2B", ["Corporate Gifting","Wedding Orders","Bulk Pricing","Partner Outlets"]],
          ].map(([h, items])=>(
            <div key={h}>
              <div style={{fontSize:11, letterSpacing:".18em", textTransform:"uppercase", color:"var(--gold)", marginBottom:14}}>{h}</div>
              {items.map(i=> <div key={i} style={{fontSize:13, marginBottom:8, opacity:.85}}>{i}</div>)}
            </div>
          ))}
        </div>
        <div style={{borderTop:"1px solid #3a2a1a", paddingTop:18, display:"flex", justifyContent:"space-between", fontSize:11, opacity:.6}}>
          <span>© 2026 Bangali Sweets &amp; Dryfruits, Bhind · GSTIN 23ABCDE1234F1Z5 · FSSAI 12345678901234</span>
          <span>Privacy · Terms · Refunds</span>
        </div>
      </footer>
    </div>
  );
}

window.HomeA = HomeA;
