// lib/phone-timezone.ts
// Map NANP (US/Canada) area codes to IANA timezones so SMS quiet hours are
// honored in the RECIPIENT's local time, not the server's. TCPA restricts
// texts to 8am-9pm local to the person being contacted, so getting this right
// is a compliance requirement, not a nicety. DST is handled by resolving to an
// IANA zone and reading the local hour through Intl (never a fixed offset).

// Primary timezone per area code. States/provinces that straddle a zone line
// are assigned their dominant zone; the fallback below covers anything missing.
const AREA_CODE_TZ: Record<string, string> = {};

const assign = (tz: string, codes: string[]) => {
  for (const c of codes) AREA_CODE_TZ[c] = tz;
};

// Eastern
assign("America/New_York", [
  "201","202","203","207","212","215","216","220","223","234","240","267","272",
  "276","301","302","304","305","321","330","339","347","351","352","386","401",
  "404","410","412","413","419","434","440","443","470","475","478","484","508",
  "513","516","518","540","551","561","567","570","571","585","586","603","606",
  "607","609","610","614","616","617","631","646","667","672","678","680","681",
  "689","703","704","706","707","716","717","718","724","727","732","740","743",
  "754","757","762","770","772","774","781","786","787","802","803","804","810",
  "813","814","828","835","843","845","848","850","856","857","860","862","864",
  "878","904","906","908","910","912","914","917","919","929","934","937","941",
  "947","954","959","971","978","980","984","989",
]);
// Canada Eastern (ON/QC)
assign("America/Toronto", [
  "226","249","289","343","365","416","437","519","548","613","647","705","807",
  "819","873","905","438","450","514","579","581","418","367",
]);
// Central
assign("America/Chicago", [
  "205","210","214","217","224","225","228","251","254","256","262","270","281",
  "309","312","314","316","318","319","331","334","337","346","361","364","402",
  "409","414","417","430","432","469","479","501","504","507","512","515","573",
  "580","601","608","615","618","620","630","636","641","651","659","660","662",
  "682","708","713","715","731","737","763","769","773","779","785","816","830",
  "832","847","870","901","903","913","915","920","931","936","940","952","956",
  "972","979",
]);
// Canada Central (MB/SK east)
assign("America/Winnipeg", ["204","431","306","639"]);
// Mountain
assign("America/Denver", [
  "303","307","308","385","406","435","505","575","719","720","801","970","575",
]);
// Arizona (Mountain, no DST)
assign("America/Phoenix", ["480","520","602","623","928"]);
// Canada Mountain (AB)
assign("America/Edmonton", ["403","587","780","825","368"]);
// Pacific
assign("America/Los_Angeles", [
  "209","213","310","323","341","408","415","424","442","510","530","559","562",
  "619","626","628","650","657","661","669","702","707","714","725","747","760",
  "775","805","818","820","831","840","858","909","916","925","949","951","971",
  "775",
]);
// Canada Pacific (BC)
assign("America/Vancouver", ["236","250","604","672","778","236"]);
// Alaska
assign("America/Anchorage", ["907"]);
// Hawaii (no DST)
assign("Pacific/Honolulu", ["808"]);
// Canada Atlantic (NS/NB/PEI)
assign("America/Halifax", ["506","709","782","902"]);
// Newfoundland
assign("America/St_Johns", ["709"]);

export const DEFAULT_TZ = "America/New_York";

/** Resolve a phone number to an IANA timezone via its NANP area code. */
export function timezoneForPhone(phone: string | null | undefined): string {
  if (!phone) return DEFAULT_TZ;
  const digits = phone.replace(/\D/g, "");
  const areaCode =
    digits.length >= 11 && digits.startsWith("1")
      ? digits.slice(1, 4)
      : digits.slice(0, 3);
  return AREA_CODE_TZ[areaCode] ?? DEFAULT_TZ;
}

/** Local hour (0-23) at the recipient for a given instant, DST-aware. */
export function localHourInTz(tz: string, at: Date): number {
  const formatted = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "numeric",
    hour12: false,
  }).format(at);
  const hour = parseInt(formatted, 10);
  return Number.isNaN(hour) ? 0 : hour === 24 ? 0 : hour;
}

/**
 * Given an instant, return the earliest instant at or after it whose local
 * hour falls inside [startHour, endHour). If already inside the window the
 * input is returned unchanged. Steps hour-by-hour so DST transitions are
 * handled by Intl rather than fixed-offset math.
 */
export function nextSendTime(
  tz: string,
  from: Date,
  startHour: number,
  endHour: number
): Date {
  const hourNow = localHourInTz(tz, from);
  if (hourNow >= startHour && hourNow < endHour) return from;

  const cursor = new Date(from.getTime());
  for (let i = 0; i < 48; i++) {
    cursor.setTime(cursor.getTime() + 3_600_000);
    const h = localHourInTz(tz, cursor);
    if (h >= startHour && h < endHour) return cursor;
  }
  // Should never happen for any sane window; fail open to the original time.
  return from;
}
