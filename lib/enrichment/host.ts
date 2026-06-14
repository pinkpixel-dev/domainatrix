import type { HostEnrichment } from "./types";

const IP_API_URL = "http://ip-api.com/json";

// ip-api.com fields bitmask: status + country + region + city + lat + lon + isp + org + asn
const FIELDS = "status,country,regionName,city,lat,lon,isp,org,as,query";

type IpApiResponse = {
  status: string;
  country?: string;
  regionName?: string;
  city?: string;
  lat?: number;
  lon?: number;
  isp?: string;
  org?: string;
  as?: string;
  query?: string;
};

// ---------------------------------------------------------------------------
// IP geolocation via ip-api.com (free, no auth, 45 req/min).
// Returns null if the lookup fails or the IP is private/invalid.
// ---------------------------------------------------------------------------

export async function getHostEnrichment(ip: string): Promise<HostEnrichment | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6_000);

    const res = await fetch(`${IP_API_URL}/${ip}?fields=${FIELDS}`, {
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      return null;
    }

    const data = (await res.json()) as IpApiResponse;

    if (data.status !== "success") {
      return null;
    }

    return {
      ip: data.query ?? ip,
      org: data.org ?? "",
      city: data.city ?? "",
      region: data.regionName ?? "",
      country: data.country ?? "",
      lat: data.lat ?? 0,
      lon: data.lon ?? 0,
      isp: data.isp ?? "",
      asNumber: data.as ?? "",
    };
  } catch {
    return null;
  }
}
