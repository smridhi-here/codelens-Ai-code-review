package com.codelens.entity;

import jakarta.persistence.*;

/** One finding inside a review. Maps to the "issues" table. */
@Entity
@Table(name = "issues")
public class Issue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Many issues belong to one review (foreign key review_id).
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "review_id", nullable = false)
    private Review review;

    @Column(nullable = false, length = 20)
    private String severity;

    @Column(name = "rule_name", nullable = false, length = 60)
    private String rule;

    @Column(name = "line_no")
    private Integer line;

    @Column(nullable = false, length = 500)
    private String message;

    @Column(length = 500)
    private String suggestion;

    public Long getId() { return id; }
    public Review getReview() { return review; }
    public void setReview(Review review) { this.review = review; }
    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }
    public String getRule() { return rule; }
    public void setRule(String rule) { this.rule = rule; }
    public Integer getLine() { return line; }
    public void setLine(Integer line) { this.line = line; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getSuggestion() { return suggestion; }
    public void setSuggestion(String suggestion) { this.suggestion = suggestion; }
}
