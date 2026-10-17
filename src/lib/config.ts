/** Demo placeholders. Pricing is not final. */
export const PRICES = { blood: 1499, dna: 4999 } as const;
export const CURRENCY = "₹";
export const money = (n: number) => `${CURRENCY}${n.toLocaleString("en-IN")}`;
export const TAGLINE = "Age Smarter, Not Faster";
export const CONSENT_VERSION = "dna-consent-v0.1";
