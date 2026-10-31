package com.codelens.repository;

import com.codelens.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    // Spring builds the SQL from the method name:
    // SELECT * FROM reviews WHERE user_id = ? ORDER BY created_at DESC
    List<Review> findAllByUserIdOrderByCreatedAtDesc(Long userId);

    // SELECT * FROM reviews WHERE id = ? AND user_id = ?
    Optional<Review> findByIdAndUserId(Long id, Long userId);
}
