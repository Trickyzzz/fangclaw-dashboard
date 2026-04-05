const CNINFO_QUERY_URL = "https://www.cninfo.com.cn/new/hisAnnouncement/query";
const CNINFO_REFERER = "https://www.cninfo.com.cn/new/commonUrl/pageOfSearch?url=disclosure/list/search";
const CNINFO_BASE_URL = "https://www.cninfo.com.cn/new/disclosure/detail";
const CNINFO_THEME_KEYWORD = "半导体";

type CninfoAnnouncementRecord = {
  secCode: string;
  secName: string;
  announcementTitle: string;
  announcementTime: number;
  adjunctUrl: string;
  announcementId: string;
};

type CninfoResponse = {
  announcements?: CninfoAnnouncementRecord[];
};

export type CninfoAnnouncementItem = {
  symbol: string;
  companyName: string;
  title: string;
  publishedAt: string;
  announcementId: string;
  pdfUrl: string;
  url: string;
};

function getCninfoHeaders(): HeadersInit {
  return {
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    "X-Requested-With": "XMLHttpRequest",
    Referer: CNINFO_REFERER,
    Accept: "application/json, text/plain, */*",
  };
}

function normalizeCninfoTime(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function stripHighlightTags(value: string): string {
  return value.replace(/<\/?em>/g, "");
}

function normalizeAnnouncement(record: CninfoAnnouncementRecord): CninfoAnnouncementItem {
  return {
    symbol: record.secCode,
    companyName: stripHighlightTags(record.secName),
    title: stripHighlightTags(record.announcementTitle),
    publishedAt: normalizeCninfoTime(record.announcementTime),
    announcementId: record.announcementId,
    pdfUrl: `https://static.cninfo.com.cn/${record.adjunctUrl}`,
    url: `${CNINFO_BASE_URL}?announcementId=${record.announcementId}&orgId=&announcementTime=${record.announcementTime}`,
  };
}

export async function getRecentCninfoAnnouncements(limit = 5): Promise<CninfoAnnouncementItem[]> {
  const response = await fetch(CNINFO_QUERY_URL, {
    method: "POST",
    headers: getCninfoHeaders(),
    body: new URLSearchParams({
      pageNum: "1",
      pageSize: String(Math.max(limit, 10)),
      column: "",
      tabName: "fulltext",
      plate: "",
      stock: "",
      searchkey: CNINFO_THEME_KEYWORD,
      secid: "",
      category: "",
      trade: "",
      seDate: "",
      sortName: "time",
      sortType: "desc",
      isHLtitle: "true",
    }),
  });

  if (!response.ok) {
    throw new Error(`CNINFO request failed: ${response.status} ${response.statusText}`);
  }

  const payload = await response.json() as CninfoResponse;

  return (payload.announcements ?? [])
    .map(normalizeAnnouncement)
    .slice(0, limit);
}
