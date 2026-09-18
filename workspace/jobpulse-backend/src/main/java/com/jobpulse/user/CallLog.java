package com.jobpulse.user;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "call_logs")
public class CallLog {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private int duration;

  @Column(nullable = false)
  private String persona;

  @Lob
  @Column(name = "transcript_text", columnDefinition = "CLOB", nullable = false)
  private String transcriptText;

  @Column(name = "created_at")
  private Instant createdAt = Instant.now();

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  public CallLog() {}

  public CallLog(int duration, String persona, String transcriptText, User user) {
    this.duration = duration;
    this.persona = persona;
    this.transcriptText = transcriptText;
    this.user = user;
    this.createdAt = Instant.now();
  }

  public Long getId() { return id; }
  public int getDuration() { return duration; }
  public void setDuration(int duration) { this.duration = duration; }
  public String getPersona() { return persona; }
  public void setPersona(String persona) { this.persona = persona; }
  public String getTranscriptText() { return transcriptText; }
  public void setTranscriptText(String transcriptText) { this.transcriptText = transcriptText; }
  public Instant getCreatedAt() { return createdAt; }
  public User getUser() { return user; }
  public void setUser(User user) { this.user = user; }
}
