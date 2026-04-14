"""
Unit tests for the input sanitizer module.
Tests cover various injection attack scenarios.
"""
import pytest
from fastapi import HTTPException
from app.utils.sanitizer import InputSanitizer


class TestUsernameValidation:
    """Test username validation and sanitization."""
    
    def test_valid_usernames(self):
        """Valid GitHub usernames should pass."""
        valid_usernames = [
            'torvalds',
            'octocat',
            'john-doe',
            'user_name',
            'test123',
            'a',  # minimum length
            'a' * 39  # maximum length
        ]
        
        for username in valid_usernames:
            result = InputSanitizer.sanitize_username(username)
            assert result == username.strip()
    
    def test_invalid_usernames(self):
        """Invalid GitHub usernames should raise HTTPException."""
        invalid_usernames = [
            '',  # empty
            ' ',  # whitespace only
            'user@domain',  # contains @
            'user!name',  # contains !
            'user name',  # contains space
            'user#name',  # contains #
            'user$name',  # contains $
            'a' * 40,  # exceeds max length
            '!@#$%',  # special characters
        ]
        
        for username in invalid_usernames:
            with pytest.raises(HTTPException):
                InputSanitizer.sanitize_username(username)
    
    def test_username_trimming(self):
        """Usernames with leading/trailing whitespace should be trimmed."""
        result = InputSanitizer.sanitize_username('  testuser  ')
        assert result == 'testuser'


class TestTokenValidation:
    """Test token validation and sanitization."""
    
    def test_valid_tokens(self):
        """Valid GitHub tokens should pass."""
        valid_tokens = [
            'ghp_' + 'a' * 36,  # Personal access token
            'gho_' + 'a' * 36,  # OAuth token
            'ghu_' + 'a' * 36,  # User-to-server token
            'ghs_' + 'a' * 36,  # Server-to-server token
            'ghr_' + 'a' * 36,  # Refresh token
            'a' * 40,  # Legacy 40-char hex token
        ]
        
        for token in valid_tokens:
            result = InputSanitizer.sanitize_token(token)
            assert result == token.strip()
    
    def test_invalid_tokens(self):
        """Invalid tokens should raise HTTPException."""
        invalid_tokens = [
            '',  # empty
            'invalid_token',  # wrong format
            'ghp_123',  # too short
            'ghp_' + 'Z' * 36,  # invalid characters for legacy format
            'random_string_that_is_not_a_github_token',
        ]
        
        for token in invalid_tokens:
            with pytest.raises(HTTPException):
                InputSanitizer.sanitize_token(token)


class TestLogInjectionPrevention:
    """Test sanitization for log injection prevention."""
    
    def test_removes_newlines(self):
        """Newlines should be removed from logs."""
        text = 'user\nname'
        result = InputSanitizer.sanitize_for_logging(text)
        assert '\n' not in result
    
    def test_removes_carriage_returns(self):
        """Carriage returns should be removed."""
        text = 'user\rname'
        result = InputSanitizer.sanitize_for_logging(text)
        assert '\r' not in result
    
    def test_removes_escape_sequences(self):
        """Escape sequences should be removed."""
        text = 'user\x1bname'
        result = InputSanitizer.sanitize_for_logging(text)
        assert '\x1b' not in result
    
    def test_truncates_long_strings(self):
        """Long strings should be truncated."""
        long_text = 'a' * 500
        result = InputSanitizer.sanitize_for_logging(long_text, max_length=100)
        assert len(result) <= 103  # 100 + '...'
        assert result.endswith('...')
    
    def test_complex_log_injection_attempt(self):
        """Complex log injection attempts should be neutralized."""
        injection = 'user\n[ERROR] Critical\r\nSystem compromised'
        result = InputSanitizer.sanitize_for_logging(injection)
        # No newlines or carriage returns
        assert '\n' not in result
        assert '\r' not in result


class TestSQLInjectionDetection:
    """Test SQL injection pattern detection."""
    
    def test_detects_sql_keywords(self):
        """Should detect common SQL keywords."""
        sql_attempts = [
            "'; DROP TABLE users; --",
            "1' UNION SELECT * FROM passwords --",
            "admin'--",
            "1; DELETE FROM users;",
            "1/* comment */ OR 1=1",
        ]
        
        for attempt in sql_attempts:
            assert InputSanitizer.detect_sql_injection(attempt)
    
    def test_legitimate_text_passes(self):
        """Legitimate text should not be flagged as SQL injection."""
        legitimate_texts = [
            'john_doe',
            'normal-username',
            'user@example.com',
            'password123',
            'hello world',
        ]
        
        for text in legitimate_texts:
            assert not InputSanitizer.detect_sql_injection(text)
    
    def test_case_insensitive_detection(self):
        """SQL injection detection should be case-insensitive."""
        assert InputSanitizer.detect_sql_injection('DROP table users')
        assert InputSanitizer.detect_sql_injection('drop TABLE users')
        assert InputSanitizer.detect_sql_injection('UnIoN select * from admin')


class TestLimitAndOffsetValidation:
    """Test limit and offset parameter validation."""
    
    def test_valid_limit(self):
        """Valid limit should pass through."""
        assert InputSanitizer.sanitize_limit(10) == 10
        assert InputSanitizer.sanitize_limit(1) == 1
        assert InputSanitizer.sanitize_limit(100) == 100
    
    def test_limit_exceeds_maximum(self):
        """Limit exceeding max should be capped."""
        result = InputSanitizer.sanitize_limit(1000, max_limit=100)
        assert result == 100
    
    def test_invalid_limit(self):
        """Invalid limit should return default."""
        assert InputSanitizer.sanitize_limit(0, default=10) == 10
        assert InputSanitizer.sanitize_limit(-5, default=10) == 10
    
    def test_valid_offset(self):
        """Valid offset should pass through."""
        assert InputSanitizer.sanitize_offset(0) == 0
        assert InputSanitizer.sanitize_offset(100) == 100
    
    def test_negative_offset(self):
        """Negative offset should return default."""
        assert InputSanitizer.sanitize_offset(-1, default=0) == 0
    
    def test_non_integer_values(self):
        """Non-integer values should be handled gracefully."""
        assert InputSanitizer.sanitize_limit('not_a_number', default=5) == 5
        assert InputSanitizer.sanitize_offset('invalid', default=0) == 0


class TestRepositoryNameSanitization:
    """Test repository name sanitization for logging."""
    
    def test_normal_repo_name(self):
        """Normal repo names should be returned as-is."""
        repo_name = 'torvalds/linux'
        result = InputSanitizer.sanitize_repo_name(repo_name)
        assert result == repo_name
    
    def test_repo_name_with_injection(self):
        """Repo names with injection attempts should be neutralized."""
        repo_name = 'user/repo\n[CRITICAL] System'
        result = InputSanitizer.sanitize_repo_name(repo_name)
        assert '\n' not in result
    
    def test_backslash_conversion(self):
        """Backslashes should be converted to forward slashes."""
        repo_name = 'user\\repo'
        result = InputSanitizer.sanitize_repo_name(repo_name)
        assert '\\' not in result
        assert result == 'user/repo'
    
    def test_invalid_repo_name_type(self):
        """Non-string repo names should be handled."""
        result = InputSanitizer.sanitize_repo_name(None)
        assert result == "unknown/unknown"
        
        result = InputSanitizer.sanitize_repo_name(123)
        assert "---" not in result  # Should not fail


class TestIntegration:
    """Integration tests for complete sanitization flow."""
    
    def test_compromised_authorization_header(self):
        """Authorization headers with SQL injection should be detected."""
        auth_headers = [
            "token ghp_1234567890abc; DROP TABLE users--",
            "token ' OR '1'='1",
        ]
        
        for auth_header in auth_headers:
            # Extract token part
            parts = auth_header.split()
            if len(parts) >= 2:
                # SQL injection detection on header
                assert InputSanitizer.detect_sql_injection(auth_header)
    
    def test_full_request_sanitization_flow(self):
        """Test complete sanitization of a full request."""
        # Simulating a normal request
        username = '  torvalds  '
        limit = 50
        offset = 0
        
        # Sanitize all inputs
        clean_username = InputSanitizer.sanitize_username(username)
        clean_limit = InputSanitizer.sanitize_limit(limit)
        clean_offset = InputSanitizer.sanitize_offset(offset)
        
        assert clean_username == 'torvalds'
        assert clean_limit == 50
        assert clean_offset == 0
