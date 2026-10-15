import logo from "@/images/logo.png";

export const metadata = {
  title: "Thank You | Oswell Technologies",
  description: "Your enquiry has been received by Oswell Technologies.",
  robots: { index: false, follow: false },
};

export default function ThankYouPage() {
  return (
    <main className="thank-page">
      <a href="https://oswelltechnologies.com" className="thank-brand"><img src={logo.src} alt="Oswell Technologies" /></a>
      <section>
        <span className="thank-mark" aria-hidden="true">✓</span>
        <p className="thank-kicker">Enquiry received</p>
        <h1>Thank You! Your Enquiry Has Been Received.</h1>
        <p>Our team will review your requirements and contact you using the details provided.</p>
        <div className="thank-next"><strong>What happens next</strong><ol><li>We review the business challenge and your requested outcome.</li><li>We identify a practical next step for the first conversation.</li><li>A member of our team contacts you using the details you provided.</li></ol></div>
        <div className="thank-actions"><a href="https://cal.com/fareez-khan/discovery-call" target="_blank" rel="noopener noreferrer">Book a Discovery Call ↗</a><a href="https://oswelltechnologies.com">Return to Oswell Technologies</a></div>
      </section>
    </main>
  );
}
