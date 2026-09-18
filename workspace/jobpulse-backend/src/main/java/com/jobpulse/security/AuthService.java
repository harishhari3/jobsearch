package com.jobpulse.security;

import com.jobpulse.config.AppProperties;
import com.jobpulse.dto.AuthResponse;
import com.jobpulse.dto.GoogleLoginRequest;
import com.jobpulse.dto.LoginRequest;
import com.jobpulse.dto.RegisterRequest;
import com.jobpulse.dto.UserDto;
import com.jobpulse.exception.DuplicateEmailException;
import com.jobpulse.user.AuthProvider;
import com.jobpulse.user.User;
import com.jobpulse.user.UserRepository;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.Optional;

@Service
public class AuthService {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtService jwtService;
  private final AppProperties appProperties;
  private final RestTemplate restTemplate;

  public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                     JwtService jwtService, AppProperties appProperties, RestTemplate restTemplate) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
    this.jwtService = jwtService;
    this.appProperties = appProperties;
    this.restTemplate = restTemplate;
  }

  public AuthResponse register(RegisterRequest request) {
    if (userRepository.existsByEmail(request.email())) {
      throw new DuplicateEmailException("Email is already registered");
    }

    User user = new User(
        request.email(),
        passwordEncoder.encode(request.password()),
        request.name(),
        AuthProvider.LOCAL,
        null
    );

    user = userRepository.save(user);
    String token = jwtService.generateToken(user);
    return new AuthResponse(token, UserDto.from(user));
  }

  public AuthResponse login(LoginRequest request) {
    User user = userRepository.findByEmail(request.email())
        .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

    if (user.getProvider() != AuthProvider.LOCAL) {
      throw new IllegalArgumentException("This account is configured for Google login. Please sign in with Google.");
    }

    if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
      throw new BadCredentialsException("Invalid email or password");
    }

    String token = jwtService.generateToken(user);
    return new AuthResponse(token, UserDto.from(user));
  }

  @SuppressWarnings("unchecked")
  public AuthResponse loginWithGoogle(GoogleLoginRequest request) {
    String googleUrl = "https://oauth2.googleapis.com/tokeninfo?id_token=" + request.token();
    Map<String, Object> payload;
    try {
      payload = restTemplate.getForObject(googleUrl, Map.class);
    } catch (Exception e) {
      throw new IllegalArgumentException("Invalid Google token");
    }

    if (payload == null || payload.containsKey("error")) {
      throw new IllegalArgumentException("Invalid Google token");
    }

    String aud = (String) payload.get("aud");
    if (appProperties.googleClientId != null && !appProperties.googleClientId.isBlank() &&
        !appProperties.googleClientId.startsWith("your-google-client-id") && !appProperties.googleClientId.equals(aud)) {
      throw new IllegalArgumentException("Audience mismatch: invalid client ID");
    }

    String email = (String) payload.get("email");
    String name = (String) payload.get("name");
    String picture = (String) payload.get("picture");
    String sub = (String) payload.get("sub");
    boolean emailVerified = "true".equals(String.valueOf(payload.get("email_verified")));

    if (email == null) {
      throw new IllegalArgumentException("Google token does not contain an email");
    }

    Optional<User> existingUserOpt = userRepository.findByEmail(email);
    User user;
    if (existingUserOpt.isPresent()) {
      user = existingUserOpt.get();
      if (user.getProvider() != AuthProvider.GOOGLE) {
        user.setProvider(AuthProvider.GOOGLE);
        user.setProviderId(sub);
        if (picture != null) user.setAvatar(picture);
        user.setEmailVerified(emailVerified);
        user = userRepository.save(user);
      }
    } else {
      user = new User(email, null, name, AuthProvider.GOOGLE, sub);
      if (picture != null) user.setAvatar(picture);
      user.setEmailVerified(emailVerified);
      user = userRepository.save(user);
    }

    String token = jwtService.generateToken(user);
    return new AuthResponse(token, UserDto.from(user));
  }
}
