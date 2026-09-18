package com.jobpulse.dto;

import com.jobpulse.user.AuthProvider;
import com.jobpulse.user.User;

public record UserDto(Long id, String email, String name, String avatar, AuthProvider provider, boolean emailVerified) {
  public static UserDto from(User user) {
    return new UserDto(user.getId(), user.getEmail(), user.getName(), user.getAvatar(), user.getProvider(), user.isEmailVerified());
  }
}
