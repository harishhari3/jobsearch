package com.jobpulse.user;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CallLogRepository extends JpaRepository<CallLog, Long> {
  List<CallLog> findByUserIdOrderByCreatedAtDesc(Long userId);
}
