package com.jobpulse.user;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ResumeRepository extends JpaRepository<Resume, Long> {
  Optional<Resume> findByUser(User user);
  Optional<Resume> findByUserId(Long userId);
}
