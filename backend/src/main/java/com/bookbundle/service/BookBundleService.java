package com.bookbundle.service;

import com.bookbundle.crawler.AladinCrawlerService;
import com.bookbundle.dto.*;
import com.bookbundle.dto.SellerInfo.SellerBookItem;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executor;
import java.util.stream.Collectors;

/**
 * 북번들 핵심 비즈니스 로직
 * - Phase 1: 책별 판매자 수집 (병렬 처리)
 * - Phase 2: 판매자별 교집합 분석
 * - Phase 3: 판매자별 상세 검증 (병렬 처리 + 스마트 필터링)
 */
@Slf4j
@Service
public class BookBundleService {

    private final AladinCrawlerService crawlerService;
    private final Executor crawlerExecutor;

    @Autowired
    public BookBundleService(
            AladinCrawlerService crawlerService,
            @Qualifier("crawlerExecutor") Executor crawlerExecutor) {
        this.crawlerService = crawlerService;
        this.crawlerExecutor = crawlerExecutor;
    }

    /**
     * 책 검색
     */
    public List<BookSearchResult> searchBooks(String keyword) throws IOException {
        return crawlerService.searchBooks(keyword);
    }

    /**
     * 북번들 분석 실행
     * 입력받은 책 목록에 대해 여러 책을 보유한 판매자를 찾아서 반환
     */
    public BundleResult analyzeBundle(BundleRequest request) {
        long startTime = System.currentTimeMillis();
        
        List<BookItem> books = request.getBooks();
        log.info("북번들 분석 시작: {}권", books.size());
        
        // ========== Phase 1: 각 책별 판매자 수집 (병렬 처리) ==========
        Map<Long, List<SellerInfo>> bookSellersMap = new ConcurrentHashMap<>();
        
        List<CompletableFuture<Void>> phase1Futures = books.stream()
            .map(book -> CompletableFuture.runAsync(() -> {
                try {
                    List<SellerInfo> sellers = crawlerService.getSellersByItemId(
                            book.getItemId(), 
                            book.getMinQuality()
                    );
                    bookSellersMap.put(book.getItemId(), sellers);
                    log.info("책 '{}': 판매자 {}명", book.getTitle(), sellers.size());
                } catch (Exception e) {
                    log.error("판매자 조회 실패: {}", book.getTitle(), e);
                    bookSellersMap.put(book.getItemId(), Collections.emptyList());
                }
            }, crawlerExecutor))
            .collect(Collectors.toList());
        
        // 모든 Phase 1 작업 완료 대기
        CompletableFuture.allOf(phase1Futures.toArray(new CompletableFuture[0])).join();
        
        // ========== Phase 1 결과 매핑: 판매자-책 Set 생성 ==========
        Set<String> phase1SellerBookSet = ConcurrentHashMap.newKeySet();
        
        for (Map.Entry<Long, List<SellerInfo>> entry : bookSellersMap.entrySet()) {
            Long itemId = entry.getKey();
            for (SellerInfo seller : entry.getValue()) {
                phase1SellerBookSet.add(seller.getSellerCode() + ":" + itemId);
            }
        }
        
        log.info("Phase 1 완료: {} 개의 판매자-책 매핑 발견", phase1SellerBookSet.size());
        
        // ========== Phase 2: 판매자별 보유 책 교집합 분석 ==========
        Map<String, SellerInfo> sellerBundleMap = analyzeSellerBundles(books, bookSellersMap);
        
        // ========== Phase 3: 판매자별 상세 검증 (병렬 처리 + 스마트 필터링) ==========
        List<SellerInfo> verifiedSellers = verifySellerBooks(sellerBundleMap, books, phase1SellerBookSet);
        
        // ========== Phase 4: 보유 권수 순으로 정렬 ==========
        verifiedSellers.sort((a, b) -> {
            // 1차: 보유 권수 내림차순
            int countCompare = Integer.compare(b.getTotalBookCount(), a.getTotalBookCount());
            if (countCompare != 0) return countCompare;
            
            // 2차: 총 가격 오름차순
            return Integer.compare(a.getTotalPrice(), b.getTotalPrice());
        });
        
        // 상위 20명만
        if (verifiedSellers.size() > 20) {
            verifiedSellers = new ArrayList<>(verifiedSellers.subList(0, 20));
        }
        
        long analysisTime = System.currentTimeMillis() - startTime;
        
        // 모든 책을 보유한 판매자가 있는지 확인
        boolean hasCompleteSeller = verifiedSellers.stream()
                .anyMatch(s -> s.getTotalBookCount() == books.size());
        
        log.info("북번들 분석 완료: {}ms, 판매자 {}명", analysisTime, verifiedSellers.size());
        
        return BundleResult.builder()
                .requestedBooks(books)
                .totalRequestedCount(books.size())
                .sellers(verifiedSellers)
                .hasCompleteSeller(hasCompleteSeller)
                .analysisTimeMs(analysisTime)
                .build();
    }

    /**
     * 판매자별 보유 책 교집합 분석
     */
    private Map<String, SellerInfo> analyzeSellerBundles(
            List<BookItem> books, 
            Map<Long, List<SellerInfo>> bookSellersMap) {
        
        Map<String, SellerInfo> sellerBundleMap = new HashMap<>();
        
        // 각 책의 판매자를 순회하며 집계
        for (BookItem book : books) {
            List<SellerInfo> sellers = bookSellersMap.getOrDefault(book.getItemId(), Collections.emptyList());
            
            for (SellerInfo seller : sellers) {
                String sellerCode = seller.getSellerCode();
                
                SellerInfo bundleSeller = sellerBundleMap.computeIfAbsent(sellerCode, code -> 
                    SellerInfo.builder()
                        .sellerCode(code)
                        .sellerName(seller.getSellerName())
                        .shopUrl(seller.getShopUrl())
                        .books(new ArrayList<>())
                        .totalBookCount(0)
                        .totalPrice(0)
                        .build()
                );
                
                // 이 판매자가 이 책을 보유하고 있음을 기록
                SellerBookItem bookItem = SellerBookItem.builder()
                        .itemId(book.getItemId())
                        .title(book.getTitle())
                        .build();
                
                // 중복 방지
                boolean alreadyHas = bundleSeller.getBooks().stream()
                        .anyMatch(b -> b.getItemId().equals(book.getItemId()));
                
                if (!alreadyHas) {
                    bundleSeller.getBooks().add(bookItem);
                    bundleSeller.setTotalBookCount(bundleSeller.getTotalBookCount() + 1);
                }
            }
        }
        
        return sellerBundleMap;
    }

    /**
     * 판매자가 실제로 책을 보유하는지 상세 확인 (병렬 처리 + 스마트 필터링)
     */
    private List<SellerInfo> verifySellerBooks(
            Map<String, SellerInfo> sellerBundleMap, 
            List<BookItem> books,
            Set<String> phase1SellerBookSet) {
        
        List<SellerInfo> result = Collections.synchronizedList(new ArrayList<>());
        
        // 2권 이상 보유한 판매자만 상세 확인 (효율성)
        List<SellerInfo> candidateSellers = sellerBundleMap.values().stream()
                .filter(s -> s.getTotalBookCount() >= 2)
                .sorted((a, b) -> Integer.compare(b.getTotalBookCount(), a.getTotalBookCount()))
                .limit(25) // 최종 결과 20명을 위해 충분한 여유 확보
                .collect(Collectors.toList());
        
        log.info("상세 확인 대상 판매자: {}명", candidateSellers.size());
        
        // ========== 판매자별 병렬 처리 ==========
        List<CompletableFuture<Void>> phase3Futures = candidateSellers.stream()
            .map(seller -> CompletableFuture.runAsync(() -> {
                try {
                    List<SellerBookItem> verifiedBooks = verifySellerBooksInternal(
                            seller, books, phase1SellerBookSet
                    );
                    
                    if (!verifiedBooks.isEmpty()) {
                        int totalPrice = verifiedBooks.stream()
                                .mapToInt(b -> b.getPrice() != null ? b.getPrice() : 0)
                                .sum();
                        
                        seller.setBooks(verifiedBooks);
                        seller.setTotalBookCount(verifiedBooks.size());
                        seller.setTotalPrice(totalPrice);
                        result.add(seller);
                        
                        log.info("판매자 {} ({}): 검증 완료 - {}권 보유", 
                                seller.getSellerName(), seller.getSellerCode(), verifiedBooks.size());
                    }
                } catch (Exception e) {
                    log.warn("판매자 {} 상세 확인 실패: {}", seller.getSellerName(), e.getMessage());
                }
            }, crawlerExecutor))
            .collect(Collectors.toList());
        
        // 모든 Phase 3 작업 완료 대기
        CompletableFuture.allOf(phase3Futures.toArray(new CompletableFuture[0])).join();
        
        // 1권만 보유한 판매자는 제외 (북번들 목적에 맞지 않고, 가격 정보도 없음)
        // 2권 이상 보유하고 상세 확인이 완료된 판매자만 반환
        
        return result;
    }

    /**
     * 개별 판매자의 책 보유 검증 (스마트 필터링 적용)
     * - 확인된 책 (Phase 1에서 발견): 100% 검증
     * - 미확인 책: 샘플 3권만 검색, 발견 시 나머지도 검색
     */
    private List<SellerBookItem> verifySellerBooksInternal(
            SellerInfo seller,
            List<BookItem> books,
            Set<String> phase1SellerBookSet) {
        
        List<SellerBookItem> verifiedBooks = new ArrayList<>();
        String sellerCode = seller.getSellerCode();
        
        // 책을 2가지 카테고리로 분류
        List<BookItem> confirmedBooks = new ArrayList<>();  // Phase 1에서 확인됨
        List<BookItem> unknownBooks = new ArrayList<>();    // Phase 1에서 미확인
        
        for (BookItem book : books) {
            String key = sellerCode + ":" + book.getItemId();
            if (phase1SellerBookSet.contains(key)) {
                confirmedBooks.add(book);
            } else {
                unknownBooks.add(book);
            }
        }
        
        log.debug("판매자 {}: 확인된 책 {}권, 미확인 {}권", 
                  sellerCode, confirmedBooks.size(), unknownBooks.size());
        
        // 1. 확인된 책들은 반드시 검증 (가격/등급 정보 수집)
        for (BookItem book : confirmedBooks) {
            try {
                Optional<SellerBookItem> verified = crawlerService.checkSellerHasBook(
                        sellerCode, book.getItemId(), book.getTitle()
                );
                verified.ifPresent(verifiedBooks::add);
            } catch (Exception e) {
                log.debug("검증 실패 (확인된 책): {}", book.getTitle());
            }
        }
        
        // 2. 미확인 책들은 샘플링하여 검증 (최대 3권)
        //    → 알라딘 "중고 모두보기"가 모든 판매자를 표시하지 않기 때문
        int sampleSize = Math.min(3, unknownBooks.size());
        
        if (sampleSize > 0) {
            List<BookItem> sampleBooks = unknownBooks.subList(0, sampleSize);
            boolean foundInSample = false;
            
            for (BookItem book : sampleBooks) {
                try {
                    Optional<SellerBookItem> verified = crawlerService.checkSellerHasBook(
                            sellerCode, book.getItemId(), book.getTitle()
                    );
                    if (verified.isPresent()) {
                        verifiedBooks.add(verified.get());
                        foundInSample = true;
                    }
                } catch (Exception e) {
                    log.debug("검증 실패 (미확인 책 샘플): {}", book.getTitle());
                }
            }
            
            // 샘플에서 발견되면 나머지도 검색
            if (foundInSample && unknownBooks.size() > sampleSize) {
                for (int i = sampleSize; i < unknownBooks.size(); i++) {
                    BookItem remainingBook = unknownBooks.get(i);
                    try {
                        Optional<SellerBookItem> extra = crawlerService.checkSellerHasBook(
                                sellerCode, remainingBook.getItemId(), remainingBook.getTitle()
                        );
                        extra.ifPresent(verifiedBooks::add);
                    } catch (Exception e) {
                        log.debug("검증 실패 (미확인 책 추가): {}", remainingBook.getTitle());
                    }
                }
            }
        }
        
        return verifiedBooks;
    }
}
