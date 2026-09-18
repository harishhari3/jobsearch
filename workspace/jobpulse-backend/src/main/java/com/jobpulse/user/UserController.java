package com.jobpulse.user;

import com.jobpulse.config.AppProperties;
import com.jobpulse.dto.UserDto;
import com.jobpulse.exception.NotFoundException;
import com.jobpulse.security.UserPrincipal;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/api")
public class UserController {

  private final UserRepository userRepository;
  private final ResumeRepository resumeRepository;
  private final PaymentRepository paymentRepository;
  private final ExamScoreRepository examScoreRepository;
  private final CallLogRepository callLogRepository;
  private final AppProperties appProperties;
  private final RestTemplate restTemplate;

  public UserController(UserRepository userRepository, ResumeRepository resumeRepository,
                        PaymentRepository paymentRepository, ExamScoreRepository examScoreRepository,
                        CallLogRepository callLogRepository, AppProperties appProperties,
                        RestTemplate restTemplate) {
    this.userRepository = userRepository;
    this.resumeRepository = resumeRepository;
    this.paymentRepository = paymentRepository;
    this.examScoreRepository = examScoreRepository;
    this.callLogRepository = callLogRepository;
    this.appProperties = appProperties;
    this.restTemplate = restTemplate;
  }

  @GetMapping("/users/me")
  public ResponseEntity<UserDto> getMe(@AuthenticationPrincipal UserPrincipal principal) {
    User user = userRepository.findById(principal.id())
        .orElseThrow(() -> new NotFoundException("User not found"));
    return ResponseEntity.ok(UserDto.from(user));
  }

  // --- Resume Endpoints ---

  @GetMapping("/resumes")
  public ResponseEntity<Map<String, Object>> getResume(@AuthenticationPrincipal UserPrincipal principal) {
    Optional<Resume> resumeOpt = resumeRepository.findByUserId(principal.id());
    if (resumeOpt.isEmpty()) {
      return ResponseEntity.notFound().build();
    }
    Resume resume = resumeOpt.get();
    return ResponseEntity.ok(Map.of(
        "fileName", resume.getFileName(),
        "text", resume.getText(),
        "level", resume.getLevel(),
        "updatedAt", resume.getUpdatedAt().toString()
    ));
  }

  @PostMapping("/resumes")
  public ResponseEntity<Map<String, String>> saveResume(@AuthenticationPrincipal UserPrincipal principal,
                                                        @RequestBody Map<String, String> body) {
    String fileName = body.get("fileName");
    String text = body.get("text");
    String level = body.get("level");

    if (fileName == null || text == null || level == null) {
      return ResponseEntity.badRequest().body(Map.of("error", "fileName, text, and level are required"));
    }

    User user = userRepository.findById(principal.id())
        .orElseThrow(() -> new NotFoundException("User not found"));
    Optional<Resume> existingOpt = resumeRepository.findByUser(user);
    Resume resume;
    if (existingOpt.isPresent()) {
      resume = existingOpt.get();
      resume.setFileName(fileName);
      resume.setText(text);
      resume.setLevel(level);
      resume.setUpdatedAt(Instant.now());
    } else {
      resume = new Resume(fileName, text, level, user);
    }

    resumeRepository.save(resume);
    return ResponseEntity.ok(Map.of("message", "Resume saved successfully"));
  }

  // --- Payment Endpoints ---

  @PostMapping("/payments/order")
  public ResponseEntity<?> createOrder(@AuthenticationPrincipal UserPrincipal principal,
                                       @RequestBody Map<String, Object> body) {
    try {
      double amount = Double.parseDouble(body.getOrDefault("amount", "299").toString());
      String currency = body.getOrDefault("currency", "INR").toString();
      String receipt = body.getOrDefault("receipt", "exam_" + System.currentTimeMillis()).toString();

      if (isRazorpayPlaceholder()) {
        String orderId = "mock_order_" + System.currentTimeMillis();
        User user = userRepository.findById(principal.id())
            .orElseThrow(() -> new NotFoundException("User not found"));
        paymentRepository.save(new Payment(orderId, amount, "created", user));
        return ResponseEntity.ok(Map.of(
            "id", orderId,
            "amount", Math.round(amount * 100),
            "currency", currency,
            "receipt", receipt,
            "mock", true
        ));
      }

      String rzpUrl = "https://api.razorpay.com/v1/orders";

      HttpHeaders headers = new HttpHeaders();
      headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

      String auth = appProperties.razorpayKeyId + ":" + appProperties.razorpayKeySecret;
      byte[] encodedAuth = Base64.getEncoder().encode(auth.getBytes(StandardCharsets.UTF_8));
      headers.set("Authorization", "Basic " + new String(encodedAuth));

      MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
      map.add("amount", String.valueOf(Math.round(amount * 100)));
      map.add("currency", currency);
      map.add("receipt", receipt);
      map.add("notes[product]", "jobpulse_skill_exam");

      HttpEntity<MultiValueMap<String, String>> requestEntity = new HttpEntity<>(map, headers);
      ResponseEntity<Map> response = restTemplate.postForEntity(rzpUrl, requestEntity, Map.class);

      if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
        String orderId = response.getBody().get("id").toString();
        User user = userRepository.findById(principal.id())
            .orElseThrow(() -> new NotFoundException("User not found"));
        Payment payment = new Payment(orderId, amount, "created", user);
        paymentRepository.save(payment);
        return ResponseEntity.ok(response.getBody());
      }

      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Failed to create Razorpay order"));
    } catch (Exception e) {
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
    }
  }

  @PostMapping("/payments/verify")
  public ResponseEntity<Map<String, Object>> verifyPayment(@AuthenticationPrincipal UserPrincipal principal,
                                                           @RequestBody Map<String, String> body) {
    String orderId = body.get("orderId");
    String paymentId = body.get("paymentId");
    String signature = body.get("signature");

    if (orderId == null || paymentId == null || signature == null) {
      return ResponseEntity.badRequest().body(Map.of("error", "orderId, paymentId, and signature are required"));
    }

    if (orderId.startsWith("mock_order_")) {
      User user = userRepository.findById(principal.id())
          .orElseThrow(() -> new NotFoundException("User not found"));
      Optional<Payment> paymentOpt = paymentRepository.findByOrderId(orderId);
      if (paymentOpt.isPresent()) {
        Payment payment = paymentOpt.get();
        payment.setPaymentId(paymentId);
        payment.setSignature(signature);
        payment.setStatus("paid");
        paymentRepository.save(payment);
      } else {
        Payment payment = new Payment(orderId, 299.00, "paid", user);
        payment.setPaymentId(paymentId);
        payment.setSignature(signature);
        paymentRepository.save(payment);
      }
      return ResponseEntity.ok(Map.of("verified", true, "message", "Mock payment verified"));
    }

    boolean isValid = verifyRazorpaySignature(orderId, paymentId, signature, appProperties.razorpayKeySecret);
    if (!isValid) {
      return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Invalid signature verification failed"));
    }

    User user = userRepository.findById(principal.id())
        .orElseThrow(() -> new NotFoundException("User not found"));
    Optional<Payment> paymentOpt = paymentRepository.findByOrderId(orderId);
    if (paymentOpt.isPresent()) {
      Payment payment = paymentOpt.get();
      payment.setPaymentId(paymentId);
      payment.setSignature(signature);
      payment.setStatus("paid");
      paymentRepository.save(payment);
    } else {
      Payment payment = new Payment(orderId, 299.00, "paid", user);
      payment.setPaymentId(paymentId);
      payment.setSignature(signature);
      paymentRepository.save(payment);
    }

    return ResponseEntity.ok(Map.of("verified", true, "message", "Payment verified successfully"));
  }

  // --- Exam/Assessment Endpoints ---

  @GetMapping("/exams/status")
  public ResponseEntity<Map<String, Object>> getExamStatus(@AuthenticationPrincipal UserPrincipal principal) {
    boolean unlocked = paymentRepository.existsByUserIdAndStatus(principal.id(), "paid");

    List<ExamScore> scores = examScoreRepository.findByUserIdOrderByTakenAtDesc(principal.id());
    Map<String, Object> lastScore = null;
    if (!scores.isEmpty()) {
      ExamScore latest = scores.get(0);
      lastScore = Map.of(
          "correct", latest.getCorrect(),
          "wrong", latest.getWrong(),
          "skipped", latest.getSkipped(),
          "total", latest.getTotal(),
          "time", latest.getTakenAt().toString()
      );
    }

    return ResponseEntity.ok(Map.of(
        "unlocked", unlocked,
        "lastScore", lastScore != null ? lastScore : Collections.emptyMap()
    ));
  }

  @PostMapping("/exams/score")
  public ResponseEntity<Map<String, String>> saveExamScore(@AuthenticationPrincipal UserPrincipal principal,
                                                           @RequestBody Map<String, Integer> body) {
    Integer correct = body.get("correct");
    Integer wrong = body.get("wrong");
    Integer skipped = body.get("skipped");
    Integer total = body.get("total");

    if (correct == null || wrong == null || skipped == null || total == null) {
      return ResponseEntity.badRequest().body(Map.of("error", "correct, wrong, skipped, and total are required"));
    }

    User user = userRepository.findById(principal.id())
        .orElseThrow(() -> new NotFoundException("User not found"));
    ExamScore score = new ExamScore(correct, wrong, skipped, total, user);
    examScoreRepository.save(score);

    return ResponseEntity.ok(Map.of("message", "Score saved successfully"));
  }

  // --- AI Voice Assistant Call Log Endpoints ---

  @GetMapping("/calls")
  public ResponseEntity<List<Map<String, Object>>> getCalls(@AuthenticationPrincipal UserPrincipal principal) {
    List<CallLog> calls = callLogRepository.findByUserIdOrderByCreatedAtDesc(principal.id());
    List<Map<String, Object>> list = new ArrayList<>();
    for (CallLog log : calls) {
      list.add(Map.of(
          "id", log.getId(),
          "duration", log.getDuration(),
          "persona", log.getPersona(),
          "transcriptText", log.getTranscriptText(),
          "createdAt", log.getCreatedAt().toString()
      ));
    }
    return ResponseEntity.ok(list);
  }

  @PostMapping("/calls")
  public ResponseEntity<Map<String, String>> saveCall(@AuthenticationPrincipal UserPrincipal principal,
                                                      @RequestBody Map<String, Object> body) {
    try {
      if (body.get("duration") == null || body.get("persona") == null || body.get("transcriptText") == null) {
        return ResponseEntity.badRequest().body(Map.of("error", "duration, persona, and transcriptText are required"));
      }

      int duration = Integer.parseInt(body.get("duration").toString());
      String persona = body.get("persona").toString();
      String transcriptText = body.get("transcriptText").toString();

      User user = userRepository.findById(principal.id())
          .orElseThrow(() -> new NotFoundException("User not found"));
      CallLog callLog = new CallLog(duration, persona, transcriptText, user);
      callLogRepository.save(callLog);

      return ResponseEntity.ok(Map.of("message", "Call transcript archived successfully"));
    } catch (Exception e) {
      return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }
  }

  // --- Helper Methods ---

  private boolean isRazorpayPlaceholder() {
    return appProperties.razorpayKeyId == null
        || appProperties.razorpayKeySecret == null
        || appProperties.razorpayKeyId.contains("placeholder")
        || appProperties.razorpayKeySecret.contains("placeholder");
  }

  private boolean verifyRazorpaySignature(String orderId, String paymentId, String signature, String secret) {
    try {
      String data = orderId + "|" + paymentId;
      Mac mac = Mac.getInstance("HmacSHA256");
      SecretKeySpec secretKeySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
      mac.init(secretKeySpec);
      byte[] rawHmac = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
      
      StringBuilder hexString = new StringBuilder();
      for (byte b : rawHmac) {
        String hex = Integer.toHexString(0xff & b);
        if (hex.length() == 1) {
          hexString.append('0');
        }
        hexString.append(hex);
      }
      return hexString.toString().equals(signature);
    } catch (Exception e) {
      return false;
    }
  }
}
