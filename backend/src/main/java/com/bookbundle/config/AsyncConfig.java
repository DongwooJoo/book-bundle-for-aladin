package com.bookbundle.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

/**
 * 비동기 처리를 위한 ThreadPool 설정
 */
@Configuration
@EnableAsync
public class AsyncConfig {

    /**
     * 크롤링 작업용 스레드 풀
     * - corePoolSize: 5 (동시 5개 요청)
     * - maxPoolSize: 10 (최대 10개)
     * - queueCapacity: 100
     */
    @Bean(name = "crawlerExecutor")
    public Executor crawlerExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(5);
        executor.setMaxPoolSize(10);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("Crawler-");
        executor.initialize();
        return executor;
    }
}

