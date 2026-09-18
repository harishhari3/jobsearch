package com.jobpulse.user;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ExamScoreRepository extends JpaRepository<ExamScore, Long> {
  List<ExamScore> findByUserIdOrderByTakenAtDesc(Long userId);
}
