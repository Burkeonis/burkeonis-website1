"use client";

export default function SignupGate() {
  return (
    <div className="checkout-card pfc-gate" id="get-the-file">
      <p className="checkout-label">Free download · delivered immediately</p>
      <h3 className="pfc-gate-title">Put the pattern on the table.</h3>
      <p className="checkout-copy">Enter your email. The complete Pattern Autopsy opens immediately, and Burkeonis Field Notes follow only when there is something worth saying.</p>
      <iframe
        className="pfc-sender-frame"
        src="https://stats.sender.net/forms/en53v4/view"
        title="Get the free Burkeonis Pattern Autopsy"
        loading="eager"
      />
      <p className="checkout-fine-print">No spam. No fake urgency. Unsubscribe with one click. Your private work stays yours.</p>
    </div>
  );
}
