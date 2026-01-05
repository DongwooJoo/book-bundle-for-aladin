package com.bookbundle.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 사용자가 선택한 책 (등급 필터 포함)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookItem {
    
    private Long itemId;           // 알라딘 상품 ID
    private String isbn13;         // ISBN 13자리
    private String title;          // 책 제목
    private String author;         // 저자
    private String cover;          // 표지 이미지 URL
    private Integer priceStandard; // 정가
    private String minQuality;     // 최소 등급 필터 (최상/상/중/하)
    
    /**
     * 등급 체계:
     * - BEST: 최상 (새것에 가까움)
     * - GOOD: 상 (사용감 적음)
     * - FAIR: 중 (사용감 있음)
     */
    public enum Quality {
        BEST("최상", 1),
        GOOD("상", 2),
        FAIR("중", 3);
        
        private final String korean;
        private final int level;
        
        Quality(String korean, int level) {
            this.korean = korean;
            this.level = level;
        }
        
        public String getKorean() {
            return korean;
        }
        
        public int getLevel() {
            return level;
        }
        
        public static Quality fromKorean(String korean) {
            for (Quality q : values()) {
                if (q.korean.equals(korean)) {
                    return q;
                }
            }
            return FAIR; // 기본값
        }
        
        /**
         * 해당 등급이 최소 등급 이상인지 확인
         */
        public boolean isAtLeast(Quality minQuality) {
            return this.level <= minQuality.level;
        }
    }
}

