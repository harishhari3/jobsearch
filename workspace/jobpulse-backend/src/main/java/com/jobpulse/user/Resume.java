package com.jobpulse.user;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "resumes")
public class Resume {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "file_name", nullable = false)
  private String fileName;

  @Lob
  @Column(columnDefinition = "CLOB", nullable = false)
  private String text;

  @Column(nullable = false)
  private String level;

  @Column(name = "updated_at")
  private Instant updatedAt = Instant.now();

  @OneToOne
  @JoinColumn(name = "user_id", nullable = false, unique = true)
  private User user;

  public Resume() {}

  public Resume(String fileName, String text, String level, User user) {
    this.fileName = fileName;
    this.text = text;
    this.level = level;
    this.user = user;
    this.updatedAt = Instant.now();
  }

  public Long getId() { return id; }
  public String getFileName() { return fileName; }
  public void setFileName(String fileName) { this.fileName = fileName; }
  public String getText() { return text; }
  public void setText(String text) { this.text = text; }
  public String getLevel() { return level; }
  public void setLevel(String level) { this.level = level; }
  public Instant getUpdatedAt() { return updatedAt; }
  public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
  public User getUser() { return user; }
  public void setUser(User user) { this.user = user; }
}
