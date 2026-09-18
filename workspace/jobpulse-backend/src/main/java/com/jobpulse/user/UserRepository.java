package com.jobpulse.user;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
  Optional<User> findByEmail(String email);
  Optional<User> findByEmailAndProvider(String email, AuthProvider provider);
  boolean existsByEmail(String email);
}
