"use client";

import { useState } from "react";
import logo from "@/images/logo.png";
import { DEFAULT_AI_CAMPAIGN } from "@/lib/ai-campaigns";
import { AnalyticsConsent, trackMarketingEvent } from "./AnalyticsConsent";
import { LeadForm } from "./LeadForm";
import "@/app/ai-solutions/ai-solutions.css";

const pains = [
  ["01", "Repetitive Manual Work", "Employees spend valuable time on repetitive administrative tasks."],
  ["02", "High Operational Costs", "Manual workflows increase costs and limit scalability."],
  ["03", "Missed Customer Enquiries", "Slow responses can lead to missed opportunities and dissatisfied customers."],
  ["04", "Disconnected Systems", "Business information is scattered across multiple applications."],
  ["05", "Slow Decision-Making", "Teams struggle to turn operational data into actionable insights."],
  ["06", "Difficulty Scaling", "Growth often adds more people, processes, and management effort."],
];

const solutions = [
  ["AI", "AI Agents & Agentic Automation", "Give teams an intelligent operations layer that understands requests, works within defined permissions, and completes approved workflows.", ["Customer service", "CRM automation", "Document processing"]],
  ["VO", "AI Voice Agents", "Use natural, agentic conversations to qualify leads, coordinate appointments, handle support, and take approved actions—not scripted voice menus.", ["Inbound support", "Lead qualification", "Follow-ups & updates"]],
  ["WF", "Business Process Automation", "Connect repetitive work across departments and the software you already use, with clear oversight at every step.", ["Workflow orchestration", "System integration", "Approvals"]],
  ["ML", "Custom AI Development", "Build focused AI applications for your exact operating challenge, from intelligent analytics to knowledge and document workflows.", ["Intelligent analytics", "Knowledge assistants", "Document intelligence"]],
  ["SW", "Custom Software Development", "Create scalable web applications, mobile products, dashboards, APIs, and enterprise software around your business model.", ["Web & mobile apps", "Dashboards", "Secure APIs"]],
];

const industries = {
  Healthcare: { items: ["Patient enquiry handling", "Appointment coordination", "Medical documentation support", "Administrative automation", "Internal workflow integration"], example: "A coordinated intake layer can answer routine questions, collect the right details, route exceptions to staff, and update scheduling workflows." },
  Manufacturing: { items: ["Production reporting automation", "Quality documentation", "Inventory visibility", "Maintenance workflow support", "Operational analytics"], example: "An operations assistant can consolidate shift reports, surface exceptions, and prepare the next action for production teams." },
  Logistics: { items: ["Shipment enquiry automation", "Delivery status communication", "Document processing", "Dispatch coordination", "Exception management"], example: "A service agent can check shipment context, communicate status, create an exception task, and keep operational records aligned." },
  "Professional Services": { items: ["Client onboarding", "Document automation", "AI knowledge assistants", "Workflow management", "Customer communication"], example: "An internal assistant can prepare onboarding packs, retrieve approved knowledge, and move work through review and sign-off." },
  Retail: { items: ["Customer enquiry handling", "Inventory reporting", "Order support", "Sales workflow automation"], example: "A customer agent can understand order questions, check approved systems, resolve routine cases, and escalate only when needed." },
  Education: { items: ["Admission enquiries", "Student follow-ups", "Course information agents", "Lead qualification", "Administrative automation"], example: "An admissions assistant can answer course questions, qualify interest, coordinate follow-ups, and keep enquiry records current." },
};

const faqs = [
  ["What types of AI solutions does Oswell Technologies develop?", "We build custom AI agents, voice agents, workflow automation, document intelligence, analytics applications, and the software needed to run them in real business operations."],
  ["Can AI integrate with our existing software?", "Yes. We typically design around your current CRM, ERP, support, data, and communication tools, subject to their available APIs and security controls."],
  ["How long does an AI project take?", "Timing depends on scope, integrations, data readiness, and governance. Discovery establishes a practical first release and a realistic delivery plan before development begins."],
  ["Can you automate workflows without replacing our existing systems?", "Often, yes. An automation layer can connect existing systems and coordinate tasks while keeping core platforms in place."],
  ["Do you develop custom AI agents?", "Yes. We build agents around defined business tasks, permissions, decision rules, integrations, and human review points."],
  ["Can your AI voice agents take actions during conversations?", "Yes, when configured and authorized. They can perform actions such as checking information, creating records, scheduling, or triggering follow-ups through approved integrations."],
  ["How much does a custom AI solution cost?", "Cost depends on the workflow, integrations, compliance needs, and level of autonomy. The consultation helps define a useful scope before any proposal is prepared."],
  ["Do you provide ongoing support?", "Yes. Support can cover monitoring, maintenance, model or workflow improvements, integrations, and new capabilities after launch."],
  ["How do you approach data security?", "We design for least-privilege access, controlled integrations, secure secret handling, auditability, and appropriate human oversight. Specific controls are agreed for each environment."],
  ["What happens during the free consultation?", "We discuss the operational challenge, current systems, desired outcome, constraints, and the most practical next step. There is no obligation to proceed."],
];

export function AiSolutionsLanding({ campaign = DEFAULT_AI_CAMPAIGN }) {
  const [activeIndustry, setActiveIndustry] = useState("Healthcare");
  const selectedIndustry = industries[activeIndustry];

  function trackedCta(position, destination = "booking") {
    trackMarketingEvent("cta_click", { campaign_variant: campaign.slug, cta_position: position, destination });
  }

  return (
    <div className="ai-page">
      <header className="ai-header">
        <a href="https://oswelltechnologies.com" className="ai-brand" aria-label="Oswell Technologies home">
          <img src={logo.src} alt="Oswell Technologies" />
        </a>
        <a className="ai-header-cta" href="#booking" onClick={() => trackedCta("header")}>
          Book a free consultation
        </a>
      </header>

      <main>
        <section className="ai-hero" aria-labelledby="ai-hero-title">
          <div className="ai-hero-copy">
            <span className="ai-eyebrow">{campaign.label}</span>
            <h1 id="ai-hero-title">{campaign.headline}</h1>
            <p>{campaign.emphasis}</p>
            <div className="ai-hero-actions">
              <a className="ai-button ai-button-primary" href="#booking" onClick={() => trackedCta("hero-primary")}>
                Book a Free AI Consultation <span aria-hidden="true">↗</span>
              </a>
              <a className="ai-button ai-button-secondary" href="#assessment" onClick={() => trackedCta("hero-secondary", "assessment")}>
                Get Your Free AI Assessment
              </a>
            </div>
            <div className="ai-hero-proof" aria-label="Service highlights">
              <span>Built around your workflow</span>
              <span>Integrates with your systems</span>
              <span>Security-conscious delivery</span>
            </div>
          </div>

          <div className="ai-system" aria-label="Business operations flow through AI intelligence and automation to create useful business outcomes">
            <div className="ai-system-topline">
              <span className="ai-status-dot" />
              <span>Intelligent operations layer</span>
              <span className="ai-live">LIVE</span>
            </div>
            <div className="ai-system-flow">
              <article className="ai-flow-card ai-flow-input">
                <small>01 · INPUT</small>
                <strong>Business Operations</strong>
                <span>Enquiries · Documents · CRM</span>
              </article>
              <div className="ai-flow-link" aria-hidden="true"><i /><i /><i /></div>
              <article className="ai-flow-card ai-flow-core">
                <small>02 · INTELLIGENCE</small>
                <div className="ai-core-orbit"><span>AI</span></div>
                <strong>Understand &amp; decide</strong>
              </article>
              <div className="ai-flow-link" aria-hidden="true"><i /><i /><i /></div>
              <article className="ai-flow-card ai-flow-output">
                <small>03 · OUTCOME</small>
                <strong>Work gets done</strong>
                <ul>
                  <li><span>✓</span> Customer response sent</li>
                  <li><span>✓</span> CRM record updated</li>
                  <li><span>✓</span> Team action created</li>
                </ul>
              </article>
            </div>
            <div className="ai-system-footer">
              <span>Human oversight</span>
              <span>Permission controls</span>
              <span>Action logs</span>
            </div>
          </div>
        </section>

        <section className="ai-trust" aria-label="Oswell engineering approach">
          <div className="ai-trust-intro">
            <span className="ai-section-kicker">Practical by design</span>
            <h2>AI Solutions Engineered for Real Business Challenges</h2>
          </div>
          <div className="ai-trust-grid">
            <div><strong>AI &amp; agentic systems</strong><span>Purpose-built around approved tasks and outcomes</span></div>
            <div><strong>Business integrations</strong><span>CRM, APIs, data, communications, and workflows</span></div>
            <div><strong>Full-stack engineering</strong><span>AI, web, mobile, dashboards, and enterprise software</span></div>
            <div><strong>Security-conscious delivery</strong><span>Controlled permissions, oversight, and safe deployment</span></div>
          </div>
        </section>

        <section className="ai-section ai-pains" id="challenges">
          <div className="ai-section-heading ai-heading-split">
            <div><span className="ai-section-kicker">The operational gap</span><h2>Is Your Business Losing Time and Money to Manual Processes?</h2></div>
            <p>When routine work depends on fragmented tools and manual handoffs, growth adds complexity instead of capacity.</p>
          </div>
          <div className="ai-card-grid ai-pain-grid">
            {pains.map(([number, title, body]) => <article className="ai-card ai-pain-card" key={title}><span>{number}</span><h3>{title}</h3><p>{body}</p></article>)}
          </div>
          <div className="ai-section-action"><a className="ai-text-link" href="#assessment" onClick={() => trackedCta("pain-points", "assessment")}>Let&apos;s Identify What You Can Automate <span>→</span></a></div>
        </section>

        <section className="ai-section ai-solutions" id="solutions">
          <div className="ai-section-heading"><span className="ai-section-kicker">What we build</span><h2>AI &amp; Software Solutions Built Around Your Business</h2><p>Focused systems that improve how work moves—without forcing your business into a generic product.</p></div>
          <div className="ai-solutions-grid">
            {solutions.map(([icon, title, body, tags], index) => (
              <article className={`ai-solution-card ${index < 2 ? "is-featured" : ""}`} key={title}>
                <span className="ai-icon">{icon}</span><span className="ai-card-index">0{index + 1}</span><h3>{title}</h3><p>{body}</p>
                <ul>{tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>
                <a href="#assessment" onClick={() => trackedCta(`solution-${index + 1}`, "assessment")}>Discuss Your Requirement <span>↗</span></a>
              </article>
            ))}
          </div>
        </section>

        <section className="ai-section ai-industries" id="industries">
          <div className="ai-section-heading"><span className="ai-section-kicker">Industry workflows</span><h2>AI Solutions for Your Industry</h2><p>Start with a real operational bottleneck, then shape the technology around the people and systems involved.</p></div>
          <div className="ai-industry-tabs" role="tablist" aria-label="Industries">
            {Object.keys(industries).map((industry) => <button type="button" role="tab" aria-selected={activeIndustry === industry} className={activeIndustry === industry ? "is-active" : ""} onClick={() => setActiveIndustry(industry)} key={industry}>{industry}</button>)}
          </div>
          <div className="ai-industry-panel" role="tabpanel">
            <div><span className="ai-panel-label">Use cases</span><h3>{activeIndustry}</h3><ul>{selectedIndustry.items.map((item) => <li key={item}><span>✓</span>{item}</li>)}</ul></div>
            <div className="ai-example"><span className="ai-panel-label">Practical example</span><p>{selectedIndustry.example}</p><a className="ai-button ai-button-dark" href="#assessment" onClick={() => trackedCta(`industry-${activeIndustry}`, "assessment")}>Explore This Use Case <span>↗</span></a></div>
          </div>
        </section>

        <section className="ai-section ai-process">
          <div className="ai-section-heading ai-heading-split"><div><span className="ai-section-kicker">A clear route forward</span><h2>From Business Challenge to Working AI Solution</h2></div><p>Every engagement starts with the operation—not a predetermined technology.</p></div>
          <ol className="ai-process-grid">
            <li><span>01</span><h3>Discovery</h3><p>We understand your operations, challenges, and business objectives.</p></li>
            <li><span>02</span><h3>Solution Design</h3><p>We identify suitable AI and automation opportunities and propose a practical solution.</p></li>
            <li><span>03</span><h3>Development &amp; Integration</h3><p>We build, test, and integrate the solution with your existing systems.</p></li>
            <li><span>04</span><h3>Deployment &amp; Optimization</h3><p>We deploy the solution and help improve its performance over time.</p></li>
          </ol>
        </section>

        <section className="ai-section ai-products">
          <div className="ai-section-heading"><span className="ai-section-kicker">Applied product experience</span><h2>We Build AI Products, Not Just Presentations</h2><p>Selected solution categories already represented in Oswell&apos;s product portfolio.</p></div>
          <div className="ai-product-grid">
            <article className="ai-product-card"><div className="ai-product-visual"><span className="ai-voice-wave">||||||||||||</span><small>VOICE · INTENT · ACTION</small></div><span className="ai-panel-label">Agentic conversations</span><h3>Voice Agent Suite</h3><p><strong>Problem:</strong> Routine calls depend on overloaded teams and inconsistent handling.</p><p><strong>Solution:</strong> Voice agents for support, qualification, scheduling, collections, and approved workflow actions.</p></article>
            <article className="ai-product-card"><div className="ai-product-visual ai-product-network"><i/><i/><i/><i/><strong>OPS</strong></div><span className="ai-panel-label">Workflow execution</span><h3>Agentic AI Platform</h3><p><strong>Problem:</strong> Critical workflows stall across handoffs, follow-ups, and disconnected systems.</p><p><strong>Solution:</strong> Agentic systems with logic, memory, tool access, permissions, and controlled human oversight.</p></article>
            <article className="ai-product-card"><div className="ai-product-visual ai-product-health"><span>INTAKE</span><span>COORDINATE</span><span>FOLLOW UP</span></div><span className="ai-panel-label">Administrative automation</span><h3>AI Healthcare Operations Platform</h3><p><strong>Problem:</strong> Repetitive administrative work slows patient coordination and front-desk performance.</p><p><strong>Solution:</strong> Connected voice, document, and workflow automation for healthcare operations.</p></article>
          </div>
        </section>

        <section className="ai-section ai-why">
          <div className="ai-section-heading"><span className="ai-section-kicker">Why Oswell</span><h2>Built for the Reality of Business Operations</h2></div>
          <div className="ai-why-grid">
            {["Custom-built solutions", "Business-outcome focus", "AI & software engineering", "Existing-system integration", "Security-conscious architecture", "Deployment & ongoing support"].map((item, index) => <div key={item}><span>0{index + 1}</span><strong>{item}</strong></div>)}
          </div>
        </section>

        <section className="ai-section ai-assessment" id="assessment">
          <div className="ai-assessment-copy"><span className="ai-section-kicker">Free AI assessment</span><h2>Discover What AI Can Do for Your Business</h2><p>Tell us about your business challenge. Our team will review your requirements and help identify practical AI or automation opportunities.</p><div className="ai-next"><strong>What happens next</strong><ol><li>We review your operation and objectives</li><li>We identify the most practical opportunity</li><li>We contact you with a recommended next step</li></ol></div></div>
          <LeadForm campaignVariant={campaign.slug} />
        </section>

        <section className="ai-booking" id="booking">
          <div><span className="ai-section-kicker">Prefer a conversation?</span><h2>Speak Directly With Our Team</h2><p>Book a 20–30-minute discovery call to discuss your business challenges and explore suitable AI solutions.</p></div>
          <a className="ai-button ai-button-primary" href="https://cal.com/fareez-khan/discovery-call" target="_blank" rel="noopener noreferrer" onClick={() => trackedCta("booking", "calendar")}>Schedule Your Free Discovery Call <span>↗</span></a>
        </section>

        <section className="ai-section ai-faq">
          <div className="ai-section-heading"><span className="ai-section-kicker">Questions, answered</span><h2>What to Know Before We Talk</h2></div>
          <div className="ai-faq-list">{faqs.map(([question, answer], index) => <details key={question}><summary><span>{String(index + 1).padStart(2, "0")}</span>{question}<i aria-hidden="true">+</i></summary><p>{answer}</p></details>)}</div>
        </section>

        <section className="ai-final-cta">
          <span className="ai-section-kicker">A practical first step</span><h2>Your Next Competitive Advantage Could Start With AI.</h2><p>Let&apos;s explore how intelligent automation and custom software can help your business operate more efficiently and scale with confidence.</p>
          <div className="ai-hero-actions"><a className="ai-button ai-button-primary" href="#booking" onClick={() => trackedCta("final-primary")}>Book Your Free AI Consultation</a><a className="ai-button ai-button-secondary" href="#assessment" onClick={() => trackedCta("final-secondary", "assessment")}>Tell Us About Your Project</a></div>
        </section>
      </main>
      <footer className="ai-footer"><a href="https://oswelltechnologies.com" className="ai-brand"><img src={logo.src} alt="Oswell Technologies" /></a><p>Custom AI systems, automation, and software for real business operations.</p><div><a href="tel:+447442256653" onClick={() => trackMarketingEvent("phone_click", { campaign_variant: campaign.slug })}>+44 7442 256653</a><a href="https://wa.me/447442256653" target="_blank" rel="noopener noreferrer" onClick={() => trackMarketingEvent("whatsapp_click", { campaign_variant: campaign.slug })}>WhatsApp</a><a href="/privacy/">Privacy</a></div></footer>
      <a className="ai-mobile-cta" href="#assessment" onClick={() => trackedCta("mobile-sticky", "assessment")}>Get a Free AI Assessment <span>→</span></a>
      <AnalyticsConsent campaignVariant={campaign.slug} />
    </div>
  );
}
