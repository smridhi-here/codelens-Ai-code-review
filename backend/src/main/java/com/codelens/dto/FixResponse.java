package com.codelens.dto;

/** Answer of the Python engine's POST /fix. If fixedCode is null, error says why. */
public record FixResponse(String fixedCode, String explanation, String error) {}
