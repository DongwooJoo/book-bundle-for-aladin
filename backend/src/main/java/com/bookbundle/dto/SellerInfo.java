package com.bookbundle.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 판매자 정보
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SellerInfo {
    
    private String sellerCode;      // 판매자 코드 (SC)
    private String sellerName;      // 판매자 이름
    private String sellerType;      // 판매자 유형 (전문셀러, 실버셀러, 일반)
    private Double satisfactionRate; // 구매 만족도 (%)
    private String shopUrl;         // 판매자 상점 URL
    
    // 해당 판매자가 보유한 책 목록
    private List<SellerBookItem> books;
    
    // 총 보유 권수
    private int totalBookCount;
    
    // 총 가격 (배송비 미포함)
    private int totalPrice;
    
    // 배송비
    private int shippingFee;
    
    // 무료배송 기준 금액
    private int freeShippingThreshold;
    
    /**
     * 판매자가 보유한 개별 책 정보
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SellerBookItem {
        private Long itemId;
        private String title;
        private String quality;     // 등급 (최상/상/중/하)
        private Integer price;      // 판매가
        private String productUrl;  // 상품 URL
    }
}

