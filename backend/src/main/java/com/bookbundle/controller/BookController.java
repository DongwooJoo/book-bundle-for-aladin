package com.bookbundle.controller;

import com.bookbundle.dto.BookSearchResult;
import com.bookbundle.dto.BundleRequest;
import com.bookbundle.dto.BundleResult;
import com.bookbundle.service.BookBundleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;

/**
 * 북번들 REST API 컨트롤러
 */
@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class BookController {

    private final BookBundleService bookBundleService;

    /**
     * 책 검색 API
     * GET /api/books/search?keyword=클린코드
     */
    @GetMapping("/books/search")
    public ResponseEntity<List<BookSearchResult>> searchBooks(
            @RequestParam String keyword) {
        
        log.info("책 검색 요청: {}", keyword);
        
        try {
            List<BookSearchResult> results = bookBundleService.searchBooks(keyword);
            return ResponseEntity.ok(results);
        } catch (IOException e) {
            log.error("책 검색 실패", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 북번들 분석 API
     * POST /api/bundle/analyze
     */
    @PostMapping("/bundle/analyze")
    public ResponseEntity<BundleResult> analyzeBundle(
            @Valid @RequestBody BundleRequest request) {
        
        log.info("북번들 분석 요청: {}권", request.getBooks().size());
        
        try {
            BundleResult result = bookBundleService.analyzeBundle(request);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("북번들 분석 실패", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 헬스 체크 API
     */
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("OK");
    }
}

