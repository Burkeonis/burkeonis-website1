import type { Metadata } from "next";
import LegalPage from "../legal-page";
export const metadata: Metadata = { title: "Terms of use | Burkeonis", robots: { index: false, follow: false } };
export default function TermsPage() { return <LegalPage kind="terms" />; }
