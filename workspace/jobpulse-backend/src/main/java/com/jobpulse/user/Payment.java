package com.jobpulse.user;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "payments")
public class Payment {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "order_id", nullable = false, unique = true)
  private String orderId;

  @Column(name = "payment_id")
  private String paymentId;

  @Column(name = "signature")
  private String signature;

  @Column(nullable = false)
  private double amount;

  @Column(nullable = false)
  private String status;

  @Column(name = "created_at")
  private Instant createdAt = Instant.now();

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  public Payment() {}

  public Payment(String orderId, double amount, String status, User user) {
    this.orderId = orderId;
    this.amount = amount;
    this.status = status;
    this.user = user;
    this.createdAt = Instant.now();
  }

  public Long getId() { return id; }
  public String getOrderId() { return orderId; }
  public void setOrderId(String orderId) { this.orderId = orderId; }
  public String getPaymentId() { return paymentId; }
  public void setPaymentId(String paymentId) { this.paymentId = paymentId; }
  public String getSignature() { return signature; }
  public void setSignature(String signature) { this.signature = signature; }
  public double getAmount() { return amount; }
  public void setAmount(double amount) { this.amount = amount; }
  public String getStatus() { return status; }
  public void setStatus(String status) { this.status = status; }
  public Instant getCreatedAt() { return createdAt; }
  public User getUser() { return user; }
  public void setUser(User user) { this.user = user; }
}
