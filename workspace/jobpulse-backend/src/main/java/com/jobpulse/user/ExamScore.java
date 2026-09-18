package com.jobpulse.user;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "exam_scores")
public class ExamScore {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private int correct;

  @Column(nullable = false)
  private int wrong;

  @Column(nullable = false)
  private int skipped;

  @Column(nullable = false)
  private int total;

  @Column(name = "taken_at")
  private Instant takenAt = Instant.now();

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  public ExamScore() {}

  public ExamScore(int correct, int wrong, int skipped, int total, User user) {
    this.correct = correct;
    this.wrong = wrong;
    this.skipped = skipped;
    this.total = total;
    this.user = user;
    this.takenAt = Instant.now();
  }

  public Long getId() { return id; }
  public int getCorrect() { return correct; }
  public void setCorrect(int correct) { this.correct = correct; }
  public int getWrong() { return wrong; }
  public void setWrong(int wrong) { this.wrong = wrong; }
  public int getSkipped() { return skipped; }
  public void setSkipped(int skipped) { this.skipped = skipped; }
  public int getTotal() { return total; }
  public void setTotal(int total) { this.total = total; }
  public Instant getTakenAt() { return takenAt; }
  public void setTakenAt(Instant takenAt) { this.takenAt = takenAt; }
  public User getUser() { return user; }
  public void setUser(User user) { this.user = user; }
}
