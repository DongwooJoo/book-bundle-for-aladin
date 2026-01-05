package com.bookbundle.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 북번들 결과
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BundleResult {
    
    // 입력한 책 목록
    private List<BookItem> requestedBooks;
    
    // 총 요청 책 수
    private int totalRequestedCount;
    
    // 추천 판매자 목록 (보유 권수 순 정렬)
    private List<SellerInfo> sellers;
    
    // 모든 책을 보유한 판매자 존재 여부
    private boolean hasCompleteSeller;
    
    // 분석 소요 시간 (ms)
    private long analysisTimeMs;
}

