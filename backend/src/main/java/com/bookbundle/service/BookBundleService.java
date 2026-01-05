package com.bookbundle.service;

import com.bookbundle.crawler.AladinCrawlerService;
import com.bookbundle.dto.*;
import com.bookbundle.dto.SellerInfo.SellerBookItem;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 북번들 핵심 비즈니스 로직
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BookBundleService {

    private final AladinCrawlerService crawlerService;

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
        
        // 1. 각 책별로 판매자 목록 수집
        Map<Long, List<SellerInfo>> bookSellersMap = new HashMap<>();
        
        for (BookItem book : books) {
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
        }
        
        // 2. 판매자별 보유 책 교집합 분석
        Map<String, SellerInfo> sellerBundleMap = analyzeSellerBundles(books, bookSellersMap);
        
        // 3. 각 판매자가 실제로 해당 책들을 보유하는지 상세 확인
        List<SellerInfo> verifiedSellers = verifySellerBooks(sellerBundleMap, books);
        
        // 4. 보유 권수 순으로 정렬
        verifiedSellers.sort((a, b) -> {
            // 1차: 보유 권수 내림차순
            int countCompare = Integer.compare(b.getTotalBookCount(), a.getTotalBookCount());
            if (countCompare != 0) return countCompare;
            
            // 2차: 총 가격 오름차순
            return Integer.compare(a.getTotalPrice(), b.getTotalPrice());
        });
        
        // 상위 20명만
        if (verifiedSellers.size() > 20) {
            verifiedSellers = verifiedSellers.subList(0, 20);
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
     * 판매자가 실제로 책을 보유하는지 상세 확인 (가격, 등급 포함)
     */
    private List<SellerInfo> verifySellerBooks(
            Map<String, SellerInfo> sellerBundleMap, 
            List<BookItem> books) {
        
        List<SellerInfo> result = new ArrayList<>();
        
        // 2권 이상 보유한 판매자만 상세 확인 (효율성)
        List<SellerInfo> candidateSellers = sellerBundleMap.values().stream()
                .filter(s -> s.getTotalBookCount() >= 2)
                .sorted((a, b) -> Integer.compare(b.getTotalBookCount(), a.getTotalBookCount()))
                .limit(30) // 상위 30명만 상세 확인
                .collect(Collectors.toList());
        
        for (SellerInfo seller : candidateSellers) {
            try {
                List<SellerBookItem> verifiedBooks = new ArrayList<>();
                int totalPrice = 0;
                
                for (SellerBookItem bookItem : seller.getBooks()) {
                    // 책 제목으로 해당 판매자 상점에서 검색
                    Optional<SellerBookItem> verified = crawlerService.checkSellerHasBook(
                            seller.getSellerCode(),
                            bookItem.getItemId(),
                            bookItem.getTitle()
                    );
                    
                    if (verified.isPresent()) {
                        SellerBookItem verifiedBook = verified.get();
                        verifiedBooks.add(verifiedBook);
                        totalPrice += verifiedBook.getPrice() != null ? verifiedBook.getPrice() : 0;
                    }
                }
                
                if (!verifiedBooks.isEmpty()) {
                    seller.setBooks(verifiedBooks);
                    seller.setTotalBookCount(verifiedBooks.size());
                    seller.setTotalPrice(totalPrice);
                    result.add(seller);
                }
                
            } catch (Exception e) {
                log.warn("판매자 {} 상세 확인 실패: {}", seller.getSellerName(), e.getMessage());
                // 실패해도 기본 정보로 포함
                result.add(seller);
            }
        }
        
        // 1권만 보유한 판매자도 포함 (상세 확인 없이)
        sellerBundleMap.values().stream()
                .filter(s -> s.getTotalBookCount() == 1)
                .forEach(result::add);
        
        return result;
    }
}

