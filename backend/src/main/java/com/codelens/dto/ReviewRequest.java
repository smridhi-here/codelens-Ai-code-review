package com.codelens.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** JSON the frontend sends: {"language":"python","code":"..."} */
public record ReviewRequest(
        @NotBlank
        @Pattern(regexp = "(?i)javascript|python", message = "language must be javascript or python")
        String language,

        @NotBlank(message = "code must not be empty")
        @Size(max = 50000, message = "code is too long (max 50000 characters)")
        String code
) {}
