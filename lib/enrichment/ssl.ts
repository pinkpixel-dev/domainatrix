import tls, { type PeerCertificate } from "tls";
import type { SslEnrichment } from "./types";

const SSL_TIMEOUT_MS = 10_000;

// ---------------------------------------------------------------------------
// SSL certificate lookup via TLS handshake.
// Returns null if the domain has no HTTPS or the connection times out.
// ---------------------------------------------------------------------------

function getRawCert(domain: string): Promise<Partial<PeerCertificate> | null> {
  return new Promise((resolve) => {
    let settled = false;

    const finish = (result: Partial<PeerCertificate> | null) => {
      if (!settled) {
        settled = true;
        resolve(result);
      }
    };

    const timer = setTimeout(() => {
      socket.destroy();
      finish(null);
    }, SSL_TIMEOUT_MS);

    const socket = tls.connect(
      443,
      domain,
      { servername: domain, rejectUnauthorized: false },
      () => {
        clearTimeout(timer);
        const cert = socket.getPeerCertificate();
        socket.end();
        finish(cert ?? null);
      },
    );

    socket.on("error", () => {
      clearTimeout(timer);
      finish(null);
    });
  });
}

export async function getSslEnrichment(domain: string): Promise<SslEnrichment | null> {
  const cert = await getRawCert(domain);
  if (!cert || !cert.subject) {
    return null;
  }

  return {
    issuer: (cert.issuer as Record<string, string> | undefined)?.O ?? null,
    issuerCountry: (cert.issuer as Record<string, string> | undefined)?.C ?? "",
    subject: (cert.subject as Record<string, string> | undefined)?.CN ?? "",
    validFrom: cert.valid_from ?? "",
    validTo: cert.valid_to ?? "",
    fingerprint: cert.fingerprint ?? "",
    keySize: cert.bits ?? 0,
    signatureAlgorithm: cert.asn1Curve ?? "",
  };
}
