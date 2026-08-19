import type { Metadata } from "next";
import LegalPage from "../legal-page";
export const metadata: Metadata = { title: "Refund terms | Burkeonis", robots: { index: false, follow: false } };
export default function RefundsPage() { return <LegalPage kind="refunds" />; }
