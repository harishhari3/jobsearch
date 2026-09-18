package com.jobpulse.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class AppProperties {

  @Value("${app.jwt.secret}")
  public String jwtSecret;

  @Value("${app.jwt.expiration-ms}")
  public long jwtExpirationMs;

  @Value("${app.razorpay.key-id}")
  public String razorpayKeyId;

  @Value("${app.razorpay.key-secret}")
  public String razorpayKeySecret;

  @Value("${app.google.client-id}")
  public String googleClientId;

  @Value("${app.adzuna.app-id}")
  public String adzunaAppId;

  @Value("${app.adzuna.app-key}")
  public String adzunaAppKey;
}
