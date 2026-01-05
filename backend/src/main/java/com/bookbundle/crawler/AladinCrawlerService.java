package com.bookbundle.crawler;

import com.bookbundle.dto.BookItem;
import com.bookbundle.dto.BookSearchResult;
import com.bookbundle.dto.SellerInfo;
import com.bookbundle.dto.SellerInfo.SellerBookItem;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 알라딘 웹사이트 크롤링 서비스
 */
@Slf4j
@Service
public class AladinCrawlerService {

    @Value("${aladin.base-url}")
    private String baseUrl;

    @Value("${aladin.request-delay-ms}")
    private int requestDelayMs;

    @Value("${aladin.user-agent}")
    private String userAgent;

    private static final Pattern SC_PATTERN = Pattern.compile("SC=(\\d+)");
    private static final Pattern ITEM_ID_PATTERN = Pattern.compile("ItemId=(\\d+)");
    private static final Pattern PRICE_PATTERN = Pattern.compile("([\\d,]+)원");
    
    // 중고 상품 ID -> 원본 책 ID 매핑 캐시 (중복 요청 방지)
    private final Map<Long, Long> originalIdCache = new HashMap<>();

    /**
     * 책 제목으로 검색
     */
    public List<BookSearchResult> searchBooks(String keyword) throws IOException {
        String url = baseUrl + "/search/wsearchresult.aspx?SearchTarget=Used&KeyWord=" + 
                     java.net.URLEncoder.encode(keyword, "UTF-8");
        
        log.info("책 검색: {}", keyword);
        
        Document doc = Jsoup.connect(url)
                .userAgent(userAgent)
                .timeout(10000)
                .get();

        List<BookSearchResult> results = new ArrayList<>();
        
        // 검색 결과 파싱
        Elements items = doc.select(".ss_book_box");
        
        for (Element item : items) {
            try {
                BookSearchResult book = parseSearchResult(item);
                if (book != null && book.getItemId() != null) {
                    results.add(book);
                }
            } catch (Exception e) {
                log.warn("검색 결과 파싱 실패: {}", e.getMessage());
            }
        }
        
        // 검색 결과가 없으면 다른 셀렉터 시도
        if (results.isEmpty()) {
            Elements altItems = doc.select("[class*='ss_book']");
            for (Element item : altItems) {
                try {
                    BookSearchResult book = parseSearchResultAlt(item, doc);
                    if (book != null && book.getItemId() != null) {
                        results.add(book);
                    }
                } catch (Exception e) {
                    log.warn("대체 파싱 실패: {}", e.getMessage());
                }
            }
        }
        
        log.info("검색 결과: {}건", results.size());
        return results;
    }

    private BookSearchResult parseSearchResult(Element item) {
        // ItemId 추출
        Element linkEl = item.selectFirst("a[href*='ItemId']");
        if (linkEl == null) return null;
        
        String href = linkEl.attr("href");
        Matcher matcher = ITEM_ID_PATTERN.matcher(href);
        if (!matcher.find()) return null;
        
        Long itemId = Long.parseLong(matcher.group(1));
        
        // 제목
        String title = item.selectFirst(".bo3") != null ? 
                       item.selectFirst(".bo3").text() : linkEl.text();
        
        // 저자/출판사
        Element infoEl = item.selectFirst(".ss_book_list_info_1, .info");
        String author = "";
        String publisher = "";
        if (infoEl != null) {
            String info = infoEl.text();
            String[] parts = info.split("\\|");
            if (parts.length > 0) author = parts[0].trim();
            if (parts.length > 1) publisher = parts[1].trim();
        }
        
        // 표지 이미지
        Element coverEl = item.selectFirst("img[src*='cover']");
        String cover = coverEl != null ? coverEl.attr("src") : "";
        
        // 중고 정보
        Element usedEl = item.selectFirst("a[href*='TabType=1']");
        int usedCount = 0;
        int usedMinPrice = 0;
        if (usedEl != null) {
            String usedText = usedEl.text();
            Matcher countMatcher = Pattern.compile("\\((\\d+)\\)").matcher(usedText);
            if (countMatcher.find()) {
                usedCount = Integer.parseInt(countMatcher.group(1));
            }
        }
        
        return BookSearchResult.builder()
                .itemId(itemId)
                .title(title)
                .author(author)
                .publisher(publisher)
                .cover(cover)
                .usedCount(usedCount)
                .usedMinPrice(usedMinPrice)
                .build();
    }
    
    private BookSearchResult parseSearchResultAlt(Element item, Document doc) {
        // 대체 파싱 로직
        Elements links = doc.select("a[href*='wuseditemall'][href*='ItemId']");
        
        for (Element link : links) {
            String href = link.attr("href");
            String text = link.text().trim();
            
            if (text.isEmpty() || text.equals("중고모두보기")) continue;
            
            Matcher matcher = ITEM_ID_PATTERN.matcher(href);
            if (matcher.find()) {
                return BookSearchResult.builder()
                        .itemId(Long.parseLong(matcher.group(1)))
                        .title(text)
                        .build();
            }
        }
        return null;
    }

    /**
     * 중고 상품 페이지에서 원본 책 ID 추출
     * 장바구니에서 가져온 ID가 중고 상품 개별 ID인 경우, 원본 책 ID를 찾아서 반환
     * 
     * @param usedItemId 중고 상품 ID (장바구니에서 가져온 ID)
     * @return 원본 책 ID (판매자 조회에 사용)
     */
    public Long getOriginalItemId(Long usedItemId) throws IOException, InterruptedException {
        // 캐시 확인
        if (originalIdCache.containsKey(usedItemId)) {
            Long cachedId = originalIdCache.get(usedItemId);
            log.debug("캐시에서 원본 ID 조회: {} -> {}", usedItemId, cachedId);
            return cachedId;
        }
        
        String url = baseUrl + "/shop/wproduct.aspx?ItemId=" + usedItemId;
        
        log.info("원본 ID 추출 시도: ItemId={}", usedItemId);
        
        Thread.sleep(requestDelayMs);
        
        Document doc = Jsoup.connect(url)
                .userAgent(userAgent)
                .timeout(10000)
                .get();
        
        // 방법 1: "중고 모두보기" 링크에서 원본 ItemId 추출
        Elements usedAllLinks = doc.select("a[href*='wuseditemall.aspx'][href*='ItemId=']");
        for (Element link : usedAllLinks) {
            String href = link.attr("href");
            Matcher matcher = ITEM_ID_PATTERN.matcher(href);
            if (matcher.find()) {
                Long originalId = Long.parseLong(matcher.group(1));
                // 자기 자신이 아닌 다른 ID를 찾으면 그게 원본
                if (!originalId.equals(usedItemId)) {
                    log.info("원본 ID 발견 (중고 모두보기): {} -> {}", usedItemId, originalId);
                    originalIdCache.put(usedItemId, originalId);
                    return originalId;
                }
            }
        }
        
        // 방법 2: 상품 정보 영역에서 원본 책 링크 찾기
        Elements productLinks = doc.select("a[href*='wproduct.aspx'][href*='ItemId=']");
        for (Element link : productLinks) {
            String href = link.attr("href");
            // 중고 상품이 아닌 원본 상품 링크 찾기
            if (href.contains("partner=") || href.contains("newproduct")) continue;
            
            Matcher matcher = ITEM_ID_PATTERN.matcher(href);
            if (matcher.find()) {
                Long foundId = Long.parseLong(matcher.group(1));
                // 자기 자신이 아닌 ID이고, 훨씬 작은 숫자면 원본일 가능성 높음
                if (!foundId.equals(usedItemId) && foundId < usedItemId / 2) {
                    log.info("원본 ID 발견 (상품 링크): {} -> {}", usedItemId, foundId);
                    originalIdCache.put(usedItemId, foundId);
                    return foundId;
                }
            }
        }
        
        // 방법 3: 페이지 내 스크립트나 메타 데이터에서 원본 ID 추출
        String pageHtml = doc.html();
        // "기본상품아이디" 또는 비슷한 패턴 찾기
        Pattern originalPattern = Pattern.compile("(?:기본상품|원본|parent|original).*?ItemId[=:](\\d+)", Pattern.CASE_INSENSITIVE);
        Matcher scriptMatcher = originalPattern.matcher(pageHtml);
        if (scriptMatcher.find()) {
            Long originalId = Long.parseLong(scriptMatcher.group(1));
            if (!originalId.equals(usedItemId)) {
                log.info("원본 ID 발견 (스크립트): {} -> {}", usedItemId, originalId);
                originalIdCache.put(usedItemId, originalId);
                return originalId;
            }
        }
        
        // 원본 ID를 찾지 못한 경우, 입력받은 ID가 이미 원본이거나 찾을 수 없음
        log.info("원본 ID 찾지 못함, 입력 ID 사용: {}", usedItemId);
        originalIdCache.put(usedItemId, usedItemId);
        return usedItemId;
    }

    /**
     * 특정 책의 판매자 목록 조회 (userUsed만)
     * 장바구니에서 가져온 중고 상품 ID를 원본 책 ID로 변환 후 조회
     */
    public List<SellerInfo> getSellersByItemId(Long itemId, String minQuality) throws IOException, InterruptedException {
        // 먼저 원본 책 ID 추출 시도
        Long originalItemId = getOriginalItemId(itemId);
        
        String url = baseUrl + "/shop/UsedShop/wuseditemall.aspx?ItemId=" + originalItemId + "&TabType=1";
        
        log.info("판매자 목록 조회: 입력ID={}, 원본ID={}", itemId, originalItemId);
        
        // 요청 간격 유지
        Thread.sleep(requestDelayMs);
        
        Document doc = Jsoup.connect(url)
                .userAgent(userAgent)
                .timeout(10000)
                .get();

        List<SellerInfo> sellers = new ArrayList<>();
        Map<String, SellerInfo> sellerMap = new HashMap<>();
        
        // 판매자 링크에서 SC 추출
        Elements sellerLinks = doc.select("a[href*='wshopitem.aspx?SC=']");
        
        for (Element link : sellerLinks) {
            String href = link.attr("href");
            String name = link.text().trim();
            
            // SC 코드 추출
            Matcher scMatcher = SC_PATTERN.matcher(href);
            if (!scMatcher.find()) continue;
            
            String sellerCode = scMatcher.group(1);
            
            // SC=0 제외, 이미 처리된 판매자 제외
            if ("0".equals(sellerCode)) continue;
            if (name.isEmpty() || name.contains("전문셀러") || name.contains("실버셀러")) continue;
            if (sellerMap.containsKey(sellerCode)) continue;
            
            SellerInfo seller = SellerInfo.builder()
                    .sellerCode(sellerCode)
                    .sellerName(name)
                    .shopUrl(baseUrl + "/shop/usedshop/wshopitem.aspx?SC=" + sellerCode)
                    .books(new ArrayList<>())
                    .build();
            
            sellerMap.put(sellerCode, seller);
        }
        
        // 등급, 가격 정보 파싱 (추가 로직 필요시)
        Elements rows = doc.select(".Ere_sub_row, .ss_book_list tbody tr");
        // TODO: 등급별 필터링 로직 추가
        
        sellers.addAll(sellerMap.values());
        log.info("판매자 {}명 발견 (원본ID={})", sellers.size(), originalItemId);
        
        return sellers;
    }

    /**
     * 특정 판매자가 특정 책을 보유하고 있는지 확인
     * 
     * 중요: 장바구니의 ItemId는 특정 중고 상품 ID이므로,
     * 판매자 상점에서는 책 제목으로 검색해야 합니다.
     */
    public Optional<SellerBookItem> checkSellerHasBook(String sellerCode, Long itemId, String bookTitle) 
            throws IOException, InterruptedException {
        
        // 검색 키워드 정제 (특수문자 제거, 부제목 제거)
        String searchKeyword = normalizeBookTitle(bookTitle);
        
        // 판매자 상점에서 책 검색
        String url = baseUrl + "/shop/usedshop/wshopitem.aspx?SC=" + sellerCode + 
                     "&KeyWord=" + java.net.URLEncoder.encode(searchKeyword, "UTF-8");
        
        log.debug("판매자 {} 상점 검색: '{}' (원본: '{}')", sellerCode, searchKeyword, bookTitle);
        
        Thread.sleep(requestDelayMs);
        
        Document doc = Jsoup.connect(url)
                .userAgent(userAgent)
                .timeout(15000)  // 타임아웃 증가
                .get();
        
        // 검색 결과에서 책 찾기 (제목 매칭)
        // 방법 1: 상품 링크에서 제목 확인
        Elements productLinks = doc.select("a.bo3[href*='wproduct.aspx']");
        
        log.debug("판매자 {} 검색 결과: {}건의 상품 링크", sellerCode, productLinks.size());
        
        for (Element link : productLinks) {
            String linkTitle = link.text().trim();
            
            // 제목 유사도 확인 (정규화된 제목으로 비교)
            if (isTitleMatch(linkTitle, bookTitle)) {
                // 가격, 등급 추출
                Element row = link.closest("tr, .ss_book_box, div[class*='book']");
                int price = 0;
                String quality = "중";
                
                if (row != null) {
                    String rowText = row.text();
                    
                    // 가격 추출
                    Matcher priceMatcher = PRICE_PATTERN.matcher(rowText);
                    if (priceMatcher.find()) {
                        price = Integer.parseInt(priceMatcher.group(1).replace(",", ""));
                    }
                    
                    // 등급 추출 (우선순위: 최상 > 상 > 중 > 하)
                    if (rowText.contains("최상") || rowText.contains("[중고-최상]")) {
                        quality = "최상";
                    } else if (rowText.contains("[중고-상]") || (rowText.contains("상") && !rowText.contains("최상"))) {
                        quality = "상";
                    } else if (rowText.contains("[중고-중]")) {
                        quality = "중";
                    } else if (rowText.contains("[중고-하]")) {
                        quality = "하";
                    }
                }
                
                log.info("✅ 판매자 {} 책 발견: '{}' (등급: {}, 가격: {}원)", 
                         sellerCode, bookTitle, quality, price);
                
                return Optional.of(SellerBookItem.builder()
                        .itemId(itemId)
                        .title(bookTitle)
                        .quality(quality)
                        .price(price)
                        .build());
            }
        }
        
        // 방법 2: ItemId가 포함된 링크도 확인 (기존 로직)
        Elements itemLinks = doc.select("a[href*='ItemId=']");
        for (Element link : itemLinks) {
            String linkTitle = link.text().trim();
            if (isTitleMatch(linkTitle, bookTitle)) {
                log.info("✅ 판매자 {} 책 발견 (ItemId 링크): '{}'", sellerCode, bookTitle);
                
                return Optional.of(SellerBookItem.builder()
                        .itemId(itemId)
                        .title(bookTitle)
                        .quality("중")  // 기본 등급
                        .price(0)
                        .build());
            }
        }
        
        log.debug("❌ 판매자 {} 책 없음: '{}'", sellerCode, bookTitle);
        return Optional.empty();
    }
    
    /**
     * 책 제목 정규화 (검색용)
     */
    private String normalizeBookTitle(String title) {
        if (title == null) return "";
        
        String normalized = title
                // [중고-상] 등 제거
                .replaceAll("\\[중고-[^\\]]+\\]", "")
                // [외국도서] 등 제거
                .replaceAll("\\[[^\\]]+\\]", "")
                // 부제목 제거 (: 이후)
                .replaceAll("[:：].*", "")
                // 특수문자 정리
                .replaceAll("[\\(\\)\\[\\]\\{\\}]", "")
                .trim();
        
        // 너무 짧으면 원본 사용
        if (normalized.length() < 2) {
            return title.replaceAll("\\[중고-[^\\]]+\\]", "").trim();
        }
        
        // 검색어가 너무 길면 앞부분만 사용
        if (normalized.length() > 20) {
            normalized = normalized.substring(0, 20);
        }
        
        return normalized;
    }
    
    /**
     * 제목 유사도 확인
     */
    private boolean isTitleMatch(String linkTitle, String searchTitle) {
        if (linkTitle == null || searchTitle == null) return false;
        
        // 정규화
        String normalizedLink = normalizeBookTitle(linkTitle).toLowerCase();
        String normalizedSearch = normalizeBookTitle(searchTitle).toLowerCase();
        
        // 빈 문자열 체크
        if (normalizedLink.isEmpty() || normalizedSearch.isEmpty()) return false;
        
        // 완전 일치
        if (normalizedLink.equals(normalizedSearch)) return true;
        
        // 포함 관계 확인
        if (normalizedLink.contains(normalizedSearch) || normalizedSearch.contains(normalizedLink)) {
            return true;
        }
        
        // 앞 10글자 일치 확인
        int minLen = Math.min(10, Math.min(normalizedLink.length(), normalizedSearch.length()));
        if (minLen >= 3) {
            String linkPrefix = normalizedLink.substring(0, minLen);
            String searchPrefix = normalizedSearch.substring(0, minLen);
            if (linkPrefix.equals(searchPrefix)) return true;
        }
        
        return false;
    }
}

