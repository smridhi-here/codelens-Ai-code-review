package com.codelens.service;

import com.codelens.dto.AiResponse;
import com.codelens.dto.FixResponse;
import com.codelens.dto.IssueDto;
import com.codelens.dto.ReviewRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

/** Calls the Python AI engine over HTTP. */
@Component
public class AiEngineClient {

    private static final String NOT_REACHABLE =
            "AI engine is not reachable. Is the Python service running on port 8000?";

    private final RestClient client;

    public AiEngineClient(@Value("${ai.engine.url}") String baseUrl,
                          @Value("${ai.engine.key:}") String engineKey) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10000);   // a sleeping hosted engine needs time to wake up
        factory.setReadTimeout(90000);      // AI answers (and cold starts) can take a while
        RestClient.Builder builder = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(factory);
        if (!engineKey.isBlank()) {
            // shared secret so only this backend can use the engine
            builder.defaultHeader("X-Engine-Key", engineKey);
        }
        this.client = builder.build();
    }

    public AiResponse analyze(ReviewRequest request) {
        AiResponse response;
        try {
            response = client.post()
                    .uri("/analyze")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of(
                            "language", request.language().toLowerCase(),
                            "code", request.code()))
                    .retrieve()
                    .body(AiResponse.class);
        } catch (RestClientException e) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, NOT_REACHABLE);
        }
        if (response == null) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI engine returned an empty response");
        }
        return response;
    }

    /** Ask the engine for an AI-corrected version of the code. */
    public FixResponse fix(String language, String code, List<IssueDto> issues) {
        FixResponse response;
        try {
            response = client.post()
                    .uri("/fix")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of(
                            "language", language,
                            "code", code,
                            "issues", issues))
                    .retrieve()
                    .body(FixResponse.class);
        } catch (RestClientException e) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, NOT_REACHABLE);
        }
        if (response == null) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI engine returned an empty response");
        }
        return response;
    }
}
