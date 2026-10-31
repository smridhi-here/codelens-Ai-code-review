package com.codelens.dto;

/** Returned after signup/login: the token the browser must send afterwards. */
public record AuthResponse(String token, String name, String email) {}
