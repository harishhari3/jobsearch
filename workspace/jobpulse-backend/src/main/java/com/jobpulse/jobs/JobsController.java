package com.jobpulse.jobs;

import com.jobpulse.config.AppProperties;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.Map;

@RestController
@RequestMapping("/api/jobs")
public class JobsController {

  private static final String ADZUNA_BASE = "https://api.adzuna.com/v1/api/jobs";

  private final AppProperties appProperties;
  private final RestTemplate restTemplate;

  public JobsController(AppProperties appProperties, RestTemplate restTemplate) {
    this.appProperties = appProperties;
    this.restTemplate = restTemplate;
  }

  @GetMapping("/{country}/search/{page}")
  public ResponseEntity<?> searchJobs(
      @PathVariable String country,
      @PathVariable int page,
      @RequestParam Map<String, String> params) {

    if (appProperties.adzunaAppId == null || appProperties.adzunaAppId.isBlank()
        || appProperties.adzunaAppKey == null || appProperties.adzunaAppKey.isBlank()) {
      return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
          .body(Map.of("error", "Adzuna API credentials are not configured on the server"));
    }

    UriComponentsBuilder builder = UriComponentsBuilder
        .fromHttpUrl(ADZUNA_BASE + "/" + country + "/search/" + page)
        .queryParam("app_id", appProperties.adzunaAppId)
        .queryParam("app_key", appProperties.adzunaAppKey);

    params.forEach((key, value) -> {
      if (value != null && !value.isBlank()
          && !key.equals("app_id") && !key.equals("app_key")) {
        builder.queryParam(key, value);
      }
    });

    URI uri = builder.build(true).toUri();
    return forward(uri);
  }

  @GetMapping("/{country}/categories")
  public ResponseEntity<?> getCategories(@PathVariable String country) {
    if (appProperties.adzunaAppId == null || appProperties.adzunaAppId.isBlank()
        || appProperties.adzunaAppKey == null || appProperties.adzunaAppKey.isBlank()) {
      return ResponseEntity.ok(Map.of("results", java.util.List.of()));
    }

    URI uri = UriComponentsBuilder
        .fromHttpUrl(ADZUNA_BASE + "/" + country + "/categories")
        .queryParam("app_id", appProperties.adzunaAppId)
        .queryParam("app_key", appProperties.adzunaAppKey)
        .queryParam("content-type", "application/json")
        .build(true)
        .toUri();

    return forward(uri);
  }

  private ResponseEntity<?> forward(URI uri) {
    try {
      Map<?, ?> body = restTemplate.getForObject(uri, Map.class);
      return ResponseEntity.ok(body);
    } catch (HttpClientErrorException ex) {
      return ResponseEntity.status(ex.getStatusCode()).body(Map.of("error", ex.getStatusText()));
    } catch (Exception ex) {
      return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
          .body(Map.of("error", "Could not reach the job search service"));
    }
  }
}
