package com.jobpulse.dto;

import jakarta.validation.constraints.NotBlank;

public record GoogleLoginRequest(
    @NotBlank(message = "Token is required")
    String token
) {}
