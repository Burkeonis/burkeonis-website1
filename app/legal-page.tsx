import Link from "next/link";

type LegalKind = "privacy" | "terms" | "refunds" | "disclaimer";

const legalContent: Record<LegalKind, { title: string; sections: Array<[string, string]> }> = {
  privacy: { title: "Privacy notice", sections: [
    ["What this notice covers", "This notice covers the Pattern Files digital-download checkout flow and the information used to process and deliver an order."],
    ["Information used for an order", "The payment provider may collect payment and contact information to process a purchase. Burkeonis receives and retains only the minimum order and entitlement information necessary to deliver the files, answer a support request, prevent fraud, and maintain required records."],
    ["Private writing", "The Pattern Files are designed for personal reflection. Burkeonis does not use a buyer’s personal writing, journal content, uploaded conversations, or private reflections for advertising or unrelated profiling."],
    ["Service providers", "Checkout is processed by Stripe. Product delivery uses protected Cloudflare storage and a server-side entitlement record. Each provider’s own privacy terms may apply to the information it processes."],
    ["Contact", "For privacy questions or requests, contact hello@burkeonis.com."],
  ] },
  terms: { title: "Terms of use", sections: [
    ["Product license", "The Pattern Files are licensed to the purchaser for personal use. Do not resell, redistribute, publish, share publicly, or claim ownership of the files or their contents without written permission from Burkeonis."],
    ["Product scope", "The files are educational self-reflection resources. They are not medical, mental-health, legal, financial, or crisis services, and they do not create a professional-client relationship."],
    ["Acceptable use", "Do not use the product to harm, threaten, harass, exploit, or make decisions about another person as though a workbook provides a diagnosis or verified account of their intent."],
    ["Access", "A download link is issued only after payment is confirmed and may expire. Keep a personal backup of the files after lawful delivery."],
    ["Contact", "Questions about these terms can be sent to hello@burkeonis.com."],
  ] },
  refunds: { title: "Refund terms", sections: [
    ["Digital delivery", "The Pattern Files are digital files delivered after payment confirmation. Before purchase, the product page explains what is included and how delivery works."],
    ["Requesting help or a refund", "If you were charged in error, received the wrong file, or could not access a paid download because of a technical problem, contact hello@burkeonis.com with the purchase email and receipt details."],
    ["Consumer rights", "Nothing in these terms removes consumer rights that cannot legally be waived where the purchaser lives."],
    ["No subscriptions in this offer", "The Pattern Files is a one-time purchase. This offer does not create a recurring subscription, membership, or automatic renewal."],
    ["Payment processing", "Payments are processed through Stripe. Any approved refund should be returned through the original payment method when possible."],
  ] },
  disclaimer: { title: "Product disclaimer", sections: [
    ["Self-reflection, not treatment", "The Pattern Files provide prompts and worksheets for private self-reflection. They are not a substitute for therapy, diagnosis, medical care, legal advice, financial advice, or crisis support."],
    ["No outcomes promised", "Burkeonis does not promise that use of these files will create a specific result, resolve a health condition, repair a relationship, prevent harm, or improve a personal or professional outcome."],
    ["Use your judgment", "Pause or stop if an exercise feels unsafe or overwhelming. If you are in immediate danger or need urgent support, contact local emergency services or an appropriate qualified professional rather than relying on this product."],
    ["About other people", "The worksheets are for examining your own perceptions, choices, and patterns. They do not establish facts about another person or justify acting on an assumption about their motives, condition, or behavior."],
  ] },
};

export default function LegalPage({ kind }: { kind: LegalKind }) {
  const content = legalContent[kind];
  return (
    <main className="commerce-page legal-page"><header className="commerce-header"><Link className="wordmark" href="/">BURKEONIS</Link><Link className="text-link" href="/pattern-files">Pattern Files</Link></header><article className="legal-shell"><h1>{content.title}</h1><p className="legal-effective">Effective for the Pattern Files digital-download offer. Last updated: August 18, 2026.</p>{content.sections.map(([heading, body]) => <section key={heading}><h2>{heading}</h2><p>{body}</p></section>)}<footer><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/refund">Refunds</Link><Link href="/disclaimer">Disclaimer</Link></footer></article></main>
  );
}
