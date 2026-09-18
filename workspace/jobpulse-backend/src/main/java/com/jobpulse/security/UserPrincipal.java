package com.jobpulse.security;

import com.jobpulse.user.User;
import com.jobpulse.user.AuthProvider;

public record UserPrincipal(Long id, String email, String name, String avatar, AuthProvider provider) {
  public UserPrincipal(User user) {
    this(user.getId(), user.getEmail(), user.getName(), user.getAvatar(), user.getProvider());
  }
}
