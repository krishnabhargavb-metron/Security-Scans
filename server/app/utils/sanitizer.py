"""
Input sanitization utilities to prevent injection attacks.
"""
import re
from fastapi import HTTPException


class InputSanitizer:
    """Sanitizes user inputs to prevent injection attacks."""
    
    # GitHub username pattern: alphanumeric, hyphens, underscores
    # GitHub usernames: 1-39 characters
    GITHUB_USERNAME_PATTERN = re.compile(r'^[a-zA-Z0-9\-_]{1,39}$')
    
    # Valid GitHub token patterns
    GITHUB_TOKEN_PATTERN = re.compile(r'^gh[pousr]{1}_[a-zA-Z0-9]{36,255}$|^[a-f0-9]{40}$')
    
    # Characters that should not appear in logs
    LOG_INJECTION_CHARS = re.compile(r'[\n\r\x00\x1b]')
    
    # SQL injection patterns (basic detection for monitoring logs)
    SQL_PATTERNS = re.compile(
        r"('|(\")|(--)|(;)|(\/\*)|(union)|(select)|(insert)|(update)|(delete)|(drop))",
        re.IGNORECASE
    )

    @staticmethod
    def sanitize_username(username: str) -> str:
        """
        Validate and sanitize GitHub username.
        
        Args:
            username: The username to validate
            
        Returns:
            Sanitized username
            
        Raises:
            HTTPException: If username is invalid
        """
        if not username or not isinstance(username, str):
            raise HTTPException(
                status_code=400,
                detail="Username must be a non-empty string"
            )
        
        username = username.strip()
        
        # Check length
        if len(username) < 1 or len(username) > 39:
            raise HTTPException(
                status_code=400,
                detail="Username must be between 1 and 39 characters"
            )
        
        # Check pattern
        if not InputSanitizer.GITHUB_USERNAME_PATTERN.match(username):
            raise HTTPException(
                status_code=400,
                detail="Username can only contain letters, numbers, hyphens, and underscores"
            )
        
        return username

    @staticmethod
    def sanitize_token(token: str) -> str:
        """
        Validate and sanitize GitHub token.
        
        Args:
            token: The token to validate
            
        Returns:
            Sanitized token
            
        Raises:
            HTTPException: If token format is invalid
        """
        if not token or not isinstance(token, str):
            raise HTTPException(
                status_code=400,
                detail="Invalid token format"
            )
        
        token = token.strip()
        
        # Check if it matches expected GitHub token patterns
        # Pattern 1: ghp_* (Personal access token)
        # Pattern 2: gho_* (OAuth token)
        # Pattern 3: ghu_* (User-to-server token)
        # Pattern 4: ghs_* (Server-to-server token)
        # Pattern 5: ghr_* (Refresh token)
        # Pattern 6: 40 char hex (legacy token format)
        
        if not (token.startswith(('ghp_', 'gho_', 'ghu_', 'ghs_', 'ghr_')) or 
                (len(token) == 40 and re.match(r'^[a-f0-9]{40}$', token))):
            raise HTTPException(
                status_code=400,
                detail="Invalid GitHub token format"
            )
        
        return token

    @staticmethod
    def sanitize_for_logging(text: str, max_length: int = 255) -> str:
        """
        Sanitize text for safe logging (prevent log injection).
        Removes newlines, carriage returns, null bytes, and escape sequences.
        
        Args:
            text: The text to sanitize
            max_length: Maximum length to allow
            
        Returns:
            Sanitized text safe for logging
        """
        if not isinstance(text, str):
            text = str(text)
        
        # Remove log injection characters
        sanitized = InputSanitizer.LOG_INJECTION_CHARS.sub('', text)
        
        # Truncate if too long
        if len(sanitized) > max_length:
            sanitized = sanitized[:max_length] + '...'
        
        return sanitized

    @staticmethod
    def sanitize_limit(limit: int, default: int = 10, max_limit: int = 100) -> int:
        """
        Validate and sanitize limit parameter.
        
        Args:
            limit: The limit value
            default: Default limit if invalid
            max_limit: Maximum allowed limit
            
        Returns:
            Valid limit value
        """
        try:
            limit = int(limit)
            if limit < 1:
                return default
            if limit > max_limit:
                return max_limit
            return limit
        except (ValueError, TypeError):
            return default

    @staticmethod
    def sanitize_offset(offset: int, default: int = 0) -> int:
        """
        Validate and sanitize offset parameter.
        
        Args:
            offset: The offset value
            default: Default offset if invalid
            
        Returns:
            Valid offset value
        """
        try:
            offset = int(offset)
            if offset < 0:
                return default
            return offset
        except (ValueError, TypeError):
            return default

    @staticmethod
    def detect_sql_injection(text: str) -> bool:
        """
        Basic SQL injection pattern detection for logging/monitoring.
        This is a simple pattern-based detector and should not be relied upon
        as the sole defense against SQL injection.
        
        Args:
            text: The text to check
            
        Returns:
            True if suspicious SQL patterns detected, False otherwise
        """
        if not isinstance(text, str):
            return False
        
        return bool(InputSanitizer.SQL_PATTERNS.search(text))

    @staticmethod
    def sanitize_repo_name(repo_name: str) -> str:
        """
        Sanitize repository name for safe logging.
        GitHub repo names follow: owner/repo format
        
        Args:
            repo_name: The repository name (e.g., 'owner/repo')
            
        Returns:
            Sanitized repository name
        """
        if not isinstance(repo_name, str):
            return "unknown/unknown"
        
        # Sanitize for logging
        sanitized = InputSanitizer.sanitize_for_logging(repo_name, max_length=255)
        
        return sanitized.replace('\\', '/') if sanitized else "unknown/unknown"
