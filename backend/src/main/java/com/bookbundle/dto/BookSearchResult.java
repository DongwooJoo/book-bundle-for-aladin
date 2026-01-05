package com.bookbundle.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 알라딘 책 검색 결과
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookSearchResult {
    
    private Long itemId;           // 알라딘 상품 ID
    private String isbn13;         // ISBN 13자리
    private String title;          // 책 제목
    private String author;         // 저자
    private String publisher;      // 출판사
    private String pubDate;        // 출판일
    private String cover;          // 표지 이미지 URL
    private Integer priceStandard; // 정가
    private Integer priceSales;    // 판매가
    private Integer usedCount;     // 중고 판매자 수
    private Integer usedMinPrice;  // 중고 최저가
}

