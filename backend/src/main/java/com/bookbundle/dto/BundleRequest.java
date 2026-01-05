package com.bookbundle.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 북번들 요청
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BundleRequest {
    
    @NotEmpty(message = "책 목록은 필수입니다")
    private List<BookItem> books;
}

