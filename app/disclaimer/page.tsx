import type { Metadata } from "next";
import LegalPage from "../legal-page";
export const metadata: Metadata = { title: "Product disclaimer | Burkeonis", robots: { index: false, follow: false } };
export default function DisclaimerPage() { return <LegalPage kind="disclaimer" />; }
