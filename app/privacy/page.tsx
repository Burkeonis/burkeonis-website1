import type { Metadata } from "next";
import LegalPage from "../legal-page";
export const metadata: Metadata = { title: "Privacy notice | Burkeonis", robots: { index: false, follow: false } };
export default function PrivacyPage() { return <LegalPage kind="privacy" />; }
