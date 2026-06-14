declare module "whois-json" {
  function whois(
    domain: string,
    options?: Record<string, unknown>,
  ): Promise<Record<string, unknown>>;
  export = whois;
}
